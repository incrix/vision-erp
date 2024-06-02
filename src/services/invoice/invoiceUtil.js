exports.getPersentageAmount =({ totalPrice, value }) =>{
    return eval(totalPrice) * (eval(value) / 100);
  }

  exports.getDateCreated =() => {
    const currentUTCMilliseconds = Date.now();
    const getFormat = new Date(
      currentUTCMilliseconds + 19800000
    ).toLocaleString("en-US", { timeZone: "UTC" });
    const getDate = getFormat.split(",")[0].trim();
    const getTime = getFormat.split(",")[1].trim();

    return {
      getDate,
      getTime,
      getDateMilliseconds: currentUTCMilliseconds + 19800000,
    };
  }

  exports.getAmountStatus=({ totalPrice, cusBalance, disValue, paidAmount }) =>{
    if (totalPrice == paidAmount) {
      return "completed";
    } else if (paidAmount > 0) {
      return "partial";
    }
    return "pending";
  }