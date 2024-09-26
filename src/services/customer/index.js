const customer = require("../../models/customer");
const { getDateCreated } = require("../../utils/createDate");
const { generatePaymentId } = require("../../utils/generateID");

const Payment = require("../../models/payment");
const { isString, isNumber, isEmail } = require("../../utils/checkTheInput");

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
                  // id: getPayResult.id,
                  id: "",
                  subTitle: "Balance",
                  mode: "Cash",
                  amount: balance.value,
                  closingBalance:
                    balance.type == "out" ? balance.value : -balance.value,
                });
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

  async paymentInAndOut({ req, services, callBack }) {
    try {
      const { userId } = req.session;
      const { payType, transactionDetails:{type:mode}, amount, cusId } = req.body;   
      if (cusId.length > 1)
        callBack(null, {
          status: "error",
          message: "We Could not allow more than one Customer",
        });
      if (amount <= 0)
        return callBack(null, {
          status: "error",
          message: "amount must be greater than zero",
        });
      if (!userId)
        return callBack(null, {
          status: "error",
          message: "Couldn't find user ID in session",
        });
      if (!cusId)
        return callBack(null, {
          status: "error",
          message: "can't find Customer ID",
        });
      const {
        data: getCustomer,
        status,
        message,
      } = await this.getCustomer({
        req,
      });
      if (status == "error") return callBack(null, { status, message });
      const getPayResult = await new Promise((resolve, reject) => {
        (async () => {
          console.log("getPayResult");
          
          await this.createCustomerPayment({
            services,
            req,
            payType,
            mode,
            amount,
            cusId,
            reject,
            resolve,
            customer: getCustomer,
          });
        })();
      });
      if (getPayResult.status == "error")
        return callBack(null, {
          status: getPayResult.status,
          message: getPayResult.message,
        });

      return callBack(getPayResult,false);
    } catch (error) {
      return { status: "error", message: error.message };
    }
  }
  async createCustomerPayment({
    services,
    req,
    payType,
    mode,
    amount,
    cusId,
    customer,
    reject,
    resolve,
  }) {
    try {
      return await services.payment
        .createPayment({
          orgId: req.session.orgId,
          id: await generatePaymentId({
            orgId: req.session.orgID,
            type: payType,
          }),
          clientId: cusId,
          name: customer.name,
          amount,
          mode,
          whose: "customer",
          date: req.body.date,
          type: payType,
        })
        .then(async (getPayResult) => {
          if (getPayResult.status == "error")
            return reject({
              status: getPayResult.status,
              message: getPayResult.message,
            });

          customer.balance.currentBalance =
            payType == "in"
              ? customer.balance.currentBalance - amount
              : customer.balance.currentBalance + amount;
          customer.ledger.push({
            id: getPayResult.paymentId,
            subTitle: `payment ${payType}`,
            mode,
            amount,
            closingBalance: customer.balance.currentBalance,
          });
          await customer.save();
          return resolve ({
            status: "success",
            message: "Payment successfully",
          })
        })
        .catch((error) => {
          console.log(error);
          return reject({ status: "error", message: error.message })
        });
    } catch (error) {
      return reject({ status: "error", message: error.message });
    }
  }

  async getCustomer({ req }) {
    try {
      return await customer
        .findOne({ orgId: req.session.orgId, _id: req.body.cusId[0] })
        .then((response) => {
          return {
            status: "success",
            message: "Get Customer Successfully",
            data: response,
          };
        })
        .catch((error) => {
          return {
            status: "error",
            message: "couldn't find any customer",
          };
        });
    } catch (error) {
      console.log(error);
      return {
        status: "error",
        message: error.message,
      };
    }
  }

  async getAllCustomer({ req, callBack }) {
    return await customer
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
