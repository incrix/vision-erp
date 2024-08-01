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
  docId,
  resolve,
  reject,
  isViaBalance,
}) => {
  try {
    // I am unable to change the balance amount in the current balance.

    let closingBalance = getClient.balance.currentBalance;

    await getClient.ledger.map((ledger) => {
      if (ledger.id == docId && ledger.isCancelled == false) {
        ledger.isCancelled = true;
        ledger.documents = []
      } else if (ledger.id == paymentId && ledger.isCancelled == false) {
        ledger.amountRemaining = ledger.amount;
        ledger.documents = []
      }
    });

    if (
      // lastIndex &&
      // req.session.countBalance == invoicePaidAmount &&
      isViaBalance == undefined
    ) {
      // console.log(getClient.ledger.filter((pay) => pay.id == getPayment.id));
      let payableAmount = 0
      getPayment.documents = await [
        ...getPayment.documents.filter((payId) => {
          if (payId.type == "erp") {if ( payId.id == docId ){
             payableAmount = amount - (amount - (payId.payAmount + payableAmount)) 
            
            }}
          if (payId.type == "erp") payId.id !== docId;    
        }), ];
      console.log(payableAmount);      
      getClient.ledger[getClient.ledger.length - 1].closingBalance =
        await checkBalance(closingBalance, payableAmount);

      getClient.balance.currentBalance = await checkBalance(
        closingBalance,
         payableAmount
      );
    } else if (isViaBalance !== undefined) {
      getClient.ledger[getClient.ledger.length - 1].closingBalance =
        await checkBalance(closingBalance, amount);

      getClient.balance.currentBalance = await checkBalance(
        closingBalance,
        amount
      );
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
    reject({ status: "error", message: error.message });
  }
};

function checkBalance(balance, amount) {
  if (balance > 0) {
    return balance - amount;
  }
  return balance - amount;

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
