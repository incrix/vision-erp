const payment = require("../../models/payment");
const {
  getClientVerify,
  decreaseTheClientBalanceInOrOut,
  addBalanceWithInandOut,
  checkTheBalanceWithInandOutForCancelPay,
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
            });

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

  async cancelPayment({
    req,
    invoiceAmount,
    lastIndex,
    callback,
    invoicePaidAmount,
  }) {
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
        id: getPayment.clientId,
        req,
      });
      if (getClient.status == "error") return callback(null, getClient);
      if (!getClient || getClient == null)
        return callback(null,{
          status: "error",
          message: "Can't find Vendor or Customer",
        });

      if (getPayment.isCancelled)
        return callback(null, {
          status: "error",
          message: "Payment is already cancelled",
        });

      if (getPayment.amount > 0 && getPayment.isCancelled == false) {
        getClient = await decreaseTheClientBalanceInOrOut({
          amount: getPayment.amount,
          invoicePaidAmount,
          getClient,
          req,
          paymentId: getPayment.id,
          invoiceId: req.body.invoiceId,
          invoiceAmount,
          lastIndex,
        });
    //  console.log(getClient);
        await getClient.save();
      }
      return  callback(
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
    
      return callback(null, error);
    }
  }

 async cancelPaymentForBalance ({
   req,
   callback,
   invoiceAmount,
   invoicePaidAmount,
   whose,
   id,
   amount,
   lastIndex,
   isViaBalance
 }) {
  try {
    
    let getClient = await getClientVerify({
      whose,
      id,
      req,
    });
   
    if (!getClient || getClient == null)
      return callback(null,{
        status: "error",
        message: "Can't find Vendor or Customer",
      });
    if (getClient.status == "error") return callback(null, getClient);
    
      getClient = await decreaseTheClientBalanceInOrOut({
        amount: isViaBalance == undefined ? 0 : amount,
        invoicePaidAmount,
        getClient,
        req,
        invoiceId: req.body.id,
        invoiceAmount,
        lastIndex,
        isViaBalance,
      })
  // console.log(getClient) 
   await getClient.save();
    return  callback(
      {
        status: "success",
        message: "Invoice cancelled successfully",
      },
      false
    );
  } catch (error) {

   return callback(null,{status:"error",message:error.message})
  }
 }
};
