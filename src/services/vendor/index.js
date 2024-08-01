const vendor = require("../../models/vendor");
const { getDateCreated } = require("../../utils/createDate");
const { generatePaymentId } = require("../../utils/generateID");
module.exports = class Vendor {
  async createVendor({
    req,
    services,
    name,
    email,
    phone,
    companyDetails,
    billingAddress,
    balance,
  }) {
    const { getDate, getTime, getDateMilliseconds } = await getDateCreated();

    return await vendor
      .create({
        name,
        // timestamps: {
        //   date: getDate,
        //   time: getTime,
        //   dateMilliseconds: getDateMilliseconds,
        // },
        orgId: req.session.orgId,
        email,
        phone,
        companyDetails,
        billingAddress,
        balance: {
          openingBalance:
            balance.type == "out" ? balance.value : -balance.value, //Credit or out   == you pay the vendor && green
          currentBalance: balance.type == "in" ? -balance.value : balance.value, // Debit or in == vendor pay you && red
        },
      })
      .then(async (vendorResponse) => {
        if (balance.value > 0)
          return await services.payment
            .createPayment({
              orgId: req.session.orgId,
              clientId: vendorResponse._id,
              id: await generatePaymentId({
                orgId: req.session.orgID,
                type: balance.type,
              }),
              name: vendorResponse.name,
              amount: balance.value,
              mode: "Cash",
              whose: "vendor",
              date: req.body.date,
              type: balance.type,
            })
            .then(async (getPayResult) => {
              if (getPayResult.status == "error") return getPayResult;
              vendorResponse.ledger.push({
                // id: getPayResult.id,
                id:"",
                subTitle: "Balance",
                mode: "Cash",
                amount: balance.value,
                closingBalance:
                  balance.type == "out" ? balance.value : -balance.value,
              })
              await vendorResponse.save();
              return {
                status: "success",
                message: "vendor created successfully",
              };
            })
            .catch((error) => {
              console.log(error);
              return { status: "error", message: "can't create payment" };
            });
        return {
          status: "success",
          message: "vendor created successfully",
        };
      })
      .catch((error) => {
        console.log(error);
        return { status: "error", message: "can't create vendor" };
      });
  }

  async getAllVendor({ req, callback }) {
    return await vendor
      .find({ orgId: req.session.orgId })
      .then((vendorResponse) => {
        if (vendorResponse === null)
          return callback(null, {
            status: "error",
            message: "vendor not found",
          });
        callback(
          {
            status: "success",
            message: "Get vendor successfully",
            data: vendorResponse,
          },
          false
        );
      })
      .catch((error) => {
        callback(null, error);
        return { status: "error", message: "get vendor failed" };
      });
  }
};
