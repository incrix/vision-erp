const router = require("express").Router();

module.exports = ({ passport, services, log }) => {
   router.post('/create-customer',async (req,res)=>{
    try {
        req.body.req = req 
       await services.customer.createCustomer(req.body)
      .then((response) => {
            console.log(response);
            return res.json(response)
        })
      .catch((error) => {
            return error;
        });
    } catch (error) {
        throw error;
   } 
})

router.get('/get-all-cus',async (req,res)=>{
    try {
  
       await services.customer.getAllCustomer({req,callBack:function(err,data){ 
        if(err) return res.send(err);       
        res.json(data);
    }})
    } catch (error) {
        throw error;
   } 
})

return router
}