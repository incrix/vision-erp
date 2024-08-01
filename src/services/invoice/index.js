const invoice = require("../../models/invoice");
const Customer = require("../../models/customer");
const Payment = require("../../models/payment");
const { genereateInvoiceId } = require("../../utils/generateID");
const {
  getPercentageAmount,
  getAmountStatus,
  createClientBalanceForInvoice,
  createClientBalanceForPayment,
  addincreaseOrdecreaseBalance,
  checkVerifyRemainingAmount,
} = require("./invoiceUtil");

const { getDateCreated } = require("../../utils/createDate");

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
            transactionDetails: {
              mode: body.transactionDetails.type,
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
                    ? getPercentageAmount({
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
                    ? getPercentageAmount({
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
                  ? getPercentageAmount({
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
            const getWaiting = new Promise((resolve, reject) => {
              (async () => {
                getCustomer = await createClientBalanceForInvoice({
                  paidAmount: body.paidAmount,
                  totalAmount: body.totalPrice,
                  invoice: getInvoiceResult,
                  getCustomer,
                });
              })();
            });
            if (getWaiting.status == "error") return callBack(getWaiting);
            if (body.paidAmount > 0)
              return await services.payment
                .createPayment({
                  orgId: req.session.orgId,
                  clientId: getCustomer._id,
                  name: getCustomer.name,
                  amount: body.paidAmount,
                  mode: body.transactionDetails.type,
                  date: req.body.date,
                  type: "in",
                  whose: "customer",
                  documents: [
                    {
                      type: "erp",
                      id: getInvoiceResult.id,
                      payAmount: body.paidAmount,
                      docAmount: body.totalPrice,
                    },
                  ],
                })
                .then(async (getPayResult) => {
                  new Promise((resolve, reject) => {
                    (async () => {
                      getCustomer.ledger[
                        getCustomer.ledger.length - 1
                      ].documents.push({
                        id: getPayResult.paymentId,
                        amount: getPayResult.amount,
                      });
                      getCustomer = await createClientBalanceForPayment({
                        paidAmount: body.paidAmount,
                        totalAmount: body.totalPrice,
                        payment: getPayResult,
                        getCustomer,
                        invoice: getInvoiceResult,
                      });

                      await getCustomer.save();
                    })();
                  });

                  // add payment details in invoice  and save them
                  getInvoiceResult.paymentTransactions.push({
                    type: "payment",
                    id: getPayResult.paymentId,
                    amount: getPayResult.amount,
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
      callBack({
        status: "success",
        message: "Get All Invoice Successfully",
        data: getInvoice,
      });
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
        req.body.docId = getInvoice.id;
        for (let i = 0; i < getInvoice.paymentTransactions.length; i++) {
          const getPromise = await new Promise((resolve, reject) => {
            (async () => {
              //  If the payment is made through cash or UPI, the function will call
              if (getInvoice.paymentTransactions[i].type !== "balance") {
                req.body.paymentId = getInvoice.paymentTransactions[i].id;
                console.log("balance");
                await services.payment.cancelPayment({
                  req,
                  totalPrice: getInvoice.totalPrice,
                  paidAmount: getInvoice.paidAmount,
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
              else {
                await services.payment.cancelPaymentForBalance({
                  req,
                  totalPrice: getInvoice.totalPrice,
                  paidAmount: getInvoice.paidAmount,
                  whose: "customer",
                  id: getInvoice.customerDetails.cusID,
                  amount: getInvoice.paymentTransactions[i].amount,
                  isViaBalance: true,
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
            await services.payment.cancelPaymentForBalance({
              req,
              totalPrice: getInvoice.totalPrice,
              paidAmount: getInvoice.paidAmount,
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

      getInvoice.paymentTransactions = [];
      // change status to "cancelled"
      getInvoice.status = "cancelled";
      await getInvoice.save();
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
              docAmount: getInvoice.amount,
              payAmount: amount,
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
                invoice: getInvoice,
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
              invoice.documents.push({
                id: getPayResult.paymentId,
                amount,
              });
            }
          });

          getInvoice.paymentTransactions.push({
            type: "payment",
            id: getPayResult.paymentId,
            amount: getPayResult.amount,
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
      const { id, amount, paymentList } = body;
      const getInvoice = await invoice.findOne({
        orgId: req.session.orgId,
        id,
      });
      if (!getInvoice)
        return callBack(null, {
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
      if (paymentList.length < 0)
        return callBack(null, {
          status: "error",
          message: "Please select a payment list",
        });
      const idList = [...paymentList.map((filter) => filter.id)];
      const getPaymentList = await Payment.find({
        orgId: req.session.orgId,
        id: { $in: idList },
      });

      if (
        getPaymentList.length <= 0 ||
        getPaymentList.length !== paymentList.length
      )
        return callBack(null, {
          status: "error",
          message: "Please give Valuable a payment list",
        });

      getInvoice.status = await getAmountStatus({
        totalPrice: getInvoice.totalPrice,
        paidAmount: getInvoice.paidAmount + amount,
      });
      // we create this variable for get invoice index in ledger for add payment details to ledger invoice document
      let getInvoiceIndex;
      // add invoice and payment details in ledger
      for (let index = 0; index < getClient.ledger.length; index++) {
        let listIndex = idList.indexOf(getClient.ledger[index].id);

        if (getClient.ledger[index].id == getInvoice.id) {
          getClient.ledger[index].status = getInvoice.status;
          // add index
          getInvoiceIndex = index;
        } else if (getClient.ledger[index].id == idList[listIndex]) {
          const getWaiting = await new Promise((resolve, reject) => {
            (async () => {
              return await checkVerifyRemainingAmount({
                resolve,
                reject,
                ledger: getClient.ledger[index],
                isAdd: getClient.ledger[index].documents
                  .map((doc) => doc.id)
                  .includes(getInvoice.id),
                invoice: getInvoice,
                amount: paymentList[listIndex].amount,
              });
            })();
          });

          if (getWaiting.status == "error") {
            return callBack(null, getWaiting);
          }
          // update the ledger with new details
          getClient.ledger[index] = getWaiting.ledger;
          // add payment details in payment transactions
          getInvoice.paymentTransactions.push({
            type: "payment",
            id: getWaiting.ledger.id,
            amount: paymentList[listIndex].amount,
          });
          // add invoice and payment details in payment documents of payment list
          getPaymentList[
            getPaymentList
              .map((fil) => fil.id)
              .indexOf(getClient.ledger[index].id)
          ].documents.push({
            type: "erp",
            id: getInvoice.id,
            docAmount: getInvoice.totalPrice,
            payAmount: paymentList[listIndex].amount,
          });
          getPaymentList[
            getPaymentList
              .map((fil) => fil.id)
              .indexOf(getClient.ledger[index].id)
          ].save();
        }
      }
      //add invoice payment details into the client ledger  list
      for (var i = 0; i < paymentList.length; i++) {
        getClient.ledger[getInvoiceIndex].documents.push({
          id: paymentList[i].id,
          amount: paymentList[i].amount,
        });
      }

      // add the payment amount in the invoice paid amount
      getInvoice.paidAmount = getInvoice.paidAmount + amount;

      // to add amount in client closing balance
      getClient.balance.currentBalance = await addincreaseOrdecreaseBalance({
        balance: getClient.balance.currentBalance,
        paidAmount: amount,
      });

      await getClient.save();
      await getInvoice.save();

      // console.log(getInvoice);
      // console.log(getPaymentList.documents);
      // console.log(getClient.ledger);
      return callBack({
        status: "success",
        message: "Make a payment successfully",
      });
    } catch (error) {
      console.log(error);
      return callBack(null, {
        status: "error",
        message: error,
      });
    }
  }
  // this function is for editing invoice details
  async editInvoice({ callBack, req }) {
    try {
      const body = req.body;
      const getInvoice = await invoice.findOne({ id: body.id });
      if (!getInvoice)
        return callBack(null, {
          status: "error",
          message: "Invoice not found",
        });
      const getCustomer = await Customer.findOne({
        _id: getInvoice.customerDetails.cusID,
      });
      if (!getCustomer)
        return callBack(null, {
          status: "error",
          message: "Customer not found",
        });
      if (body.editTotal < getInvoice.paidAmount)
        return callBack(null, {
          status: "error",
          message: "You cant pay the amount",
        });
      console.log(getInvoice.paidAmount);

      return callBack({ status: "success", data: getInvoice }, false);
    } catch (error) {
      return callBack(null, {
        status: "error",
        message: `something went wrong when trying to edit invoice`,
      });
    }
  }
};
