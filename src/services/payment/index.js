const payment = require("../../models/payment");
const { getClientVerify } = require("./payUtil");
const { getDateCreated } = require("../../utils/createDate");
module.exports = class Payment {
  async createPayment({
    orgId,
    clientId,
    documents,
    amount,
    mode,
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
        type,
        description,
        documents: documents == undefined ? [] : documents,
        timestamps,
      })
      .then((response) => {
        return {
          status: "success",
          message: "Create payment successfully",
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
      const getClient = await getClientVerify({ ...req.body, req });
      const { getDate, getTime, getDateMilliseconds } = getDateCreated;
  
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
        timestamps: {
          date: getDate,
          time: getTime,
          dateMilliseconds: getDateMilliseconds,
        },
        type: req.body.type,
        description: req.body.description,
        documents:
          req.body.documents == undefined ? undefined : req.body.documents,
      })
        .then((getPayResult) => {
          
          return callback(
            getPayResult
          );
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
};
