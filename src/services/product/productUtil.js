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