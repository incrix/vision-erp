const vendor = require("../../models/vendor");
module.exports = class Vendor {
  async createVendor(body, req) {
    const {
      name,
      email,
      phone,
      companyDetails,
      billingAddress,
      shippingAddress,
      balance,
    } = body;
    return await vendor
      .create({
        name,
        orgId: req.session.orgId,
        email,
        phone,
        companyDetails,
        billingAddress,
        shippingAddress,
        balance,
      })
      .then((vendorResponse) => {
        return { status: "success", message: "create vendor successfully" };
      })
      .catch((error) => {
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
            message: "get vendor successfully",
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
