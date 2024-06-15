const customer = require("../../models/customer");
const { getDateCreated,} = require('../../utils/createDate')
module.exports = class Customer {
  async createCustomer({
    req,
    services,
    type,
    name,
    email,
    phone,
    companyDetails,
    billingAddress,
    shippingAddress,
    balance,
  }) {
  
    try {
      const { getDate, getTime, getDateMilliseconds } = await getDateCreated();
      console.log(balance.type =='out' ? balance.value : 0);
      return await customer
        .create({
          type,
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
          balance:{
            borrow:balance.type =='out' ? balance.value : 0,
            gave:balance.type =='in' ? balance.value : 0,
          }
        })
        .then(async (customerResponse) => {

            if(balance.value > 0) 
           return await services.payment
            .createPayment({
              orgId:req.session.orgId,
              clientId:customerResponse._id,
              name:customerResponse.name,
              amount:balance.value,
              mode:"cash",
              whose:"customer",
              timestamps:{
                date: getDate,
                time: getTime,
                dateMilliseconds: getDateMilliseconds
              },
              type: balance.type,
            })
            .then((getPayResult) => {
              if(getPayResult.status == "error") return getPayResult
              return {
                status: "success",
                message: "customer created successfully",
              };
            }) .catch((error) => {
              console.log(error);
              return { status: "error", message: "can't create payment" };
            });
            return {
              status: "success",
              message: "customer created successfully",
            };
        })
        .catch((error) => {
          console.log(error);
          return { status: "error", message: "can't create customer" };
        });
    } catch (error) {
      return { status: "error", message: "something went wrong" };
    }
  }
  getAllCustomer({ req, callBack }) {
    return customer
      .find({ orgId: req.session.orgId})
      .then((response) => callBack(response, false))
      .catch((error) => callBack(null,{status:"error",message:"couldn't find any customer"}));
  }
};
