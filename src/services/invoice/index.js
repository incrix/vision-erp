const invoice = require("../../models/invoice");
const Customer = require("../../models/customer");
const { genereateInvoiceId } = require("../../utils/generateID");
const {
  getPersentageAmount,
  getAmountStatus,
} = require("./invoiceUtil");
const { getDateCreated,} = require('../../utils/createDate')
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
    const { getDate, getTime, getDateMilliseconds } = await getDateCreated();
    return new Promise(async (resolve, reject) => {
      (async () => {
        const invoicecount = await invoice.find({ orgId: req.session.orgId });
        const invoiceId = await genereateInvoiceId(invoicecount);
        const getCustomer = await Customer.findOne({ _id: cusID });
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
            invoiceId,
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
            date: getDate,
            time: getTime,
            dateMilliseconds: getDateMilliseconds,
          })
          .then(async (getInvoiceResult) => {
            if(body.paidAmount > 0)
           return await services.payment
              .createPayment({
                orgId:req.session.orgId,
                clientId:getCustomer._id,
                name:getCustomer.name,
                amount:body.paidAmount,
                mode:body.transationDetails.type,
                timestamps:{
                  date: getDate,
                  time: getTime,
                  dateMilliseconds: getDateMilliseconds
                },
                type: "in",
                documents: [
                  {
                    type: "erp",
                    id: getInvoiceResult.invoiceId,
                  },
                ],
              })
              .then((getPayResult) => {
               
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

  // async createPayment({
  //   req,
  //   getInvoiceResult,
  //   getCustomer,
  //   body,
  //   getDate,
  //   getTime,
  //   getDateMilliseconds,
  // }) {
  //   await Payment.create({
  //     orgId: req.session.orgId,
  //     clientId: getCustomer._id,
  //     amount: body.paidAmount,
  //     mode: body.transationDetails.type,
  //     type: "got",
  //     documents: {
  //       type: "erp",
  //       id: getInvoiceResult.invoiceId,
  //     },
  //     timestamps: {
  //       date: getDate,
  //       time: getTime,
  //       dateMilliseconds: getDateMilliseconds,
  //     },
  //   });
  // }

  async getAllInvoice({ req, callBack }) {
    try {
      //  const getInvoice = await Payment.find({ orgId: req.session.orgId })
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
  async cancelInvoice({ req, callBack, invoiceId }) {
    try {
      const getInvoice = await invoice.findOne({
        orgId: req.session.orgId,
        invoiceId,
      });
      if (!getInvoice)
        callBack(null, {
          status: "error",
          message: "something went wrong with organization Id",
        });
      getInvoice.status = "cancelled";
      await getInvoice.save();
      callBack(
        { status: "status", message: "invoice cancelled successfully" },
        false
      );
    } catch (error) {
      callBack(error);
    }
  }
  async cancelInvoice({ req, callBack, invoiceId }) {
    try {
      const getInvoice = await invoice.findOne({
        orgId: req.session.orgId,
        invoiceId,
      });
      if (!getInvoice)
        callBack(null, {
          status: "error",
          message: "something went wrong with organization Id",
        });
      getInvoice.status = "cancelled";
      await getInvoice.save();
      callBack(
        { status: "status", message: "invoice cancelled successfully" },
        false
      );
    } catch (error) {
      callBack(error);
    }
  }
  async deleteInvoice({ req, callBack, invoiceId }) {
    try {
      const getInvoice = await invoice.deleteOne({
        orgId: req.session.orgId,
        invoiceId,
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
};
