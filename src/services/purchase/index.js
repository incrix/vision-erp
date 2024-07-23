const purchase = require("../../models/purchase");


// const invoice = require("../../models/invoice");
const Vendor = require("../../models/vendor");
const { genereatePurchase } = require("../../utils/generateID");
const {
  getPersentageAmount,
  getAmountStatus,
  createClientBalanceForPurchase,
  createClientBalanceForPayment,
  addincreaseOrdecreaseBalance,
} = require("./purchaseUtil");

const { getDateCreated } = require("../../utils/createDate");

module.exports = class Purchase {
  async createPurchase({ body, req, callBack, services }) {
    try {
      const venID = body.venID;
      const sendAllvenID = async (callBack) => {
        let isCallBack = true;
        for (let i = 0; i < venID.length; i++) {
          const getValue = await this.createPurchaseOneByOne({
            body,
            venID: venID[i],
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
              message: "Purchase Created Successfully",
            },
            false
          );
      };
      await sendAllvenID(callBack);
    } catch (error) {
      console.log(error);
      callBack(null, { status: "error", message: "Can't Create Purchase" });
    }
  }

  async createPurchaseOneByOne({ body, venID, req, callBack, services }) {
    return new Promise(async (resolve, reject) => {
      (async () => {
        const purchasecount = await purchase.find({ orgId: req.session.orgId });
        const purchaseId = await genereatePurchase(purchasecount);
        let getVendor = await Vendor.findOne({ _id: venID });

        if (body.totalPrice < body.paidAmount)
          return resolve({
            status: "error",
            message: "The Incorrect Paid Amount",
          });

        if (!getVendor)
          return resolve({ status: "error", message: "vendor Not Found" });
        console.log(getVendor);
        return await purchase
          .create({
            orgId: req.session.orgId,
            userId: req.session.userId,
            id: purchaseId,
            vendorDetails: {
              vendorName: getVendor.name,
              venID: getVendor._id,
              phone: getVendor.phone == undefined ? "" : getVendor.phone,
              email: getVendor.email === undefined ? "" : getVendor.email,
              billingAddress:
                getVendor.billingAddress == undefined
                  ? undefined
                  : getVendor.billingAddress,
              companyDetails:
                getVendor.companyDetails == undefined
                  ? undefined
                  : getVendor.companyDetails,
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
              cusBalance: getVendor.balance,
              totalPrice: body.totalPrice,
              paidAmount: body.paidAmount,
              disValue: body.discount.value,
            }),
            date: req.body.date,
          })
          .then(async (getPurchaseResult) => {
            new Promise((resolve, reject) => {
              (async () => {
                getVendor = await createClientBalanceForPurchase({
                  paidAmount: body.paidAmount,
                  totalAmount: body.totalPrice,
                  purchase: getPurchaseResult,
                  getVendor,
                });

              })();
            });
            if (body.paidAmount > 0)
              return await services.payment
                .createPayment({
                  orgId: req.session.orgId,
                  clientId: getVendor._id,
                  name: getVendor.name,
                  amount: body.paidAmount,
                  mode: body.transactionDetails.type,
                  date: req.body.date,
                  type: "in",
                  whose: "vendor",
                  documents: [
                    {
                      type: "erp",
                      id: getPurchaseResult.id,
                    },
                  ],
                })
                .then(async (getPayResult) => {
             
                  new Promise((resolve, reject) => {
                    (async () => {
                      getVendor = await createClientBalanceForPayment({
                        paidAmount: body.paidAmount,
                        totalAmount: body.totalPrice,
                        payment: getPayResult,
                        getVendor,
                      });

                      await getVendor.save();
                    })();
                  });

                  // add payment details in invoice  and save them
                  getPurchaseResult.paymentTransactions.push({
                    type: "payment",
                    id: getPayResult.id,
                  });
                  await getPurchaseResult.save();
                  resolve({
                    status: "success",
                    message: "Purchase Created Successfully",
                  });
                })
                .catch((err) => {
                  console.log(err);
                  callBack(null, {
                    status: "error",
                    message: "Getting Error When Create Purchase",
                  });
                });
            else {
              await getVendor.save();
            }

            return resolve({
              status: "success",
              message: "Purchase Created Successfully",
            });
          })
          .catch((err) => {
            console.log(err);
            callBack(null, {
              status: "error",
              message: "Getting Error When Create Purchase",
            });
          });
      })();
    });
  }

  async getAllPurchase({ req, callBack }) {
    try {
      const getVendor = await purchase.find({ orgId: req.session.orgId });
      if (!getVendor)
        callBack(null, {
          status: "error",
          message: "something went wrong with organization Id",
        });
      callBack({status:"success",message:"Get All Purchase Successfully",data:getVendor});
    } catch (error) {
      
      callBack(error);
    }
  }
  async cancelPurchase({ req, callBack, services, id }) {
    try {
      const getPurchase = await purchase.findOne({
        orgId: req.session.orgId,
        id,
      });

      if (!getPurchase)
       return callBack(null, {
          status: "error",
          message: "something went wrong with organization Id Or Purchase Id",
        });
      if (getPurchase.status == "cancelled")
        return callBack(null, {
          status: "error",
          message: "Purchase is already cancelled",
        });
      if (getPurchase.paymentTransactions.length > 0) {
        req.body.docId = getPurchase.id;
        for (let i = 0; i < getPurchase.paymentTransactions.length; i++) {
          const getPromise = await new Promise((resolve, reject) => {
            (async () => {
              //  If the payment is made through cash or UPI, the function will call
              if (getPurchase.paymentTransactions[i].type !== "balance") {
                req.body.paymentId = getPurchase.paymentTransactions[i].id;
                
                await services.payment.cancelPayment({
                  req,
                  totalPrice: getPurchase.totalPrice,
                  paidAmount: getPurchase.paidAmount,
                  lastIndex:
                    getPurchase.paymentTransactions[
                      getPurchase.paymentTransactions.length - 1
                    ] == getPurchase.paymentTransactions[i]
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
                  totalPrice: getPurchase.totalPrice,
                  paidAmount: getPurchase.paidAmount,
                  whose: "vendor",
                  id: getPurchase.vendorDetails.venID,
                  amount:getPurchase.paymentTransactions[i].amount,
                  isViaBalance:true,
                  lastIndex:
                    getPurchase.paymentTransactions[
                      getPurchase.paymentTransactions.length - 1
                    ] == getPurchase.paymentTransactions[i]
                      ? true
                      : false,
                  callback: function (err, data) {
                    if (err) resolve(data);
                    if (data.status == "error" || data == null) resolve(data);
                    resolve(data);
                  },
                });
            })();
          })

          if (getPromise.status == "error") return callBack(null, getPromise);
        }
      }
      // This function will call if the payment doesn't pay
      else if (getPurchase.paidAmount == 0) {
        const getPromise = await new Promise(function (resolve, reject) {
          (async () => {
            await services.payment.cancelPaymentForBalance({
              req,
              totalPrice: getPurchase.totalPrice,
              paidAmount: getPurchase.paidAmount,
              whose: "vendor",
              id: getPurchase.vendorDetails.venID,
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
// change status to "cancelled"
      getPurchase.status = "cancelled";
    
       await getPurchase.save();
      callBack(
        { status: "success", message: "Purchase cancelled successfully" },
        false
      );
    } catch (error) {
        console.log(error);
      callBack(null, error.message);
    }
  }


  /// purchasePayment fuction

  async purchasePayment({ req, callBack, services, body }) {
    try {
      const { id, date, amount } = body;
      const getPurchase = await purchase.findOne({ id });
      if (!getPurchase)
        return callBack(null, {
          status: "error",
          message: "Can't find Purchase ",
        });
      let getClient = await Vendor.findOne({
        _id: getPurchase.vendorDetails.venID,
      });

      if (!getClient)
        return callBack(null, {
          status: "error",
          message: "Can't find client ",
        });
      if (getPurchase.status == "paid")
        return callBack(null, {
          status: "error",
          message: "Purchase is already paid",
        });

      if (getPurchase.status == "cancelled")
        return callBack(null, {
          status: "error",
          message: "You could not pay Purchase while Purchase is cancelled",
        });

      if (
        amount > getPurchase.totalPrice ||
        getPurchase.totalPrice < getPurchase.paidAmount ||
        getPurchase.totalPrice < getPurchase.paidAmount + amount
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
          mode: req.body.mode,
          date,
          type: "in",
          whose: "vendor",
          documents: [
            {
              type: "erp",
              id: getPurchase.id,
            },
          ],
        })
        .then(async (getPayResult) => {
          new Promise((resolve, reject) => {
            (async () => {
              getClient = await createClientBalanceForPayment({
                paidAmount: amount,
                totalAmount: getPurchase.totalPrice,
                payment: {
                  paymentId: getPayResult.paymentId,
                  date,
                  mode: req.body.mode,
                },
                getVendor: getClient,
              });
            })();
          });
          getPurchase.status = await getAmountStatus({
            totalPrice: getPurchase.totalPrice,
            paidAmount: getPurchase.paidAmount + amount,
          });

          getClient.ledger.map((purchase) => {
            if (purchase.id == getPurchase.id) {
              purchase.status = getPurchase.status;
            }
          });

          getPurchase.paymentTransactions.push({
            type: "payment",
            id: getPayResult.id,
          });
          getPurchase.paidAmount = getPurchase.paidAmount + amount;
          await getClient.save();
          await getPurchase.save();
          return callBack({
            statusbar: "success",
            message: "Make a payment successfully",
            data: getPurchase,
          });
        });
    } catch (error) {
      console.log(error);
      return callBack(null, {
        status: "error",
        message: "Something went wrong when trying to payment Purchase",
      });
    }
  }

  async paymentThroughCurrentBalance({ req, body, callBack }) {
    try {
      const { id, amount } = body;
      const getPurchase = await purchase.findOne({
        orgId: req.session.orgId,
        id,
      });
      if (!getPurchase)
       return callBack(null, {
          status: "error",
          message: "Can't find Purchase",
        });
      if (getPurchase.status == "paid")
        return callBack(null, {
          status: "error",
          message: "Purchase is already paid",
        });
      if (getPurchase.status == "cancelled")
        return callBack(null, {
          status: "error",
          message: "You could not pay your Purchase while Purchase is cancelled",
        });

      if (
        amount > getPurchase.totalPrice ||
        getPurchase.totalPrice < getPurchase.paidAmount ||
        getPurchase.totalPrice < getPurchase.paidAmount + amount
      )
        return callBack(null, {
          status: "error",
          message: "The Incorrect Paid Amount",
        });
      const getClient = await Vendor.findOne({
        _id: getPurchase.vendorDetails.venID,
      });

      if (!getClient)
        return callBack(null, {
          status: "error",
          message: "Couldn't find client ",
        });


      getPurchase.status = await getAmountStatus({
        totalPrice: getPurchase.totalPrice,
        paidAmount: getPurchase.paidAmount + amount,
      });

      getClient.ledger.map((purchase) => {
        if (purchase.id == getPurchase.id) {
          purchase.status = getPurchase.status;
        }
      });
      getPurchase.paymentTransactions.push({ type: "balance", amount: amount });
      // add the payment amount in the invoice paid amount
      getPurchase.paidAmount = getPurchase.paidAmount + amount;
      // to add amount in client cloing balance

      getClient.balance.currentBalance = await addincreaseOrdecreaseBalance({
        balance: getClient.balance.currentBalance,
        paidAmount: amount,
      });
    
      await getClient.save();
      await getPurchase.save();

      return callBack({
        status: "success",
        message: "Make a payment successfully",
      });
    } catch (e) {
      console.log(e);
      return callBack(null, {
        status: "error",
        message: `Something went wrong when trying to payment purchase`,
      });
    }
  }
};
