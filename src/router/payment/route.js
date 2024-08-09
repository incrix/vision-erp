const router = require("express").Router();


module.exports = ({ passport, services, log }) => {
  router.get("/get-all-payment", async (req, res) => {
    try {
      return await services.payment.getAllPayment({
        req,
        callback: function (err, payment) {
          if (err) return res.json(err);
          return res.json(payment);
        },
      }).then;
    } catch (error) {
      res.json({ error: error.message });
    }
  });
  router.post("/create-payment", async (req, res) => {

    await services.payment
      .creatPaymentCheck({
        req,callback: (err, payment) => {
            if (err) return res.json(err);
            return res.json(payment);
          },
      })
  });

  router.post("/cancel-payment", async (req, res) => {
    await services.payment
      .cancelPaymentForManuel({
        req,callback: (err, payment) => {
            if (err) return res.json(err);
            return res.json(payment);
          },
      })
  });

  router.post("/pay-in", async (req, res) => {
    await services.payment
      .createPayIn({
        req,callback: (err, payment) => {
            if (err) return res.json(err);
            return res.json(payment);
          },
      })
  });
  router.post("/pay-out", async (req, res) => {
    await services.payment
      .createPayOut({
        req,callback: (err, payment) => {
            if (err) return res.json(err);
            return res.json(payment);
          },
      })
  });

  return router;
};
