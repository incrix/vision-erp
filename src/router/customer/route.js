const router = require("express").Router();

module.exports = ({ passport, services, log }) => {
  router.post("/create-customer", async (req, res) => {
    try {
      return await services.customer
        .createCustomer({ ...req.body, req, services })
        .then((response) => {
          return res.json(response);
        })
        .catch((error) => {
          return error;
        });
    } catch (error) {
      throw error;
    }
  });

  router.post("/payment-in-and-out", async (req, res) => {
    try {
      await services.customer.paymentInAndOut({
        req,
        services,
        callBack: function (err, data) {
          if (err) return res.send(err);
          res.json(data);
        },
      });
    } catch (error) {
      return { status: "error", message: error.message };
    }
  });
  router.get("/get-all-cus", async (req, res) => {
    try {
      await services.customer.getAllCustomer({
        req,
        callBack: function (err, data) {
          if (err) return res.send(err);
          res.json(data);
        },
      });
    } catch (error) {
      throw error;
    }
  });

  return router;
};
