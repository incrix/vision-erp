exports.getPercentageAmount = ({ totalPrice, value }) => {
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
  
  exports.createClientBalanceForPurchase = ({
    paidAmount,
    totalAmount,
    getVendor,
    purchase,
  }) => {
   
    let balanceValue =
      getVendor.ledger[getVendor.ledger.length - 1].closingBalance;
    if (balanceValue > 0) {
      balanceValue = totalAmount + balanceValue;

    } else if (balanceValue > -totalAmount)
      balanceValue = totalAmount - Math.abs(balanceValue);
    else {
      balanceValue = Math.abs(balanceValue) - totalAmount;
      balanceValue = -balanceValue;
    }
  
    getVendor.ledger.push({
      id: purchase.id,
      amount: totalAmount,
      date: purchase.date,
      status:
        paidAmount == 0
          ? "pending"
          : totalAmount == paidAmount
          ? "paid"
          : totalAmount > paidAmount
          ? "partially"
          : null,
      subTitle: "purchase",
      closingBalance: balanceValue,
    });
    //Credit or out   == you pay the customer && green , minus
    // Debit or in == customer pay you && red , plus
  
    return getVendor;
  };
  
  exports.createClientBalanceForPayment = ({
    paidAmount,
    getVendor,
    payment,
  }) => {
    const balanceAmount = getVendor.ledger[getVendor.ledger.length - 1].closingBalance;
    getVendor.ledger.push({
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
  

    return getVendor;
  };
  
  const addCustomerBalance = ({ balance, paidAmount }) => {
    if (balance > 0) {
      return balance - paidAmount;
    }
    return balance - paidAmount;
  };
  
  exports.addincreaseOrdecreaseBalance =({ balance, paidAmount }) => {
    return balance + paidAmount;

  };
  