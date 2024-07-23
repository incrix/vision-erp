const customer = require("../../models/customer");
const { getDateCreated } = require("../../utils/createDate");
const { generatePaymentId } = require("../../utils/generateID");
const { isValidDateFormat } = require("../../utils/checkDateFormat");

const { isString, isNumber, isEmail } = require("../../utils/checkTheInput");
const Logger = require("bunyan");
module.exports = class Customer {
  async createCustomer({
    req,
    services,
    type,
    name,
    email,
    phone,
    companyDetails,
    billingAddress,
    shippingAddress,
    balance,
  }) {
    try {
      const { getDate, getTime, getDateMilliseconds } = await getDateCreated();
      return await customer
        .create({
          type,
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
          shippingAddress,
          balance: {
            openingBalance:
              balance.type == "out" ? balance.value : -balance.value, //Credit or out   == you pay the customer && green
            currentBalance:
              balance.type == "in" ? -balance.value : balance.value, // Debit or in == customer pay you && red
          },
        })
        .then(async (customerResponse) => {
          if (balance.value > 0)
            return await services.payment
              .createPayment({
                orgId: req.session.orgId,
                id: await generatePaymentId({
                  orgId: req.session.orgID,
                  type: balance.type,
                }),
                clientId: customerResponse._id,
                name: customerResponse.name,
                amount: balance.value,
                mode: "Cash",
                whose: "customer",
                date: req.body.date,
                type: balance.type,
              })
              .then(async (getPayResult) => {
                if (getPayResult.status == "error") return getPayResult;
                customerResponse.ledger.push({
                  id: getPayResult.id,
                  subTitle: "Balance",
                  mode: "Cash",
                  amount: balance.value,
                  closingBalance:
                    balance.type == "out" ? balance.value : -balance.value,
                })
                await customerResponse.save();
                return {
                  status: "success",
                  message: "customer created successfully",
                };
              })
              .catch((error) => {
                console.log(error);
                return { status: "error", message: "can't create payment" };
              });
          return {
            status: "success",
            message: "customer created successfully",
          };
        })
        .catch((error) => {
          console.log(error);
          return { status: "error", message: "can't create customer" };
        });
    } catch (error) {
      return { status: "error", message: "something went wrong" };
    }
  }

  getAllCustomer({ req, callBack }) {
    return customer
      .find({ orgId: req.session.orgId })
      .then((response) =>
        callBack(
          {
            status: "success",
            message: "Get All Customer Successfully",
            data: response,
          },
          false
        )
      )
      .catch((error) =>
        callBack(null, {
          status: "error",
          message: "couldn't find any customer",
        })
      );
  }
};
