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
  invoicePaidAmount,
  getClient,
  paymentId,
  invoiceId,
  req,
  invoiceAmount,
  lastIndex,
  isViaBalance,
}) => {
  // I am unable to change the balance amount in the current balance.


  let closingBalance = getClient.balance.currentBalance;

  await getClient.ledger.map((ledger) => {
    if (ledger.id == paymentId || ledger.id == invoiceId) {
      ledger.isCancelled = true;
    }
  });

  if (
    // lastIndex &&
    // req.session.countBalance == invoicePaidAmount &&
    isViaBalance == undefined
  ) {
    getClient.ledger[getClient.ledger.length - 1].closingBalance =
      await checkBalance(
        closingBalance,
        amount
      );
 
    getClient.balance.currentBalance = await checkBalance(
      closingBalance,
      amount
    );
  } else if (isViaBalance !== undefined) {
    getClient.ledger[getClient.ledger.length - 1].closingBalance =
      await checkBalance(
        closingBalance,
        amount
      );
 
    getClient.balance.currentBalance = await checkBalance(
      closingBalance,
      amount
    );
  }

  return await getClient;
};

function checkBalance(balance, amount) {
  if (balance > 0) {
    return balance - amount;
  }
  return balance - amount;
  // console.log(balance, amount);
  //   if (balance > 0) {
  //     balance = balance - amount;
  //   }
  //   else if (balance < 0) {
  //     balance =  amount - balance ;
  //   }
  //   //  else if (balance >= -amount) {
  //   //   balance = amount - Math.abs(balance);
  //   // } else {
  //   //   balance = Math.abs(balance) - amount;
  //   //   balance = -balance;
  //   // }
  //   return balance;
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
