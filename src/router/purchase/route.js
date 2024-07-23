const router = require("express").Router();
module.exports = ({ passport, services, log }) => {
  router.post("/create-purchase", async (req, res) => {
  try {
 return await services.purchase
      .createPurchase({body:req.body,req,services,callBack:function(err,data){ 
        if(err) return res.send(err);       
       return res.send(data);
    }});

    } catch (error) {
      console.log(error);
      res.json({ status: "error", message:"something went wrong"})
    }
    });

    router.get("/get-all-purchase", async (req, res) => {
      try {
        await services.purchase.getAllPurchase({req,callBack:function(err,data){ 
         if(err) return res.json(err);       
         res.json(data);
     }})
     } catch (error) {
      res.json({status: 'error', error: error});
    } 
    })

    router.post("/cancel-purchase", async (req, res) => {
      try {
        await services.purchase.cancelPurchase({id:req.body.id,req,services,callBack:function(err,data){ 
         if(err) return res.json(err);       
         res.json(data);
     }})
     } catch (error) {
      res.json({status: 'error', error: error});
    } 
    })



    router.post("/purchase-payment",async(req,res) =>{
      try {
        await services.purchase.purchasePayment({body:req.body,req,services,callBack:function(err,data){ 
         if(err) return res.json(err);       
         res.json(data);
     }})
    } catch (error) {
      res.json({status: 'error', error: error});
    }
    })

    router.post("/purchase-payment-through-balance",async(req,res) => {
await services.purchase.paymentThroughCurrentBalance({req,body:req.body,callBack:function(err,data){ 
  if(err) return res.json(err);       
  res.json(data);
}})
    })

  return router;
};
