const mongoose = require("mongoose");
const unit = require("../utils/unit");
const schema = mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Org",
      required: true,
    },
    id: {
      type: String,
      required: true,
      // unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    customerDetails: {
      customerName: {
        type: String,
        required: true,
      },
      cusID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
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
      companyDetails: {
        companyName: {
          type: String,
        },
        GSTIN: {
          type: Number,
          maxLength: 15,
          minLength: 15,
        },
      },
    },

    transactionDetails: {
      mode: {
        type: String,
        enum: ["Net Banking", "Cash", "UPI", "EMI", "Cheque"],
      },
      notes:{
        type: String,
      }
    },
    items: [
      {
        _id:false,
        name: {
          type: String,
          required: true,
        },
        productId: {
          type: String,
        },
        unit:{
          type: String,
          enum: unit
        },
        productIndex: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        unitPrice:{
          type: Number,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        totalPrice: {
          type: Number,
          required: true,
        },
        discount: {
          type: {
            type: String,
            enum: ["₹", "%"],
          },
          percentage: {
            type: Number,
          },
          amount: {
            type: Number,
          },
        },
        tax: {
          cgst: {
            percentage: {
              type: Number,
              default: 0,
            },
            amount: {
              type: Number,
              default: 0,
            },
          },
          sgst: {
            percentage: {
              type: Number,
              default: 0,
            },
            amount: {
              type: Number,
              default: 0,
            },
          },
          igst: {
            percentage: {
              type: Number,
              default: 0,
            },
            amount: {
              type: Number,
              default: 0,
            },
          },
          cess: {
            percentage: {
              type: Number,
              default: 0,
            },
            amount: {
              type: Number,
              default: 0,
            },
          },
        },
      },
    ],
    paymentTransactions: [
      {
        type: {
          type: String,
          enum: ["payment", "balance"],
        },
        id: {
          type: String,
        },
        amount: {
          type: Number,
        },
        _id: false,
      },
    ],
    additionalCharges: {
      package: {
        type: {
          type: String,
        },
        value: {
          type: Number,
        },
        amount: {
          type: Number,
        },
      },
      delivery: {
        type: {
          type: String,
        },
        value: {
          type: Number,
        },
        amount: {
          type: Number,
        },
      },
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    paidAmount: {
      type: Number,
      required: true,
    },
    discount: {
      type: {
        type: String,
        enum: ["₹", "%"],
      },
      value: {
        type: Number,
        default:0,
      },
      amount: {
        type: Number,
        default:0,
      },
    },
    tax: {
      igst: {
        type: Number,
        default:0,
      },
      cgst: {
        type: Number,
        default:0,
      },
      sgst: {
        type: Number,
        default:0,
      },
    },
    status: {
      type: String,
      // required: true,
      enum: ["pending", "paid", "cancelled", "partially"],
    },

    date: {
      type: String,
    },
    dueDate: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Invoice", schema);
