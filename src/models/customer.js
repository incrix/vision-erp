const mongoose = require("mongoose");

const schema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Org",
      required: true,
    },
    email: {
      type: String,
    },
    phone: {
      type: String,
      required: true,
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
        _id: false,
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
        amountRemaining: {
          type: Number,
          default:  function () {
            if(this.subTitle == "invoice") return 0 
            return this.amount;
          },
        },
        documents: [
          {
            _id: false,
            id: {
              type: String,
            },
            amount: {
              type: Number,           
            },
            payAmount: {
              type: String,
            },
            
          },
        ],
        status: {
          type: String,
          enum: ["pending", "partially", "paid","cancelled"],
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

module.exports = mongoose.model("Customer", schema);
