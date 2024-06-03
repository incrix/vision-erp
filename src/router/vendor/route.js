const router = require("express").Router();
module.exports = ({ passport, services, log }) => {
  router.post("/create-vendor", async (req, res) => {
  try {
   await services.vendor
      .createVendor(req.body,req)
      .then((responseVendor) => {
        return res.json(responseVendor);
      })
      .catch((err) => {
        console.log(err);
        res.json({ status: "error", message: "something went wrong" });
      });
    } catch (error) {
      console.log(error);
      res.json({ status: "error", message:"something went wrong"})
    }
    });

    router.get('/get-all-vendor',(req, res) =>{
      services.vendor.getAllVendor({req,callback:function(err,data){ 
        if(err) return res.json(err);       
        res.json(data);
    }})
    })


  return router;
};
