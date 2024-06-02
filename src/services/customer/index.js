const customer = require("../../models/customer");
module.exports = class Customer {
  async createCustomer({
    req,
    type,
    name,
    email,
    phone,
    companyDetails,
    billingAddress,
    shippingAddress,
    balance,
  }) {
    console.log(req.session);
    try {
      return await customer
        .create({
          type,
          name,
          orgId:req.session.orgId,
          email,
          phone,
          companyDetails,
          billingAddress,
          shippingAddress,
          balance,
        })
        .then(async (customerResponse) => {
            console.log(customerResponse);
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
