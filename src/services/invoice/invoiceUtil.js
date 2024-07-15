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

  paidAmount,
}) => {
  if (totalPrice == paidAmount) {
    return "paid";
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
  // if (getCustomer.balance.currentBalance > 0)
  //   getCustomer.balance.currentBalance =
  //     totalAmount + getCustomer.balance.currentBalance;
  // else if (getCustomer.balance.currentBalance > -totalAmount)
  //   getCustomer.balance.currentBalance =
  //     totalAmount - Math.abs(getCustomer.balance.currentBalance);
  // else {
  //   getCustomer.balance.currentBalance =
  //     Math.abs(getCustomer.balance.currentBalance) - totalAmount;
  //   getCustomer.balance.currentBalance = -getCustomer.balance.currentBalance;
  // }

  let balanceValue =
    getCustomer.ledger[getCustomer.ledger.length - 1].closingBalance;
  if (balanceValue > 0) {
    balanceValue = totalAmount + balanceValue;
    // getCustomer.balance.currentBalance = totalAmount + balanceValue;
  } else if (balanceValue > -totalAmount)
    balanceValue = totalAmount - Math.abs(balanceValue);
  else {
    balanceValue = Math.abs(balanceValue) - totalAmount;
    balanceValue = -balanceValue;
  }

  getCustomer.ledger.push({
    id: invoice.id,
    amount: totalAmount,
    date: invoice.date,
    status:
      paidAmount == 0
        ? "pending"
        : totalAmount == paidAmount
        ? "paid"
        : totalAmount > paidAmount
        ? "partially"
        : null,
    subTitle: "invoice",
    closingBalance: balanceValue,
  });
  //Credit or out   == you pay the customer && green , minus
  // Debit or in == customer pay you && red , plus

  return getCustomer;
};

exports.createClientBalanceForPayment = ({
  paidAmount,
  getCustomer,
  payment,
}) => {
  const balanceAmount = getCustomer.ledger[getCustomer.ledger.length - 1].closingBalance;
  getCustomer.ledger.push({
    id: payment.paymentId,
    amount: paidAmount,
    date: payment.date,
    mode: payment.mode,
    subTitle: "payment in",
    closingBalance: addCustomerBalance({
      balance: balanceAmount,
      paidAmount,
    }),
  });
  //Credit or out   == you pay the customer && green , minus
  // Debit or in == customer pay you && red , plus

  // getCustomer.balance.currentBalance = addCustomerBalance({
  //   balance:balanceAmount, 
  //   paidAmount,
  // });
  return getCustomer;
};

const addCustomerBalance = ({ balance, paidAmount }) => {
  if (balance > 0) {
    return balance - paidAmount;
  }
  return balance - paidAmount;
};

exports.addincreaseOrdecreaseBalance =({ balance, paidAmount }) => {
  return balance + paidAmount;
  // if (balance > 0) {
  //   return  balance - paidAmount;
  // }
  // if (balance >= -paidAmount){
  //   balance = paidAmount - Math.abs(balance)
  // }
  // else {
  //   balance = Math.abs(balance) - paidAmount;
  //   balance = -balance;
  // }
  // return balance 
};
