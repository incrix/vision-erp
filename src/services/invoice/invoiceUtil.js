exports.getPersentageAmount = ({ totalPrice, value }) => {
  return eval(totalPrice) * (eval(value) / 100);
};

exports.getDateCreated = () => {
  const currentUTCMilliseconds = Date.now();
  const getFormat = new Date(currentUTCMilliseconds + 19800000).toLocaleString(
    "en-US",
    { timeZone: "UTC" }
  );
  const getDate = getFormat.split(",")[0].trim();
  const getTime = getFormat.split(",")[1].trim();

  return {
    getDate,
    getTime,
    getDateMilliseconds: currentUTCMilliseconds + 19800000,
  };
};

exports.getAmountStatus = ({
  totalPrice,
  cusBalance,
  disValue,
  paidAmount,
}) => {
  if (totalPrice == paidAmount) {
    return "completed";
  } else if (paidAmount > 0) {
    return "partially";
  }
  return "pending";
};

exports.createClientBalanceForInvoice = ({
  paidAmount,
  totalAmount,
  getCustomer,
  invoice,
}) => {

const summa = getCustomer.balance.currentBalance
  if (getCustomer.balance.currentBalance > 0)
    getCustomer.balance.currentBalance =
      totalAmount + getCustomer.balance.currentBalance;
  else if (getCustomer.balance.currentBalance > -totalAmount)
    getCustomer.balance.currentBalance =
      totalAmount - Math.abs(getCustomer.balance.currentBalance);
else  {
  getCustomer.balance.currentBalance =
Math.abs(getCustomer.balance.currentBalance) - totalAmount
getCustomer.balance.currentBalance = -getCustomer.balance.currentBalance 
}

  getCustomer.ledger.push({
    id: invoice._id,
    amount: totalAmount,
    date: invoice.date,
    staus:
      paidAmount == 0
        ? "pending"
        : totalAmount == paidAmount
        ? "paid"
        : totalAmount > paidAmount
        ? "partially"
        : null,
    subTitle: "invoice",
    closingBalance: getCustomer.balance.currentBalance,
  });
  //Credit or out   == you pay the customer && green , minus
  // Debit or in == customer pay you && red , plus

  return getCustomer;
};

exports.createClientBalanceForPayment = ({
  paidAmount,
  totalAmount,
  getCustomer,
  payment,
}) => {
  getCustomer.ledger.push({
    id: payment._id,
    amount: paidAmount,
    date: payment.date,
    mode: payment.mode,
    subTitle: "payment in",
    closingBalance: addCustomerBalance({
      balance: getCustomer.balance.currentBalance,
      paidAmount,
    }),
  });
  //Credit or out   == you pay the customer && green , minus
  // Debit or in == customer pay you && red , plus

  getCustomer.balance.currentBalance = addCustomerBalance({
    balance: getCustomer.balance.currentBalance,
    paidAmount,
  });
  return getCustomer;
};

const addCustomerBalance = ({ balance, paidAmount }) => {
  if (balance > 0) {
    return balance - paidAmount;
  }
  return balance - paidAmount;
};
