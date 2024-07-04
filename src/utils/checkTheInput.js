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
      if (key == "email")
        if (!validator.validate(body[key]))
          return res.status(400).json({
            status: "error",
            message: `Please enter a valid ${key} address`,
          });
      if (key == "name" || key == "phone")
        if (typeof body[key] !== "string") {
          return res.status(400).json({
            status: "error",
            message: `Please enter valid ${key}`,
          });
        }
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