const router = require("express").Router();
module.exports = ({ passport, services, log }) => {
  router.post("/create-invoice", async (req, res) => {
  try {
  await services.invoice
      .createInvoice({body:req.body,req,services,callBack:function(err,data){ 
        if(err) return res.send(err);       
        res.send(data);
    }});

    } catch (error) {
      console.log(error);
      res.json({ status: "error", message:"something went wrong"})
    }
    });

    router.get("/get-all-invoice", async (req, res) => {
      try {
        await services.invoice.getAllInvoice({req,callBack:function(err,data){ 
         if(err) return res.json(err);       
         res.json(data);
     }})
     } catch (error) {
      res.json({status: 'error', error: error});
    } 
    })

    router.post("/cancel-invoice", async (req, res) => {
      try {
        await services.invoice.cancelInvoice({invoiceId:req.body.invoiceId,req,callBack:function(err,data){ 
         if(err) return res.json(err);       
         res.json(data);
     }})
     } catch (error) {
      res.json({status: 'error', error: error});
    } 
    })

    router.post("/delete-invoice", async (req, res) => {
      try {
        await services.invoice.deleteInvoice({invoiceId:req.body.invoiceId,req,callBack:function(err,data){ 
         if(err) return res.json(err);       
         res.json(data);
     }})
     } catch (error) {
      res.json({status: 'error', error: error});
    } 
    })

  return router;
};
