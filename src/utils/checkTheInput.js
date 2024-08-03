const validator = require("email-validator");
const { isValidDateFormat } = require("./checkDateFormat");

exports.checkTheInput = (req, res, next) => {
  try {
    const { body } = req;
    for (const key in body) {
      if (body[key] === "") {
        return res.status(400).json({
          status: "error",
          message: `Please fill in the ${key} field`,
        });
      }
      if (key == "date")
        if (isValidDateFormat(body[key], "DD-MM-YYYY") == false)
          return res
            .status(400)
            .json({ status: "error", message: "Invalid date format" });
      // id
      if (key == "id")
        if (typeof body[key] !== "string") {
          return res.status(400).json({
            status: "error",
            message: `Please enter valid ${key}`,
          });
        }
      if (key == "totalPrice")
        if (typeof body[key] !== "number") {
          return res.status(400).json({
            status: "error",
            message: `Please enter valid ${key}`,
          });
        }
      // paidAmount
      if (key == "paidAmount")
        if (typeof body[key] !== "number") {
          return res.status(400).json({
            status: "error",
            message: `Please enter valid ${key}`,
          });
        }
      // type
      if (key == "type")
        if (typeof body[key] !== "string") {
          return res.status(400).json({
            status: "error",
            message: `Please enter valid ${key}`,
          });
        }
      // amount
      if (key == "amount")
        if (typeof body[key] !== "number") {
          return res.status(400).json({
            status: "error",
            message: `Please enter valid ${key}`,
          });
        }
      // email
      if (key == "email")
        if (!validator.validate(body[key]))
          return res.status(400).json({
            status: "error",
            message: `Please enter a valid ${key} address`,
          });
      // Name or Phone
      if (key == "name" || key == "phone")
        if (typeof body[key] !== "string") {
          return res.status(400).json({
            status: "error",
            message: `Please enter valid ${key}`,
          });
        }
      // discount
      if (key == "discount") {
        if (typeof body[key].type !== "string")
          return res.status(400).json({
            status: "error",
            message: `Please enter valid type`,
          });
        if (typeof body[key].value !== "number")
          return res.status(400).json({
            status: "error",
            message: `Please enter valid value`,
          });
      }
      // delivery
      if (key == "delivery") {
        if (typeof body[key].type !== "string")
          return res.status(400).json({
            status: "error",
            message: `Please enter valid type`,
          });
        if (typeof body[key].value !== "number")
          return res.status(400).json({
            status: "error",
            message: `Please enter valid value`,
          });
      }
      // transactionDetails
      if (key == "transactionDetails") {
        if (body[key].type !== undefined) {
          if (typeof body[key].type !== "string")
            return res.status(400).json({
              status: "error",
              message: `Please enter valid payment mode`,
            });
          if (body[key].type == "" || !process.env.PAYMENT_TYPE.includes(body[key].type))
            return res.status(400).json({
              status: "error",
              message: `Please enter valid payment mode`,
            });
        }

        if (body[key].totalPrice !== undefined)
          if (typeof body[key].totalPrice !== "number")
            return res.status(400).json({
              status: "error",
              message: `Please enter valid totalPrice`,
            });
      }
      if(key == "items"){
        if(!Array.isArray(body[key]) || body[key].length == 0){         
          return res.status(400).json({
            status: "error",
            message: "Please add a product ",
          });
        }
      } 
      
      if(key == "cusId"){
        if(!Array.isArray(body[key]) || body[key].length == 0){         
          return res.status(400).json({
            status: "error",
            message: "Please add a Customer ",
          });
        }
      } 
      if(key == "venId"){
        if(!Array.isArray(body[key]) || body[key].length == 0){         
          return res.status(400).json({
            status: "error",
            message: "Please add a Vendor ",
          });
        }
      } 
      // additionalCharges
      if (key == "additionalCharges") {
        if (body[key].package) {
          if (typeof body[key].package.type !== "string")
            return res.status(400).json({
              status: "error",
              message: `Please enter valid type`,
            });
          if (typeof body[key].package.value !== "number")
            return res.status(400).json({
              status: "error",
              message: `Please enter valid value`,
            });
        }
        if (body[key].delivery) {
          if (typeof body[key].delivery.type !== "string")
            return res.status(400).json({
              status: "error",
              message: `Please enter valid type`,
            });
          if (typeof body[key].delivery.value !== "number")
            return res.status(400).json({
              status: "error",
              message: `Please enter valid value`,
            });
        }
      }

      // company details
      if (key == "companyDetails") {
        if (typeof body[key].companyName !== "string")
          return res.status(400).json({
            status: "error",
            message: "Company name should be a text",
          });
        if (typeof body[key].GSTIN !== "string")
          return res.status(400).json({
            status: "error",
            message: "Company GSTIN should be a text",
          });
      }
      
      // balance
      if (key == "balance") {
        if (
          typeof body[key].value !== "number" &&
          body[key].value !== undefined
        )
          return res.status(400).json({
            status: "error",
            message: `Balance Value should be a number`,
          });
        if (typeof body[key].type !== "string" && body[key].type !== undefined)
          return res.status(400).json({
            status: "error",
            message: `Type should be a text`,
          });
      }
      // billing Address
      if (key == "billingAddress") {
        if (
          typeof body[key].address1 !== "string" &&
          body[key].address1 !== undefined
        )
          return res.status(400).json({
            status: "error",
            message: "Address 1 should be a text",
          });
        if (
          typeof body[key].address2 !== "string" &&
          body[key].address2 !== undefined
        )
          return res.status(400).json({
            status: "error",
            message: "Address 2 should be a text",
          });
        if (
          typeof body[key].zipCode !== "string" &&
          body[key].zipCode !== undefined
        )
          return res.status(400).json({
            status: "error",
            message: `zipCode should be a text`,
          });
        if (typeof body[key].city !== "string" && body[key].city !== undefined)
          return res.status(400).json({
            status: "error",
            message: `city should be a text`,
          });
        if (
          typeof body[key].state !== "string" &&
          body[key].state !== undefined
        )
          return res.status(400).json({
            status: "error",
            message: `city should be a text`,
          });
      }
    
      // shipping Address
      if (key == "shippingAddress") {
        for (var i = 0; i < body[key].length; i++) {
          {
            if (
              typeof body[key][i].address1 !== "string" &&
              body[key][i].address1 !== undefined
            )
              return res.status(400).json({
                status: "error",
                message: "Shipping Address 1 should be a text",
              });
            if (
              typeof body[key][i].address2 !== "string" &&
              body[key][i].address2 !== undefined
            )
              return res.status(400).json({
                status: "error",
                message: "Address 2 should be a text",
              });
            if (
              typeof body[key][i].zipCode !== "string" &&
              body[key][i].zipCode !== undefined
            )
              return res.status(400).json({
                status: "error",
                message: `zipCode should be a text`,
              });
            if (
              typeof body[key][i].city !== "string" &&
              body[key][i].city !== undefined
            )
              return res.status(400).json({
                status: "error",
                message: `city should be a text`,
              });
            if (
              typeof body[key][i].state !== "string" &&
              body[key][i].state !== undefined
            )
              return res.status(400).json({
                status: "error",
                message: `city should be a text`,
              });
          }
        }
      }
    }
    next();
  } catch (error) {
    return { status: "error", message: error.message };
  }
};
