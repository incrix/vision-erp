const Vendor = require("../../models/vendor");
const Customer = require("../../models/customer");
const Invoice = require("../../models/invoice");
const Purchase = require("../../models/purchase");
exports.getClientVerify = async ({ whose, id, req }) => {
  if (whose == "customer") {
    return await Customer.findOne({
      orgId: req.session.orgId,
      _id: id,
    }).catch((err) => {
      return {
        status: "error",
        message: "something went wrong in client id",
      };
    });
  }
  if (whose == "vendor") {
    return await Vendor.findOne({
      orgId: req.session.orgId,
      _id: id,
    }).catch((err) => {
      return {
        status: "error",
        message: "something went wrong in client id",
      };
    });
  }
  return null;
};

exports.payInForInvoice = async ({
  reject,
  getClient,
  docList,
  amount,
  id,
}) => {
  try {
    const idList = [...docList.map((doc) => doc.docId)];

    const getInvoiceList = await Invoice.find({
      orgId: getClient.orgId,
      id: { $in: idList },
    });
    if (idList.length !== getInvoiceList.length)
      return reject({
        status: "error",
        message: "Please check the invoice list",
      });
    if (
      getInvoiceList.length !==
      getInvoiceList.filter(
        (invoice) => invoice.customerDetails.cusID.valueOf() == id.valueOf()
      ).length
    )
      return reject({
        status: "error",
        message: " Something  went wrong with the client invoice",
      });
    let requiredAmount = 0;
    getInvoiceList.map((invoice, index) => {
      if (invoice.status == "paid" || invoice.status == "cancelled")
        return reject({
          status: "error",
          message: `You can't pay invoice when it was already ${invoice.status}`,
        });
      if (invoice.id == docList[index].docId) {
        const balanceAmount = invoice.totalPrice - invoice.paidAmount;
        console.log(docList[index].remainingAmount, balanceAmount);
        if (docList[index].remainingAmount > balanceAmount)
          return reject({
            status: "error",
            message:
              "The pay amount is higher than the invoice remaining amount.",
          });
        requiredAmount += docList[index].remainingAmount;
      }
    });
    if (requiredAmount > amount)
      return reject({
        status: "error",
        message:
          "The pay amount should be higher than the total invoice amount.",
      });
    // console.log(requiredAmount , amount);

    // if (requiredAmount !== amount)
    //   return reject({status: "error", message: "The pay total amount should be equal to the remaining invoice total amount."});
    return getInvoiceList;
  } catch (error) {
    return reject({ status: "error", message: error.message });
  }
};

exports.payInForPurchase = async ({ reject, getClient, docList, amount }) => {
  try {
    const idList = [...docList.map((doc) => doc.docId)];

    const getPurchaseList = await Purchase.find({
      orgId: getClient.orgId,
      id: { $in: idList },
    });
    if (idList.length !== getPurchaseList.length)
      return reject({
        status: "error",
        message: "Please check the purchase list",
      });
    let requiredAmount = 0;
    getPurchaseList.map((purchase, index) => {
      if (purchase.status == "paid" || purchase.status == "cancelled")
        return reject({
          status: "error",
          message: `You can't pay purchase when it was already ${purchase.status}`,
        });
      if (purchase.id == docList[index].docId) {
        const balanceAmount = purchase.totalPrice - purchase.paidAmount;
        if (docList[index].remainingAmount >= balanceAmount)
          return reject({
            status: "error",
            message:
              "The pay amount is higher than the purchase remaining amount",
          });
        requiredAmount += balanceAmount;
      }
    });
    console.log(requiredAmount, amount);
    if (requiredAmount == amount)
      return reject({ status: "error", message: "Invalid amount" });

    return getPurchaseList;
  } catch (error) {
    return reject({ status: "error", message: error.message });
  }
};

