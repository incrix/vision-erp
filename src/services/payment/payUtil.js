const Vendor = require("../../models/vendor");
const Customer = require("../../models/customer");
const Invoice = require("../../models/invoice");

exports.getClientVerify = async ({ whose, clientId, req }) => {
  if (whose == "customer") {
    return await Customer.findOne({
      orgId: req.session.orgId,
      _id: clientId,
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
      _id: clientId,
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
  type,
  getClient,
  documents,
}) => {
  if (documents) {
    await Invoice.findOne({ amount: amount, type });
  }
  if (type == "out") {
    if (getClient.balance.borrow > amount)
      getClient.balance.borrow = getClient.balance.borrow - amount;
    else getClient.balance.borrow = amount - getClient.balance.borrow;
  } else if (type == "in") {
    if (getClient.balance.gave > amount)
      getClient.balance.gave = getClient.balance.gave - amount;
    else getClient.balance.gave = amount - getClient.balance.gave;
  }

  return getClient;
};

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
