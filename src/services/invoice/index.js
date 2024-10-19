const invoice = require("../../models/invoice");
const Customer = require("../../models/customer");
const Payment = require("../../models/payment");
const { genereateInvoiceId } = require("../../utils/generateID");
const {
  getPercentageAmount,
  getAmountStatus,
  createClientBalanceForInvoice,
  createClientBalanceForPayment,
  checkVerifyRemainingAmount,
  customAmountCondition,
} = require("./invoiceUtil");

const paymentInvoice = require("./parents/paymentInvoice");
const cancelInvoice = require("./parents/cancelInvoice");

function Classes(bases) {
  class Bases {
    constructor() {
      bases.forEach((base) => Object.assign(this, new base()));
    }
  }
  bases.forEach((base) => {
    Object.getOwnPropertyNames(base.prototype)
      .filter((prop) => prop != "constructor")
      .forEach((prop) => (Bases.prototype[prop] = base.prototype[prop]));
  });
  return Bases;
}

module.exports = class Invoice extends (
  Classes([paymentInvoice, cancelInvoice])
) {
  constructor() {
    super();
  }
  async createInvoice({ body, req, callBack, services }) {
    try {
      const cusID = body.cusId;
      // get decrypt data from product
      let getData = await services.product.decryptData(body.items);
      if (getData.status == "error") return callBack(null, getData.status);
      // and decrypt data save into body
      body.items = getData.data;
      if (cusID.length < 0) {
        return callBack(null, {
          status: "error",
          message: "Please Select Customer",
        });
      }
      if (body.totalPrice < 0) {
        return callBack(null, {
          status: "error",
          message: "Total Price must be greater than 0",
        });
      }
      const sendAllCusID = async (callBack) => {
        let isCallBack = true;
        var invoiceId = [];
        for (let i = 0; i < cusID.length; i++) {
          const getValue = await this.createInvoiceOneByOne({
            body,
            cusID: cusID[i],
            req,
            getInvoiceId: (id) => {
              invoiceId.push(id);
            },
            callBack,
            services,
          });
          if (getValue.status == "error") {
            isCallBack = false;
            return callBack(null, getValue);
          }
        }
        getData = await services.product.encryptData({
          items: body.items,
          docId: [invoiceId],
          date: req.body.date,
          type: "invoice",
        });
        if (getData.status == "error") return callBack(null, getData.status);
        isCallBack &&
          callBack(
            {
              status: "success",
              message: "Invoice Created Successfully",
              data: getData.data,
            },
            false
          );
      };
      await sendAllCusID(callBack);
    } catch (error) {
      console.log(error);
      callBack(null, { status: "error", message: error.message });
    }
  }

  async getInvoice({ req, callBack }) {
    try {
      const getInvoice = await invoice.findOne({
        orgId: req.session.orgId,
        _id: req.query.id,
      });

      if (!getInvoice)
        return callBack(null, {
          status: "error",
          message: "Invoice Not Found",
        });
      return callBack(null, getInvoice);
    } catch (error) {
      console.log(error);
      callBack(null, { status: "error", message: error.message });
    }
  }
  async createInvoiceOneByOne({
    body,
    cusID,
    req,
    getInvoiceId,
    callBack,
    services,
  }) {
    return new Promise(async (resolve, reject) => {
      (async () => {
        const invoicecount = await invoice.find({ orgId: req.session.orgId });
        const invoiceId = await genereateInvoiceId(invoicecount);
        getInvoiceId(invoiceId);
        let getCustomer = await Customer.findOne({ _id: cusID });

        if (body.totalPrice < body.paidAmount)
          return resolve({
            status: "error",
            message: "The payment should be less than the total amount",
          });

        if (!getCustomer)
          return reject({ status: "error", message: "Customer Not Found " });
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
              mode:
                body.transactionDetails.type == ""
                  ? undefined
                  : body.transactionDetails.type,
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
            dueDate: req.body.dueDate,
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
            if (body.paidAmount > 0) {
              const getPromise = await new Promise((resolve, reject) => {
                (async () => {
                  await services.invoice.createPaymentInvoice({
                    ...req,
                    req,
                    whose: "customer",
                    getClient: getCustomer,
                    resolve,
                    reject,
                    invoice: getInvoiceResult,
                    services,
                  });
                })();
              });
              if (getPromise.status == "error") return callBack(getPromise);
              await getCustomer.save();
              await getInvoiceResult.save();
            }
            // return await services.payment
            //   .createPayment({
            //     orgId: req.session.orgId,
            //     clientId: getCustomer._id,
            //     name: getCustomer.name,
            //     amount: body.paidAmount,
            //     mode: body.transactionDetails.type,
            //     date: req.body.date,
            //     type: "in",
            //     whose: "customer",
            //     documents: [
            //       {
            //         type: "erp",
            //         id: getInvoiceResult.id,
            //         payAmount: body.paidAmount,
            //         docAmount: body.totalPrice,
            //       },
            //     ],
            //   })
            //   .then(async (getPayResult) => {
            //     if (getPayResult.status == "error")
            //       return reject(getPayResult);
            //     new Promise((resolve, reject) => {
            //       (async () => {
                    // getCustomer.ledger[
                    //   getCustomer.ledger.length - 1
                    // ].documents.push({
                    //   id: getPayResult.paymentId,
                    //   amount: getPayResult.amount,
                    //   payAmount: getPayResult.amount,
                    // });
            //         getCustomer = await createClientBalanceForPayment({
            //           paidAmount: body.paidAmount,
            //           totalAmount: body.totalPrice,
            //           payment: getPayResult,
            //           getCustomer,
            //           invoice: getInvoiceResult,
            //         });

            //         await getCustomer.save();
            //       })();
            //     });

            //     // add payment details in invoice  and save them
            //     getInvoiceResult.paymentTransactions.push({
            //       type: "payment",
            //       id: getPayResult.paymentId,
            //       amount: getPayResult.amount,
            //     });
            //     await getInvoiceResult.save();
            //     resolve({
            //       status: "success",
            //       message: "Invoice Created Successfully",
            //     });
            //   })
            //   .catch((err) => {
            //     console.log(err);
            //     callBack(null, {
            //       status: "error",
            //       message: "Getting Error When Create Invoice",
            //     });
            //   })
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
      const getInvoice = await invoice.findOne({
        orgId: req.session.orgId,
        id,
      });
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
      console.log(getInvoice);
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
          mode: req.body.transactionDetails.mode,
          date,
          type: "in",
          whose: "customer",
          description: req.body.transactionDetails.notes,
          documents: [
            {
              type: "erp",
              id: getInvoice.id,
              docAmount: getInvoice.totalPrice,
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
                payAmount: getPayResult.amount,
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
          message: "You could not pay your invoice while invoice was cancel",
        });

      if (
        amount !==
          [...paymentList.map((a) => a.amount)].reduce((acc, a) => acc + a) ||
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
      let getPaymentList = await Payment.find({
        orgId: req.session.orgId,
        id: { $in: idList },
        type: "in",
      });
      if (
        getPaymentList.length <= 0 ||
        getPaymentList.length !== paymentList.length
      )
        return callBack(null, {
          status: "error",
          message: "Please give Valuable a payment list",
        });

      getPaymentList = [
        ...getPaymentList.filter((payment) => {
          return customAmountCondition({
            amount: payment.amount,
            id: payment.id,
            paymentList,
            idList,
          });
        }),
      ];

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

      // save the changes in client and invoice

      await getClient.save();
      await getInvoice.save();

      // console.log(getInvoice);
      // console.log(getPaymentList.documents);

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
  async editInvoice({ services, callback, req }) {
    try {
      const body = req.body;
      if (!body.id)
        return callback(null, {
          status: "error",
          message: "we must need a invoice id",
        });
      if (body.editInvoicePayment) {
        if (typeof body.editInvoicePayment.amount !== "number")
          return callback(null, {
            status: "error",
            message: "amount must be a number ",
          });
        if (typeof body.editInvoicePayment.type !== "string")
          return callback(null, {
            status: "error",
            message: "amount must be a string",
          });

        if (
          ![
            ...process.env.PAYMENT_TYPE.split(",").map((getPaymentType) => {
              return getPaymentType.trim();
            }),
          ].includes(body.editInvoicePayment.type)
        )
          return callback(null, {
            status: "error",
            message: "Please enter a valid Payment type",
          });
      }
      const getInvoice = await invoice.findOne({ id: body.id });
      if (!getInvoice)
        return callback(null, {
          status: "error",
          message: "Invoice not found",
        });
      if (getInvoice.status === "cancelled")
        return callback(null, {
          status: "error",
          message: "You can't edit the Invoice when it was cancelled",
        });
      const getCustomer = await Customer.findOne({
        _id: getInvoice.customerDetails.cusID,
      });
      if (!getCustomer)
        return callback(null, {
          status: "error",
          message: "Customer not found",
        });
      if (body.totalPrice < getInvoice.paidAmount)
        return callback(null, {
          status: "error",
          message: "You can't reduce totalPrice less than paid amount",
        });
      if (
        body.totalPrice <
        getInvoice.paidAmount + body.editInvoicePayment.amount
      )
        return callback(null, {
          status: "error",
          message: "You can't pay Paid amount more than totalPrice ",
        });

      const getItems = await services.product.decryptData(body.items);
      if (getItems.status == "error") callback(null, getItems);
      const oldItems = getInvoice.items
      getInvoice.items = getItems.data;
      getInvoice.date = body.date;
      getInvoice.dueDate = body.dueDate;
     
      getInvoice.discount = body.discount;
      getInvoice.tax = body.tax;
      if (getInvoice.totalPrice !== body.totalPrice) {
        // need to cancel previous total amount in balance list
        getCustomer.balance.currentBalance =
          getCustomer.balance.currentBalance - getInvoice.totalPrice;
      
        // then add edit total amount to balance list
        getCustomer.balance.currentBalance =
          getCustomer.balance.currentBalance + body.totalPrice;
     
        getCustomer.ledger[getCustomer.ledger.length - 1].closingBalance =
          getCustomer.balance.currentBalance;
      }
      // add edit total amount to invoice total amount
      getInvoice.totalPrice = body.totalPrice;
      if (body.editInvoicePayment.amount > 0) {
        const getPromise = await new Promise((resolve, reject) => {
          (async () => {
            body.transactionDetails = { type: body.editInvoicePayment.type };
            // add previous paid amount and edit paid amount to invoice paid amount
            getInvoice.paidAmount =
              getInvoice.paidAmount + body.editInvoicePayment.amount;
            // we need to add edit paidAmount to body paid amount
            body.paidAmount = body.editInvoicePayment.amount;
            // update the invoice status
            getInvoice.status = await getAmountStatus({
              totalPrice: body.totalPrice,
              paidAmount: getInvoice.paidAmount,
            });
            await services.invoice.createPaymentInvoice({
              body,
              req,
              whose: "customer",
              getClient: getCustomer,
              resolve,
              reject,
              invoice: getInvoice,
              services,
            });
          })();
        });
        if (getPromise.status == "error") return callback(getPromise);
      }
      else {
        // We need to check the status of the invoice; either payment was zero.
        getInvoice.status = await getAmountStatus({
          totalPrice: body.totalPrice,
          paidAmount: getInvoice.paidAmount,
        });
      }
      const getData = await services.product.encryptData({
        items: getInvoice.items,
        docId: [getInvoice.id],
        date: req.body.date,
        type: "editInvoice",
        oldItems,
      });
      if (getData.status == "error") return callback(getData);

      await getCustomer.save();
      await getInvoice.save();

      return callback(
        {
          status: "success",
          message: "Edit Invoice Successfully",
          data: getData.data,
        },
        false
      );
    } catch (error) {
      return callback(null, {
        status: "error",
        message: `Something went wrong when trying to edit invoice`,
      });
    }
  }
};
