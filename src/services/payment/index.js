const payment = require("../../models/payment");

const {
  getClientVerify,
  decreaseTheClientBalanceInOrOut,
  addBalanceWithInandOut,
  checkTheBalanceWithInandOutForCancelPay,
  payAmountIn,
  payInForPurchase,
  payInForInvoice,

} = require("./payUtil");
const { getDateCreated } = require("../../utils/createDate");
const { generatePaymentId } = require("../../utils/generateID");
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
    date,
    paymentDate,
  }) {
    return await payment
      .create({
        orgId,
        id: await generatePaymentId({
          orgId,
          type,
        }),
        clientId,
        name,
        amount,
        mode,
        whose,
        type,
        date,
        paymentDate,
        description,
        documents: documents == undefined ? [] : documents,
        timestamps,
      })
      .then((response) => {
        return {
          status: "success",
          message: "Create payment successfully",
          id: response._id,
          paymentId: response.id,
          amount: response.amount,
          data:response
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
        paymentDate: req.body.date,
        type: req.body.type,
        description:
          req.body.description == undefined ? "" : req.body.description,
        documents:
          req.body.documents == undefined ? undefined : req.body.documents,
      })
        .then(async (getPayResult) => {
          if (req.body.amount > 0) {
            getClient = await addBalanceWithInandOut({
              amount: req.body.amount,
              getClient,
              type: req.body.type,
              data: getPayResult,
            });

            await getClient.save();
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
  // Payment in
  async createPayIn({ req ,callback }) {
    try {
      // Debit or in == customer pay you && red && -
      if (req.body.whose == undefined)
        return callback(null, {
          status: "error",
          message: "Please provide whose to pay",
        });
      let getClient = await getClientVerify({ ...req.body, req });
      if (!getClient || getClient == null)
        return callback(null, {
          status: "error",
          message: `Can't find ${req.body.whose}`,
        });

      const getPromise = await new Promise((resolve, reject) => {
        (async () => {
          if (req.body.amount <= 0)
            reject("Amount should be greater than zero");
         let getDocList 
          if(req.body.docList.length > 0)
            getDocList = req.body.whose == "customer" ?  await payInForInvoice({
            reject,
            ...req.body,
            getClient,
          }) : payInForPurchase({
            reject,
            ...req.body,
            getClient,
          });
          const getPayment = await payment({
            orgId: req.session.orgId,
            id: await generatePaymentId({
              orgId: req.session.orgId,
              type: req.body.transactionDetails.type,
            }),
            clientId: getClient._id,
            name: getClient.name,
            amount: req.body.amount,
            mode: req.body.transactionDetails.mode,
            date: req.body.date,
            type: req.body.transactionDetails.type,
            whose: req.body.whose,
            description: req.body.transactionDetails.notes == undefined ? "" :req.body.transactionDetails.notes,
          })  
          await payAmountIn({
            getClient,
            getPayment,
            getDocList,
            resolve,
            reject,
            ...req.body,
          });
         return resolve({status:"success",message:"Invoice successfully received"})
        })();
      });
      if (getPromise.status == "error") return callback(null, getPromise);
      return callback(getPromise,false)
      // return callback(getPromise, false);
    } catch (error) {
      console.log(error);
      return callback(null, { status: "error", message: error.message });
    }
  }
  // async canInvoicePaymentForManuel({ req, callback }) {
  //   try {
  //     const getPayment = await payment.findOne({
  //       orgId: req.session.orgId,
  //       _id: req.body.paymentId,
  //     });

  //     if (!getPayment)
  //       return callback(null, {
  //         status: "error",
  //         message: "Payment not found",
  //       });

  //     let getClient = await getClientVerify({
  //       whose: getPayment.whose,
  //       id: getPayment.clientId,
  //       req,
  //     });
  //     if (!getClient || getClient == null)
  //       return callback(null, {
  //         status: "error",
  //         message: "Can't find Vendor or Customer",
  //       });

  //     if (getClient.status == "error") return callback(null, getClient);

  //     if (getPayment.isCancelled)
  //       return callback(null, {
  //         status: "error",
  //         message: "Payment is already cancelled",
  //       });
  //     let docId;
  //     if (getPayment.documents.length > 0)
  //       for (let i = 0; i < getPayment.documents.length; i++) {
  //         if (getPayment.documents[i].type == "erp")
  //           docId = getPayment.documents[i].id;
  //       }
  //     const getInvoice = await Invoice.findOne({ id: docId });

  //     if (!getInvoice)
  //       return callback(null, {
  //         status: "error",
  //         message: "Can't find invoice",
  //       });
  //     if (getInvoice.status == "cancelled")
  //       return callback(null, {
  //         status: "error",
  //         message: "Invoice already cancelled",
  //       });
  //     if (getPayment.amount > 0 && getPayment.isCancelled == false) {
  //       getClient = await decreaseTheClientBalanceInOrOut({
  //         amount: getPayment.amount,
  //         paidAmount: getInvoice.paidAmount,
  //         getClient,
  //         req,
  //         paymentId: getPayment.id,
  //         docId, // its created from manually so don't confuse
  //         totalPrice: getInvoice.totalPrice,
  //       });
  //       console.log(getClient);
  //       //  await getClient.save();
  //     } else if (getPayment.isCancelled == false)
  //       return callback(null, {
  //         status: "error",
  //         message: "The payment already cancelled",
  //       });

  //     return callback(
  //       {
  //         status: "success",
  //         message: "Invoice canceled successfully",
  //       },
  //       false
  //     );
  //   } catch (error) {
  //     console.log(error);
  //     return {
  //       status: "error",
  //       message: error.message,
  //     };
  //   }
  // }

  async canInvoicePayment({
    req,
    totalPrice,
    callback,
    paidAmount,
    getPayableAmount,
    lastIndex,
  }) {
    try {
      const getPayment = await payment.findOne({
        orgId: req.session.orgId,
        id: req.body.paymentId,
      });
      if (!getPayment || getPayment == undefined)
        return callback(null, {
          status: "error",
          message: "Payment not found",
        });
       
      let getClient = await getClientVerify({
        whose: getPayment.whose,
        id: getPayment.clientId,
        req,
      });
  
      if (!getClient || getClient == null)
        return callback(null, {
          status: "error",
          message: "Can't find Vendor or Customer",
        });

      if (getClient.status == "error") return callback(null, getClient);

      if (getPayment.isCancelled)
        return callback(null, {
          status: "error",
          message: "Payment is already cancelled",
        });

      if (getPayment.amount > 0 && getPayment.isCancelled == false) {
        const getWait = await new Promise((resolve, reject) => {
          (async () => {
            getClient = await decreaseTheClientBalanceInOrOut({
              amount: getPayment.amount,
              resolve,
              reject,
              getPayment,
              paidAmount,
              getClient,
              req,
              lastIndex,
              paymentId: getPayment.id,
              docId: req.body.docId, // its created from manually so don't confuse
              totalPrice,
              getPayableAmount,
            });
          })();
        });
           
        // console.log(getClient.balance);
        // console.log(getClient.ledger);
        // console.log(getClient.ledger[getClient.ledger.length -1]);
        if (getWait.status === "success") {
          await getClient.save();
          await getPayment.save();
        } else
          return callback(null, {
            status: "error",
            message: getWait.message,
          });
      }

      return callback(
        {
          status: "success",
          message: "Invoice canceled successfully",
        },
        false
      );
      return await payment
        .findOne({ orgId: req.session.orgId, _id: req.body.paymentId })
        .then((paymentResult) => {
          paymentResult.isCancelled = true;
          paymentResult.save();
          callback(
            {
              status: "success",
              message: "Payment canceled successfully",
            },
            false
          );
        })
        .catch((err) =>
          callback(null, {
            status: "error",
            message: "couldn't delete payment",
          })
        );
    } catch (error) {
      console.log(error);
      return callback(null, { status: "error", message: error.message });
    }
  }

  async canInvoicePaymentForBalance({
    req,
    callback,
    whose,
    id,
    amount,
    isPaidAmountZero,
  }) {
    try {
      let getClient = await getClientVerify({
        whose,
        id,
        req,
      });

      if (!getClient || getClient == null)
        return callback(null, {
          status: "error",
          message: "Can't find Vendor or Customer",
        });
      if (getClient.status == "error") return callback(null, getClient);
      const getWait = await new Promise((resolve, reject) => {
        (async () => {
          getClient = await decreaseTheClientBalanceInOrOut({
            amount,
            getClient,
            req,
            docId: req.body.docId,
            resolve,
            reject,
            isPaidAmountZero,
          });
        })();
      });

      // console.log(getClient.ledger)
      if (getWait.status === "success") {
        await getClient.save();
      } else
        return callback(null, {
          status: "error",
          message: getWait.message,
        });

      return callback(
        {
          status: "success",
          message: "Invoice cancelled successfully",
        },
        false
      );
    } catch (error) {
      return callback(null, { status: "error", message: error.message });
    }
  }
};
