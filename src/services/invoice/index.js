const invoice = require("../../models/invoice");
const Customer = require("../../models/customer");
const { genereateInvoiceId } = require("../../utils/generateID");
const {
  getPersentageAmount,
  getAmountStatus,
  createClientBalanceForInvoice,
  createClientBalanceForPayment,
  addincreaseOrdecreaseBalance,
} = require("./invoiceUtil");

const { getDateCreated } = require("../../utils/createDate");
const Payment = require("../../models/payment");
module.exports = class Invoice {
  async createInvoice({ body, req, callBack, services }) {
    try {
      const cusID = body.cusId;
      const sendAllCusID = async (callBack) => {
        let isCallBack = true;
        for (let i = 0; i < cusID.length; i++) {
          const getValue = await this.createInvoiceOneByOne({
            body,
            cusID: cusID[i],
            req,
            callBack,
            services,
          });
          if (getValue.status == "error") {
            isCallBack = false;
            callBack(null, getValue);
          }
        }
        isCallBack &&
          callBack(
            {
              status: "success",
              message: "Invoice Created Successfully",
            },
            false
          );
      };
      await sendAllCusID(callBack);
    } catch (error) {
      console.log(error);
      callBack(null, { status: "error", message: "Can't Create Invoice" });
    }
  }

  async createInvoiceOneByOne({ body, cusID, req, callBack, services }) {
    return new Promise(async (resolve, reject) => {
      (async () => {
        const invoicecount = await invoice.find({ orgId: req.session.orgId });
        const invoiceId = await genereateInvoiceId(invoicecount);
        let getCustomer = await Customer.findOne({ _id: cusID });

        if (body.totalPrice < body.paidAmount)
          return resolve({
            status: "error",
            message: "The Incorrect Paid Amount",
          });

        if (!getCustomer)
          return resolve({ status: "error", message: "Customer Not Found" });
        return await invoice
          .create({
            orgId: req.session.orgId,
            userId: req.session.userId,
            id: invoiceId,
            customerDetails: {
              customerName: getCustomer.name,
              cusID: getCustomer._id,
              phone: getCustomer.phone == undefined ? "" : getCustomer.phone,
              email: getCustomer.email === undefined ? "" : getCustomer.email,
              billingAddress:
                getCustomer.billingAddress == undefined
                  ? undefined
                  : getCustomer.billingAddress,
              companyDetails:
                getCustomer.companyDetails == undefined
                  ? undefined
                  : getCustomer.companyDetails,
            },
            transationDetails: {
              mode: body.type,
            },
            items: body.items,
            additionalCharges: {
              package: {
                type:
                  body.additionalCharges.package.type == undefined
                    ? undefined
                    : body.additionalCharges.package.type,
                value:
                  body.additionalCharges.package.value == undefined
                    ? undefined
                    : body.additionalCharges.package.value,
                amount:
                  body.additionalCharges.package.type == "%"
                    ? getPersentageAmount({
                        totalPrice: body.totalPrice,
                        value: body.additionalCharges.package.value,
                      })
                    : body.additionalCharges.package.value,
              },
              delivery: {
                type:
                  body.additionalCharges.delivery.type == undefined
                    ? undefined
                    : body.additionalCharges.delivery.type,
                value:
                  body.additionalCharges.delivery.value == undefined
                    ? undefined
                    : body.additionalCharges.delivery.value,
                amount:
                  body.additionalCharges.delivery.type == "%"
                    ? getPersentageAmount({
                        totalPrice: body.totalPrice,
                        value: body.additionalCharges.delivery.value,
                      })
                    : body.additionalCharges.delivery.value,
              },
            },
            totalPrice: body.totalPrice,
            paidAmount: body.paidAmount,
            discount: {
              type: body.discount.type,
              value: body.discount.value,
              amount:
                body.discount.type == "%"
                  ? getPersentageAmount({
                      totalPrice: body.totalPrice,
                      value: body.discount.value,
                    })
                  : eval(body.discount.value),
              tax: body.tax == undefined || "" ? null : body.tax,
            },
            status: getAmountStatus({
              cusBalance: getCustomer.balance,
              totalPrice: body.totalPrice,
              paidAmount: body.paidAmount,
              disValue: body.discount.value,
            }),
            date: req.body.date,
          })
          .then(async (getInvoiceResult) => {
            new Promise((resolve, reject) => {
              (async () => {
                getCustomer = await createClientBalanceForInvoice({
                  paidAmount: body.paidAmount,
                  totalAmount: body.totalPrice,
                  invoice: getInvoiceResult,
                  getCustomer,
                });

                //  await getCustomer.save();
              })();
            });
            if (body.paidAmount > 0)
              return await services.payment
                .createPayment({
                  orgId: req.session.orgId,
                  clientId: getCustomer._id,
                  name: getCustomer.name,
                  amount: body.paidAmount,
                  mode: body.transationDetails.type,
                  date: req.body.date,
                  type: "in",
                  whose: "customer",
                  documents: [
                    {
                      type: "erp",
                      id: getInvoiceResult.id,
                    },
                  ],
                })
                .then(async (getPayResult) => {
                  new Promise((resolve, reject) => {
                    (async () => {
                      getCustomer = await createClientBalanceForPayment({
                        paidAmount: body.paidAmount,
                        totalAmount: body.totalPrice,
                        payment: getPayResult,
                        getCustomer,
                      });

                      await getCustomer.save();
                    })();
                  });

                  // add payment details in invoice  and save them
                  getInvoiceResult.paymentTransactions.push({
                    type: "payment",
                    id: getPayResult.id,
                  });
                  await getInvoiceResult.save();
                  resolve({
                    status: "success",
                    message: "Invoice Created Successfully",
                  });
                })
                .catch((err) => {
                  console.log(err);
                  callBack(null, {
                    status: "error",
                    message: "Getting Error When Create Invoice",
                  });
                });
            else {
              await getCustomer.save();
            }

            return resolve({
              status: "success",
              message: "Invoice Created Successfully",
            });
          })
          .catch((err) => {
            console.log(err);
            callBack(null, {
              status: "error",
              message: "Getting Error When Create Invoice",
            });
          });
      })();
    });
  }

  async getAllInvoice({ req, callBack }) {
    try {
      const getInvoice = await invoice.find({ orgId: req.session.orgId });
      if (!getInvoice)
        callBack(null, {
          status: "error",
          message: "something went wrong with organization Id",
        });
      callBack(getInvoice);
    } catch (error) {
      callBack(error);
    }
  }
  async cancelInvoice({ req, callBack, services, id }) {
    try {
      const getInvoice = await invoice.findOne({
        orgId: req.session.orgId,
        id,
      });

      if (!getInvoice)
        callBack(null, {
          status: "error",
          message: "something went wrong with organization Id Or Invoice Id",
        });
      if (getInvoice.status == "cancelled")
        return callBack(null, {
          status: "error",
          message: "Invoice is already cancelled",
        });

      if (getInvoice.paymentTransactions.length > 0) {
        for (let i = 0; i < getInvoice.paymentTransactions.length; i++) {
          const getPromise = await new Promise((resolve, reject) => {
            (async () => {
              //  If the payment is made through cash or UPI, the function will call
              if (getInvoice.paymentTransactions[i].type !== "balance") {
                req.body.paymentId = getInvoice.paymentTransactions[i].id;
                req.body.invoiceId = getInvoice.id;
                await services.payment.cancelPayment({
                  req,
                  invoiceAmount: getInvoice.totalPrice,
                  invoicePaidAmount: getInvoice.paidAmount,
                  lastIndex:
                    getInvoice.paymentTransactions[
                      getInvoice.paymentTransactions.length - 1
                    ] == getInvoice.paymentTransactions[i]
                      ? true
                      : false,
                  callback: function (err, data) {
                    if (data.status == "error") resolve(data);
                    resolve(data);
                  },
                });
              }
              //  If the payment is made through the closing balance, the function will call
              else
                await services.payment.cancelPaymentForBalance({
                  req,
                  invoiceAmount: getInvoice.totalPrice,
                  invoicePaidAmount: getInvoice.paidAmount,
                  whose: "customer",
                  id: getInvoice.customerDetails.cusID,
                  amount:getInvoice.paymentTransactions[i].amount,
                  isViaBalance:true,
                  lastIndex:
                    getInvoice.paymentTransactions[
                      getInvoice.paymentTransactions.length - 1
                    ] == getInvoice.paymentTransactions[i]
                      ? true
                      : false,
                  callback: function (err, data) {
                    if (err) resolve(data);
                    if (data.status == "error" || data == null) resolve(data);
                    resolve(data);
                  },
                });
            })();
          });

          if (getPromise.status == "error") return callBack(null, getPromise);
        }
      }
      // This function will call if the payment doesn't pay
      else if (getInvoice.paidAmount == 0) {
        const getPromise = await new Promise(function (resolve, reject) {
          (async () => {
            await services.payment.cancelPaymentForBalance({
              req,
              invoiceAmount: getInvoice.totalPrice,
              invoicePaidAmount: getInvoice.paidAmount,
              whose: "customer",
              id: getInvoice.customerDetails.cusID,
              lastIndex: true,
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

      getInvoice.status = "cancelled";
      req.session.countBalance = 0;
      // await getInvoice.save();
      callBack(
        { status: "success", message: "invoice cancelled successfully" },
        false
      );
    } catch (error) {
      callBack(null, error.message);
    }
  }

  async deleteInvoice({ req, callBack, id }) {
    try {
      const checkIsCancel = await invoice.findOne({
        orgId: req.session.orgId,
        id,
      });

      if (checkIsCancel.status !== "cancelled")
        return callBack(null, {
          status: "error",
          message: "Invoice is not cancelled so you could not delete this",
        });
      const getInvoice = await invoice.deleteOne({
        orgId: req.session.orgId,
        id,
      });
      if (!getInvoice)
        callBack(null, {
          status: "error",
          message: "something went wrong with organization Id",
        });
      callBack(
        { status: "status", message: "invoice delete successfully" },
        false
      );
    } catch (error) {
      callBack(error);
    }
  }

  /// invoicePayment fuction

  async invoicePayment({ req, callBack, services, body }) {
    try {
      const { id, date, amount } = body;
      const getInvoice = await invoice.findOne({ id });
      if (!getInvoice)
        return callBack(null, {
          status: "error",
          message: "couldn't find invoice ",
        });
      let getClient = await Customer.findOne({
        _id: getInvoice.customerDetails.cusID,
      });

      if (!getClient)
        return callBack(null, {
          status: "error",
          message: "couldn't find client ",
        });
      if (getInvoice.status == "paid")
        return callBack(null, {
          status: "error",
          message: "Invoice is already paid",
        });

      if (getInvoice.status == "cancelled")
        return callBack(null, {
          status: "error",
          message: "You could not pay invoice while invoice was cancelled",
        });

      if (
        amount > getInvoice.totalPrice ||
        getInvoice.totalPrice < getInvoice.paidAmount ||
        getInvoice.totalPrice < getInvoice.paidAmount + amount
      )
        return callBack(null, {
          status: "error",
          message: "The Incorrect Paid Amount",
        });

      await services.payment
        .createPayment({
          orgId: req.session.orgId,
          clientId: getClient._id,
          name: getClient.name,
          amount,
          mode: "Cash",
          date,
          type: "in",
          whose: "customer",
          documents: [
            {
              type: "erp",
              id: getInvoice.id,
            },
          ],
        })
        .then(async (getPayResult) => {
          new Promise((resolve, reject) => {
            (async () => {
              getClient = await createClientBalanceForPayment({
                paidAmount: amount,
                totalAmount: getInvoice.totalPrice,
                payment: {
                  paymentId: getPayResult.paymentId,
                  date,
                  mode: "Cash",
                },
                getCustomer: getClient,
              });
            })();
          });
          getInvoice.status = await getAmountStatus({
            totalPrice: getInvoice.totalPrice,
            paidAmount: getInvoice.paidAmount + amount,
          });

          getClient.ledger.map((invoice) => {
            if (invoice.id == getInvoice.id) {
              invoice.status = getInvoice.status;
            }
          });

          getInvoice.paymentTransactions.push({
            type: "payment",
            id: getPayResult.id,
          });
          getInvoice.paidAmount = getInvoice.paidAmount + amount;
          await getClient.save();
          await getInvoice.save();
          return callBack({
            statusbar: "success",
            message: "Make a payment successfully",
            data: getInvoice,
          });
        });
    } catch (error) {
      console.log(error);
      return callBack(null, {
        status: "error",
        message: "something went wrong when trying to payment invoice",
      });
    }
  }

  async paymentThroughCurrentBalance({ req, body, callBack }) {
    try {
      const { id, amount } = body;
      const getInvoice = await invoice.findOne({
        orgId: req.session.orgId,
        id,
      });
      if (!getInvoice)
        callBack(null, {
          status: "error",
          message: "Can't find invoice",
        });
      if (getInvoice.status == "paid")
        return callBack(null, {
          status: "error",
          message: "Invoice is already paid",
        });
      if (getInvoice.status == "cancelled")
        return callBack(null, {
          status: "error",
          message: "You could not pay your invoice while invoice was cancelled",
        });

      if (
        amount > getInvoice.totalPrice ||
        getInvoice.totalPrice < getInvoice.paidAmount ||
        getInvoice.totalPrice < getInvoice.paidAmount + amount
      )
        return callBack(null, {
          status: "error",
          message: "The Incorrect Paid Amount",
        });
      const getClient = await Customer.findOne({
        _id: getInvoice.customerDetails.cusID,
      });

      if (!getClient)
        return callBack(null, {
          status: "error",
          message: "Couldn't find client ",
        });

      let balance = 0 + Math.abs(getClient.balance.currentBalance);

      if (
        balance < getInvoice.totalPrice - getInvoice.paidAmount ||
        balance < amount || getClient.balance.currentBalance > 0
      )
        return callBack(null, {
          status: "error",
          message: "You don't have enough balance",
        });
      getInvoice.status = await getAmountStatus({
        totalPrice: getInvoice.totalPrice,
        paidAmount: getInvoice.paidAmount + amount,
      });

      getClient.ledger.map((invoice) => {
        if (invoice.id == getInvoice.id) {
          invoice.status = getInvoice.status;
        }
      });
      getInvoice.paymentTransactions.push({ type: "balance", amount: -amount });
      // add the payment amount in the invoice paid amount
      getInvoice.paidAmount = getInvoice.paidAmount + amount;
      // to add amount in client cloing balance

      getClient.balance.currentBalance = await addincreaseOrdecreaseBalance({
        balance: getClient.balance.currentBalance,
        paidAmount: amount,
      });
      await getClient.save();
      await getInvoice.save();

      return callBack({
        status: "success",
        message: "Make a payment successfully",
      });
    } catch (e) {
      return callBack(null, {
        status: "error",
        message: `something went wrong when trying to payment invoice`,
      });
    }
  }
};