exports.payAmountIn = async ({
  docList,
  amount,
  getDocList,
  getPayment,
  getClient,
  resolve,
  reject,
}) => {
  try {
    let balanceValue = getClient.balance.currentBalance;
    balanceValue = balanceValue - amount;
    const list = [];
    getClient.balance.currentBalance = balanceValue;
    if (getDocList.length > 0) {
      await getDocList.map(async (doc, index) => {
        if (doc.totalPrice < doc.paidAmount + docList[index].remainingAmount)
          return reject({
            status: "error",
            message: "Payment amount is higher than total amount ",
          });
        doc.status = await getAmountStatus({
          totalPrice: doc.totalPrice,
          paidAmount: doc.paidAmount + docList[index].remainingAmount,
        });
        doc.paidAmount = doc.paidAmount + docList[index].remainingAmount;
        doc.paymentTransactions.push({
          type: "payment",
          id: getPayment.id,
          amount: getPayment.amount,
        });
        getPayment.documents.push({
          type: "erp",
          id: doc.id,
          docAmount: doc.totalPrice,
          payAmount: docList[index].remainingAmount,
        });
        getClient.ledger.map((ledger) => {
          if (ledger.id == doc.id) {
            ledger.status = doc.status;
            ledger.amountRemaining = doc.totalPrice - doc.paidAmount;
            ledger.documents.push({
              id: getPayment.id,
              amount: getPayment.amount,
            });
          }
        });
        list.push({
          id: doc.id,
          amount: doc.totalPrice,
        });
        await doc.save();
      });
    }
    let getTotalAmount = [...docList.map((get) => get.remainingAmount)];
    getTotalAmount = getTotalAmount.reduce((a, b) => a + b, 0);

    getClient.ledger.push({
      id: getPayment.id,
      amount: getPayment.amount,
      date: getPayment.date,
      mode: getPayment.mode,
      subTitle: "payment in",
      documents: getDocList.length > 0 ? list : [],
      amountRemaining:
        getDocList.length > 0 ? getPayment.amount - getTotalAmount : 0,
      closingBalance: balanceValue,
    });
    // console.log(getPayment);
    // console.log(getDocList[0].paymentTransactions);
    // console.log(getClient.balance.currentBalance);
    await getClient.save();
    await getPayment.save();

    return resolve({ status: "success", message: "add balance successfully" });
  } catch (error) {
    return reject({ status: "error", message: error.message });
  }
};

const getAmountStatus = ({ totalPrice, paidAmount }) => {
  if (totalPrice == paidAmount) {
    return "paid";
  } else if (paidAmount > 0) {
    return "partially";
  }
  return "pending";
};

exports.decreaseTheClientBalanceInOrOut = async ({
  amount,
  getClient,
  paymentId,
  getPayment,
  totalPrice,
  req,
  docId,
  resolve,
  reject,
  isPaidAmountZero,
  lastIndex,
}) => {
  try {
    let closingBalance = getClient.balance.currentBalance;

    await getClient.ledger.map(async (ledger) => {
      if (ledger.id == docId && ledger.isCancelled == false) {
        ledger.isCancelled = true;

        ledger.documents = [];
      } else if (ledger.id == paymentId && ledger.isCancelled == false) {
        const documents = await [
          ...ledger.documents.filter((getAmount) => getAmount.id !== docId),
        ];

        ledger.amountRemaining = ledger.amount;
        ledger.documents = documents;
      }
    });

    if (isPaidAmountZero == undefined) {
      // let payableAmount =
      //   req.session.payAmount == undefined ? 0 : req.session.payAmount;
      // let docAmount = 0;
      getPayment.documents = await [
        ...getPayment.documents.filter((payId) => {
          // if (payId.type == "erp") {
            // if (payId.id == docId) {
              // docAmount = payId.docAmount;
              // payableAmount =
              //   amount - (amount - (payId.payAmount + payableAmount));
            // }
          // }
          if (payId.type == "erp") payId.id !== docId;
        }),
      ];

      // req.session.payAmount = req.session.payAmount + payableAmount;
     
      getClient.ledger[getClient.ledger.length - 1].closingBalance =
        await getReduceDocAmount(totalPrice, closingBalance);
      if (lastIndex) {
        console.log(await getReduceDocAmount(totalPrice, closingBalance));
        getClient.balance.currentBalance = await getReduceDocAmount(
          totalPrice,
          closingBalance
        );
      }
    } else if (isPaidAmountZero !== undefined) {
      const balanceValue = await getReduceDocAmount(amount, closingBalance);

      getClient.ledger[getClient.ledger.length - 1].closingBalance =
        balanceValue;
      getClient.balance.currentBalance = balanceValue;
    }
    return (
      (await getClient) &&
      resolve({
        status: "success",
        message: "successfully change client ledger and balance",
      })
    );
  } catch (error) {
    console.log(error);
    return reject({ status: "error", message: error.message });
  }
};

function getReduceDocAmount(docBalance, closingBalance) {
  if (docBalance > closingBalance) return -(docBalance - closingBalance);
  return closingBalance - docBalance;
}

function checkBalance(balance, amount) {
  if (balance > 0) {
    return balance - amount;
  }
  return balance - amount;
  // return   amount - balance
}

exports.addBalanceWithInandOut = ({ type, amount, getClient }) => {
  if (type == "in") getClient.balance.gave = getClient.balance.gave + amount;
  else if (type == "out")
    getClient.balance.borrow = getClient.balance.borrow + amount;
  return getClient;
};
