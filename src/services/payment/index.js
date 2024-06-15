const payment = require("../../models/payment");
const {
  getClientVerify,
  decreaseTheClientBalanceInOrOut,
  addBalanceWithInandOut,
  checkTheBalanceWithInandOutForCancelPay,
} = require("./payUtil");
const { getDateCreated } = require("../../utils/createDate");
const Customer = require("../../models/customer");
module.exports = class Payment {
  async createPayment({
    orgId,
    clientId,
    documents,
    amount,
    mode,
    whose,
    name,
    timestamps,
    description,
    type,
  }) {
    return await payment
      .create({
        orgId,
        clientId,
        name,
        amount,
        mode,
        whose,
        type,
        description,
        documents: documents == undefined ? [] : documents,
        timestamps,
      })
      .then((response) => {
        return {
          status: "success",
          message: "Create payment successfully",
          id: response._id,
        };
      })
      .catch((error) => {
        console.log(error);
        return {
          status: "error",
          message: "Getting error when create payment",
        };
      });
  }

  async creatPaymentCheck({ req, callback }) {
    try {
      let getClient = await getClientVerify({ ...req.body, req });
      const { getDate, getTime, getDateMilliseconds } = getDateCreated;
      console.log(getClient);
      if (getClient == null || !getClient)
        return callback(null, {
          status: "error",
          message: "Create payment check failed",
        });
      this.createPayment({
        orgId: req.session.orgId,
        clientId: getClient._id,
        name: getClient.name,
        amount: req.body.amount,
        mode: req.body.mode,
        whose: req.body.whose,
        timestamps: {
          date: getDate,
          time: getTime,
          dateMilliseconds: getDateMilliseconds,
        },
        type: req.body.type,
        description:
          req.body.description == undefined ? "" : req.body.description,
        documents:
          req.body.documents == undefined ? undefined : req.body.documents,
      })
        .then(async (getPayResult) => {
          if (req.body.amount > 0 ) {
            getClient = await addBalanceWithInandOut({
              amount: req.body.amount,
              getClient,
              type: req.body.type,
            })

            getClient.save();
          }
          return await callback(getPayResult);
        })
        .catch((err) => {
          console.log(err);
          return callback(null, {
            status: "error",
            message: "Getting Error When Create Invoice",
          });
        });
    } catch (error) {
      callback(null, error.message);
    }
  }

  async getAllPayment({ req, callback }) {
    try {
      await payment
        .find({ orgId: req.session.orgId })
        .then((response) => {
          if (response == null)
            callback({
              status: "error",
              message: "You haven't authenticated for getting all payments.",
            });
          return callback({
            status: "success",
            message: "Get all payment successfully",
            data: response,
          });
        })
        .catch((err) => {
          callback({
            status: "error",
            message: "Getting error when get all payment failed",
          });
        });
    } catch (error) {
      callback(error);
    }
  }

  async cancelPayment({ req, callback }) {
    try {
      const getPayment = await payment.findOne({
        orgId: req.session.orgId,
        _id: req.body.paymentId,
      });

      if (!getPayment)
        return callback(null, {
          status: "error",
          message: "Payment not found",
        });

      let getClient = await getClientVerify({
        whose: getPayment.whose,
        clientId: getPayment.clientId,
        req,
      });

      if (!getClient)
        return callback(null, {
          status: "error",
          message: "Can't find Vendor or Customer",
        });
      let getDoc;
      if (getClient.documents.length > 0)
        getDoc = await getClient.documents.filter((doc) => doc.type == "erp");

      if (getPayment.amount > 0) {
        getClient = await decreaseTheClientBalanceInOrOut({
          amount: getPayment.amount,
          getClient,
          type: getPayment.type,
          documents: getDoc.length > 0 ? true : false,
          orgId: getPayment.org
        });
        await getClient.save();
      }

      return await payment
        .deleteOne({ orgId: req.session.orgId, _id: req.body.paymentId })
        .then(() =>
          callback(
            {
              status: "success",
              message: "Payment canceled successfully",
            },
            false
          )
        )
        .catch((err) =>
          callback(null, {
            status: "error",
            message: "couldn't delete payment",
          })
        );
    } catch (error) {
      console.log(error);
      return callback(null, error);
    }
  }
};
