const customer = require('../../models/customer')
module.exports = class Customer{
 async createCustomer({
    req,
    type,
    orgId,
    name,
    email,
    phone,
    companyDetails,
    billingAddress,
    shippingAddress,
    balance
 }){
     try {
        
       return await customer.create({
            type,
            name,
            orgId:req.session.orgId,
            email,
            orgId,
            phone,
            companyDetails,
            billingAddress,
            shippingAddress,
            balance
        })
        .then(async customerResponse => {
        
            return {status:"success",message:"customer created successfully"}
 
        })
        .catch(error => {
            console.log(error);
            return {status:"error",message:"can't create customer"}
        })
     } catch (error) {
        return {status:"error",message:"something went wrong"}
     }
  }
}