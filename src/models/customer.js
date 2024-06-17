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
    type: {
      type: String,
      enum: {
        values: ["Business", "Individual"],
      },
    },
    companyDetails: {
      companyName: {
        type: String,
      },
      GSTIN: {
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
        _id:false,
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
    timestamps: {
      date: {
        type: String,
      },
      time: {
        type: String,
      },
      dateMilliseconds: {
        type: Number,
      },
    },
    balance:{
      borrow:{
        type:Number,
        default:0
      },
      gave:{
        type:Number,
        default:0
      }
    }

  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Customer", schema);
