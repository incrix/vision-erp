const Vendor = require("../../models/vendor")
const Customer  = require("../../models/customer")

exports.getClientVerify = async ({payFor,clientId,req}) =>{
   
  if(payFor == "customer") {
    return await Customer.findOne({orgId:req.session.orgId,_id:clientId}).catch(err => {
        return {
            status: "error",
            message: "something went wrong in client id",
        }
    })
  }
  if(payFor == "vendor") {
    return await Vendor.findOne({orgId:req.session.orgId,_id:clientId}).catch(err => {
        return {
            status: "error",
            message: "something went wrong in client id",
        }
    })
  }
  return null;
}