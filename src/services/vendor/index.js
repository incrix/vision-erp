const vendor = require("../../models/vendor");
const { getDateCreated,} = require('../../utils/createDate')
module.exports = class Vendor {
  async createVendor({
    req,
    services,
    name,
    email,
    phone,
    companyDetails,
    billingAddress,
    shippingAddress,
    balance,
  }) {
    const { getDate, getTime, getDateMilliseconds } = await getDateCreated();
    return await vendor
      .create({
        name,
        timestamps:{
          date: getDate,
          time: getTime,
          dateMilliseconds: getDateMilliseconds
        },
        orgId:req.session.orgId,
        email,
        phone,
        companyDetails,
        billingAddress,
        shippingAddress,
        balance,
      })
      .then( async (vendorResponse) =>{
        if(vendorResponse.balance.value > 0) 
       return await services.payment
        .createPayment({
          orgId:req.session.orgId,
          clientId:vendorResponse._id,
          name:vendorResponse.name,
          amount:vendorResponse.balance.value,
          mode:"cash",
          timestamps:{
            date: getDate,
            time: getTime,
            dateMilliseconds: getDateMilliseconds
          },
          type:vendorResponse.balance.type,
        })
        .then((getPayResult) => {
         if(getPayResult.status == "error") return getPayResult
          return {
            status: "success",
            message: "vendor created successfully",
          };
        }) .catch((error) => {
          console.log(error);
          return { status: "error", message: "can't create payment" };
        });
        return {
          status: "success",
          message: "vendor created successfully",
        };
    })
      .catch((error) => {
        return { status: "error", message: "can't create vendor" };
      });
  }

  async getAllVendor({ req, callback }) {
    return await vendor
      .find({ orgId: req.session.orgId })
      .then((vendorResponse) => {
        if (vendorResponse === null)
          return callback(null, {
            status: "error",
            message: "vendor not found",
          });
        callback(
          {
            status: "success",
            message: "get vendor successfully",
            data: vendorResponse,
          },
          false
        );
      })
      .catch((error) => {
        callback(null, error);
        return { status: "error", message: "get vendor failed" };
      });
  }
};
