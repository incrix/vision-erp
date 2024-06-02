const router = require("express").Router();
module.exports = ({ passport, services, log }) => {
  router.post("/create-invoice", async (req, res) => {
  try {
  //  await services.invoice
  //     .createInvoice({body:req.body,req,callBack:(response) => console.log(response)})
  //     .then((response) => {
  //       return res.json(response);
  //     })
  //     .catch((err) => {
  //       console.log(err);
  //       res.json({ status: "error", message: "something went wrong" });
  //     });
  await services.invoice
      .createInvoice({body:req.body,req,callBack:function(err,data){ 
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
        await services.customer.getAllInvoice({req,callBack:function(err,data){ 
         if(err) return res.send(err);       
         res.json(data);
     }})
     } catch (error) {
      res.json({status: 'error', error: error});
    } 
    })


  return router;
};
