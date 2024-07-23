const mongoose = require("mongoose");

const schema = mongoose.Schema(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
    },
    phone: {
      type: String,
    },
    orgId:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Org"
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
    ledger: [
      {
        _id: false,
        isCancelled: {
          type: Boolean,
          default: false,
        },
        id: {
          type: String,
        },
        createAt: {
          type: Date,
          default: Date.now(),
        },
        subTitle: {
          type: String,
        },
        mode: {
          type: String,
          enum: ["Net Bank", "Cash", "UPI", "EMI"],
        },
        amount: {
          type: Number,
        },
        status: {
          type: String,
          enum: ["pending", "partially", "paid"],
        },
        closingBalance: {
          type: Number,
        },
      },
    ],
    //Credit  == you pay the customer
    // Debit == customer pay you
    balance: {
      openingBalance: {
        type: Number,
        default: 0,
      },
      currentBalance: {
        type: Number,
        default: 0,
      },
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("vendor", schema);