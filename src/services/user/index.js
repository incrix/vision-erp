const user = require("../../models/user");
const otpTemp = require("../../utils/mailTemplates/mailOtpTemp");
const Org = require("../../models/Org.js");
const validator = require("email-validator");
const Category = require("../../models/category.js");
const Notification = require("../../models/notification.js");
module.exports = class User {
  constructor({ otp, mailSender }) {
    this.otp = otp;
    this.mailSender = mailSender;
  }
  async login(req) {
    try {
      const { email } = req.body;
      if (validator.validate(email)) {
        const getUser = await user.findOne({ email });
        if (!getUser) {
          return { status: "error", message: "User does not exist" };
        }
        const otp = this.otp.generateOtp();
        req.session.otp = otp;
        req.session.type = "userLogin"
        req.session.email = email
        req.session.userId = getUser._id
        return await this.sendOtp(email, otp)
          .then(async (response) => {
            getUser.OTP.code = otp;
            await getUser.save();
            return {
              status: "success",
              message: "OTP sent successfully",
            };
          })
          .catch((err) => {
            console.log(err);
            return { status: "error", message: "couldn't send OTP message" };
          });
      } else {
        return {
          status: "error",
          message: "Please enter a valid email",
        };
      }
    } catch (error) {
      console.log(error);
      return {
        status: "error",
        message: "something went wrong",
      };
    }
  }

  async resendOTP({ req }) {
    const otp = await this.otp.generateOtp();
    req.session.otp = otp;
    req.session.numOfattempts = 1;
    const htmlTemp = await otpTemp(otp);
    return await this.mailSender
      .sendMail({
        to: req.session.email,
        subject: "This is OTP",
        html: htmlTemp,
      })
      .then((mailSender) => {
        return { status: "success", message: "Resend OTP successfully" };
      })
      .catch((err) => {
        console.log(err);
        return { status: "error", message: "Error sending OTP" };
      });
  }
  async getUser(email) {
    const getResult = await user.findOne({ email });
    if (!getResult) return { message: "user is not found" };
    return getResult;
  }

  async sendOtp(email, otp) {
    // const getResult = await user.findOne({ email });
    // if (!getResult) return { message: "user is not found" };
    const htmlTemp = await otpTemp(otp);
    return await this.mailSender.sendMail({
      to: email,
      subject: "This is OTP",
      html: htmlTemp,
    });
  }
  async checkOTP({ otp, req }) {
  
    if (!req.session.numOfattempts) req.session.numOfattempts = 1;
    if (req.session.otp === otp && req.session.numOfattempts < process.env.OTP_ATTEMPT_LIMIT) {
      
       const getUser = await user.findOne({_id:req.session.userId})
       req.session.isLogin = true
       req.session.fill_the_details = getUser.orgList.length > 0
      return { status: "success", fill_the_details:getUser.orgList.length > 0,message: "OTP verified successfully" };
    } else if (req.session.numOfattempts > process.env.OTP_ATTEMPT_LIMIT) {
   
      return { status: "info", message: "your OTP is Expired" };
    } else {
      {
      
        req.session.numOfattempts++;
        return { status: "info", message: "OTP not verified" };
      }
    }
  }

  async checkOTPForCreateUser({ otp, req }) {
    if (!req.session.numOfattempts) req.session.numOfattempts = 1;
    if (req.session.otp === otp && req.session.numOfattempts < process.env.OTP_ATTEMPT_LIMIT) {

        if (req.session.email && req.session.name && req.session.otp) {
          const newUser = await user({
            email: req.session.email,
            OTP: { code: req.session.otp },
            name: req.session.name,
          });
          if (newUser) {
            await newUser.save();
            req.session.isLogin = true;
            req.session.fill_the_details = false;
            req.session.userId = newUser._id
            return { status: "success", type:"create", message: "User create successfully" };
          } else return { status: "error", message: "User creation failed" };
        } else return { status: "error", message: "something went wrong" };

        // status: "success", message: "OTP verified successfully"
       
    } else if (req.session.numOfattempts > process.env.OTP_ATTEMPT_LIMIT) {
      return { status: "info", message: "your OTP is Expired" };
    } else {
      {
        req.session.numOfattempts++;
        return { status: "info", message: "OTP not verified" };
      }
    }
  }


  async createUserEmail({ email, name, req }) {
    const getUser = await user.findOne({ email });
    if (getUser) return { status: "info", message: "user already exists" };
    const otp = await this.otp.generateOtp();
   
    req.session.otp = otp;
    req.session.type = "userCreate"
    req.session.name = name;
    req.session.email = email;
    await this.sendOtp(email, otp);
    if (!getUser) {
      return { status: "success", message: "sent otp successfully" };
    }
  }

  // async getStart({ req }) {
  //   if (req.session.email && req.session.name && req.session.otp) {
  //     const newUser = await user({
  //       email: req.session.email,
  //       OTP: { code: req.session.otp },
  //       name: req.session.name,
  //     });
  //     if (newUser) {
  //       await newUser.save();
  //       return { status: "success", message: "User create successfully" };
  //     } else return { status: "error", message: "User creation failed" };
  //   } else return { status: "error", message: "something went wrong" };
  // }

  async getBusinessSave({ 
    req , 
    orgName,
    industryName,
    orgEmail,
    orgPhone,
    orgGST,
    orgAddress_1,
    orgAddress_2,
    city,
    state,
    pincode,
    avatar,
    gender,
    orgLogo, }) {
    const business = await user.findOne({ _id: req.session.userId });
    if (business) {
      const organization = await Org.findOne({
        userId: business._id,
        name: orgName,
      });
      if (organization)
        return {
          status: "error",
          message: "the organization name already exists",
        };
      return await Org.create({
        userId: business._id,
        name: orgName,
        industry:industryName,
        phone: orgPhone,
        email: orgEmail,
        GSTPin: req.session.orgGST,
        addGST: req.session.orgGST == "" ? false : true,
        billingAddress: {
          lineOne: orgAddress_1,
          lineTwo: orgAddress_2,
          city: city,
          state: state,
          zipCode: pincode,
        },
        logoUrl: orgLogo,
      })
        .then(async (orgResult) => {
         // await orgResult.save();
          return await user
            .findOne({ _id: req.session.userId})
            .then(async (userResult) => {
              userResult.avatar = avatar;
              userResult.gender = gender;
              userResult.orgList.push({ orgID: orgResult._id });
              await userResult.save();
              const getCatogory = await Category({ userId: userResult._id })
              await getCatogory.save();
              const notification = await Notification({ userId: userResult._id,orgID: orgResult._id});
              await notification.save();
              req.session.isLogin = true
              req.session.fill_the_details = true
              return {
                status: "success",
                message: "Successfully saved your information",
              };
            })
            .catch((err) => {
              console.log(err);
              return { status: "error", message: "Can't find your details" };
            });
        })
        .catch((err) => {
          console.log(err);
          return { status: "error", message: "Can't save your information" };
        });
    } else return { status: "error", message: "User creation failed" };
  }

  // async getBusinessSave({ req, orgLogo, avatar, gender }) {
  //   const business = await user.findOne({ email: req.session.email });
  //   if (business) {
  //     req.session.userId = business._id;
  //     const organization = await Org.findOne({
  //       userId: business._id,
  //       name: req.session.organizationName,
  //     });
  //     if (organization)
  //       return {
  //         status: "error",
  //         message: "the organization name already exists",
  //       };
  //     return await Org.create({
  //       userId: business._id,
  //       name: req.session.organizationName,
  //       industry: req.session.industryName,
  //       phone: req.session.orgNum,
  //       email: req.session.orgEmail,
  //       GSTPin: req.session.orgGST,
  //       addGST: req.session.orgGST == "" ? false : true,
  //       billingAddress: {
  //         lineOne: req.session.address1,
  //         lineTwo: req.session.address2,
  //         city: req.session.city,
  //         state: req.session.state,
  //         zipCode: req.session.zipCode,
  //       },
  //       logoUrl: orgLogo,
  //     })
  //       .then(async (orgResult) => {
  //        // await orgResult.save();
  //         return await user
  //           .findOne({ email: req.session.email })
  //           .then(async (userResult) => {
  //             userResult.avatar = avatar;
  //             userResult.gender = gender;
  //             userResult.orgList.push({ orgID: orgResult._id });
  //             await userResult.save();
  //             const getCatogory = await Category({ userId: userResult._id })
  //             await getCatogory.save();
  //             const notification = await Notification({ userId: userResult._id,orgID: orgResult._id});
  //             await notification.save();
  //             return {
  //               status: "success",
  //               message: "Successfully saved your information",
  //             };
  //           })
  //           .catch((err) => {
  //             return { status: "error", message: "Can't find your details" };
  //           });
  //       })
  //       .catch((err) => {
  //         console.log(err);
  //         return { status: "error", message: "Can't save your information" };
  //       });
  //   } else return { status: "error", message: "User creation failed" };
  // }
};
