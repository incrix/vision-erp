const mongoose = require("mongoose");

const schema = mongoose.Schema(
  {
    name: {
      type: String,
    },
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Org",
      required: true,
    },
    email: {
      type: String,
    },
    phone:{
      type: Number,
    },
    companyNama: {
      type: String,
    },
    type: {
      type: String,
      enum: {
        values: ["business", "individual"],
      },
    },
    companyDetails: {
      companyNama: {
        type: String,
      },
      GSTPin: {
        type: String,
        max: 15,
        min: 15,
      },
    },
    billingAddress: {
      address1: {
        type: String,
      },
      address2: {
        type: String,
      },
      city: {
        type: String,
      },
      state: {
        type: String,
      },
      zipCode: {
        type: String,
      },
    },
    shippingAddress: [
      {
        address1: {
          type: String,
        },
        address2: {
          type: String,
        },
        city: {
          type: String,
        },
        state: {
          type: String,
        },
        zipCode: {
          type: String,
        },
      },
    ],
    balance: {
      openingBalance: {
        type: Number,
      },
      currentBalance: {
        type: Number,
        default: 0,
      },
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Customer", schema);
