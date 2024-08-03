const Vendor = require("../../models/vendor");
const Customer = require("../../models/customer");
const Invoice = require("../../models/invoice");

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

exports.decreaseTheClientBalanceInOrOut = async ({
  amount,
  getClient,
  paymentId,
  getPayment,
  req,
  docId,
  resolve,
  reject,
  isPaidAmountZero,
  lastIndex,
}) => {
  try {
    let closingBalance = getClient.balance.currentBalance;

    await getClient.ledger.map((ledger) => {
      if (ledger.id == docId && ledger.isCancelled == false) {
        ledger.isCancelled = true;

        ledger.documents = [];
      } else if (ledger.id == paymentId && ledger.isCancelled == false) {
        ledger.amountRemaining = ledger.amount;
        ledger.documents = [];
      }
    });

    if (isPaidAmountZero == undefined) {
      let payableAmount =
        req.session.payAmount == undefined ? 0 : req.session.payAmount;

      getPayment.documents = await [
        ...getPayment.documents.filter((payId) => {
          if (payId.type == "erp") {
            if (payId.id == docId) {
              payableAmount =
                amount - (amount - (payId.payAmount + payableAmount));
            }
          }
          if (payId.type == "erp") payId.id !== docId;
        }),
      ];
      req.session.payAmount = req.session.payAmount + payableAmount;
      getClient.ledger[getClient.ledger.length - 1].closingBalance =
        await checkBalance(closingBalance, payableAmount);
      if (lastIndex) {
        getClient.balance.currentBalance = await checkBalance(
          closingBalance,
          payableAmount
        );
      }
    } else if (isPaidAmountZero !== undefined) {
     
      getClient.ledger[getClient.ledger.length - 1].closingBalance =
        await checkBalance(
          getClient.ledger[getClient.ledger.length - 1].closingBalance,
          amount
        );

      // getClient.balance.currentBalance = await checkBalance(
      //   closingBalance,
      //   amount
      // );
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

async function checkVerifyPayableAmount({
  getPayment,
  docId,
  amount,
  reject,
  resolve,
  payableAmount,
}) {
  try {
    getPayment.documents = await [
      ...getPayment.documents.filter((payId) => {
        if (payId.type == "erp") {
          if (payId.id == docId) {
            payableAmount =
              amount - (amount - (payId.payAmount + payableAmount));
          }
        }
        if (payId.type == "erp") payId.id !== docId;
      }),
    ];
    
    return resolve({
      status: "success",
      message: "Successfully created the document",
      data: payableAmount,
    });
  } catch (error) {
    reject({ status: "error", message: error });
  }
}

async function callLedgerFun({ getClient, closingBalance, amount }) {
  return await new Promise((resolve, reject) => {
    (async () => {
      try {
        if (
          getClient.ledger[getClient.ledger.length - 1].isCancelled == false
        ) {
          console.log("calling 1");
          console.log(await checkBalance(closingBalance, amount));
          getClient.ledger[getClient.ledger.length - 1].closingBalance =
            await checkBalance(closingBalance, amount);
          return resolve({
            status: "success",
            message: "successfully add ledger",
            data: getClient,
          });
        } else if (
          getClient.ledger[getClient.ledger.length - 1].isCancelled == true
        ) {
          for (var i = 0; i < getClient.ledger.length; ) {
            if (
              getClient.ledger[getClient.ledger.length - (1 + i)].isCancelled ==
              false
            ) {
              getClient.ledger[getClient.ledger.length - 1].closingBalance =
                await checkBalance(closingBalance, amount);
              break;
            } else continue;
          }
        }
        return resolve({
          status: "success",
          message: "successfully add ledger",
          data: getClient,
        });
      } catch (error) {
        return reject({ status: "error", message: error.message });
      }
    })();
  });
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

exports.checkTheBalanceWithInandOutForCancelPay = ({
  paidAmount,
  totalAmount,
  getClient,
}) => {
  const getBalanceAmount = totalAmount - paidAmount;

  if (getBalanceAmount == 0) {
    if (getClient.balance.gave > paidAmount)
      getClient.balance.gave = getClient.balance.gave - paidAmount;
    else getClient.balance.gave = paidAmount - getClient.balance.gave;
    return getClient;
  }
  if (getClient.balance.gave > paidAmount)
    getClient.balance.gave = getClient.balance.gave - paidAmount;
  else getClient.balance.gave = paidAmount - getClient.balance.gave;

  if (getClient.balance.borrow > paidAmount)
    getClient.balance.borrow = getClient.balance.borrow - paidAmount;
  else getClient.balance.borrow = paidAmount - getClient.balance.borrow;

  return getClient;
};
