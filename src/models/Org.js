const mongoose = require("mongoose");

const schema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    industry: {
      type: String,
      required: true,
    },
    phone: {
      type: Number,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    GSTPin: {
      type: String,
      required: true,
    },
    addGST: {
      type: Boolean,
      default: false,
    },
    billingAddress: {
      lineOne: {
        type: String,
      },
      lineTwo: {
        type: String,
      },
      city: {
        type: String,
      },
      state: {
        type: String,
      },
      zipCode: {
        type: Number,
      },
    },
    shippingAddress: [
      {
        address: {
          lineOne: {
            type: String,
            required: true,
          },
          lineTwo: {
            type: String,
            required: true,
          },
          city: {
            type: String,
            required: true,
          },
          state: {
            type: String,
            required: true,
          },
          zipCode: {
            type: Number,
            required: true,
          },
        },
      },
    ],
    logoUrl: {
      type: String,
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Org", schema);

