const invoice = require("../../../models/invoice");
const Payment = require("../../../models/payment");
const Customer = require("../../../models/customer");
module.exports = class cancelInvoice {
  async cancelInvoice({ req, callBack, services, id }) {
    try {
      const getInvoice = await invoice.findOne({
        orgId: req.session.orgId,
        id,
      });
      if (!getInvoice)
        return callBack(null, {
          status: "error",
          message: "something went wrong with organization Id Or Invoice Id",
        });
      if (getInvoice.status == "cancelled")
        return callBack(null, {
          status: "error",
          message: "Invoice is already cancelled ",
        });
      // add the invoice to the body
      req.body.docId = getInvoice.id;
      // clear payAmount in session
      req.session.payAmount = 0;
      if (getInvoice.paymentTransactions.length > 0) {
        if (req.body.paymentCancel)
          return await this.cancelInvoiceWithPayment({
            req,
            services,
            getInvoice,
            callBack,
          });
        for (let i = 0; i < getInvoice.paymentTransactions.length; i++) {
          const getPromise = await new Promise((resolve, reject) => {
            (async () => {
              //  If the payment is made through cash or UPI, the function will call
              if (getInvoice.paymentTransactions[i].type !== "balance") {
                req.body.paymentId = getInvoice.paymentTransactions[i].id;
                await services.payment.canInvoicePayment({
                  req,
                  totalPrice: getInvoice.totalPrice,
                  paidAmount: getInvoice.paidAmount,
                  lastIndex:
                    getInvoice.paymentTransactions[
                      getInvoice.paymentTransactions.length - 1
                    ] == getInvoice.paymentTransactions[i]
                      ? true
                      : false, // its was help to change the closing balance in the client transaction

                  callback: function (err, data) {
                    if (data.status == "error") reject(data);
                    resolve(data);
                  },
                });
              }
            })();
          });

          if (getPromise.status == "error") return callBack(null, getPromise);
        }
      }
      // This function will call if the payment doesn't pay
      else if (getInvoice.paidAmount == 0) {
        const getPromise = await new Promise(function (resolve, reject) {
          (async () => {
            await services.payment.canInvoicePaymentForBalance({
              req,
              amount: getInvoice.totalPrice,
              whose: "customer",
              id: getInvoice.customerDetails.cusID,
              isPaidAmountZero: true,
              callback: function (err, data) {
                if (err) resolve(data);
                if (data.status == "error" || data == null) resolve(data);
                resolve(data);
              },
            });
          })();
        });

        if (getPromise.status == "error" || getPromise == null)
          return callBack(null, getPromise);
      }
      // clear payAmount in session
      req.session.payAmount = 0;
      getInvoice.paymentTransactions = [];

      const getData = await services.product.encryptData({
        items: getInvoice.items,
        docId: [getInvoice.id],
        date: getInvoice.date,
        type: "cancelInvoice",
      });
      if (getData.status == "error") return callBack(null, getData);

      // change status to "cancelled"
      getInvoice.status = "cancelled";

      await getInvoice.save();

      return callBack(
        {
          status: "success",
          message: "invoice cancelled successfully",
          data: getData.data,
        },
        false
      );
    } catch (error) {
      console.log(error);
      callBack(null, error.message);
    }
  }
  async cancelInvoiceWithPayment({ services, req, getInvoice, callBack }) {
    try {
      const getPayments = await Payment.find({
        orgId: req.session.orgId,
        type: "in",
        id: { $in: [...getInvoice.paymentTransactions.map((doc) => doc.id)] },
      });
      if (getPayments.length < 0)
        return callBack(null, {
          status: "error",
          message: "Payment  not found",
        });
      let totalPayAmount = 0;
      for (let i = 0; i < getPayments.length; i++) {
        totalPayAmount += getPayments[i].amount;
      }
      if (totalPayAmount % getInvoice.paidAmount !== 0)
        return callBack(null, {
          status: "error",
          message:
            "You can't cancel Invoice with Payment if it has not single payment amount ",
        });
      let getClient;
      const getPromise = await new Promise((resolve, reject) => {
        (async () => {
          getClient = await Customer.findOne({
            _id: getInvoice.customerDetails.cusID,
          });
          if (!getClient)
            reject({ status: "error", message: "cant find customer" });
          for (let i = 0; i < getPayments.length; i++) {
            await services.invoice.cancelPaymentWithInvoice({
              req,
              getPayment: getPayments[i],
              getClient,
              getInvoices: [getInvoice],
              reject,
            });
          }
          resolve({
            status: "success",
            message: "Invoice cancelled successfully",
          });
        })();
      });

      getClient.balance.currentBalance -=
        getInvoice.totalPrice - totalPayAmount;
      getClient.ledger[getClient.ledger.length - 1].closingBalance =
        getClient.balance.currentBalance;

      const getData = await services.product.encryptData({
        items: getInvoice.items,
        docId: [getInvoice.id],
        date: getInvoice.date,
        type: "cancelInvoice",
      });
      if (getData.status == "error") return callBack(null, getData);
      for (let i = 0; i < getPayments.length; i++) {
        await getPayments[i].save();
      }

      await getClient.save();
      await getInvoice.save();

      if (getPromise.status == "error") return callBack(null, getPromise);
      return callBack(
        {
          status: "success",
          message: "Invoice cancelled successfully",
          data: getData.data,
        },
        false
      );
    } catch (error) {
      return callBack(null, { status: "error", message: error.message });
    }
  }
};
