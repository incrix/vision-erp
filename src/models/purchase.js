const mongoose = require("mongoose");

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
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vendorDetails: {
      vendorName: {
        type: String,
        required: true,
      },
      venID: {
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
        enum: ["Net Banking","Cash","UPI", "EMI","Cheque"],
      },
    },
    items: [
      {
        name: {
          type: String,
          required: true,
        },
        productId: {
          type: String,
        },
        productIndex: {
          type: Number,
          required: true,
        },
        price: {
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
        _id:false
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
        amount:{
          type: Number,
        },
        _id:false
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
      },
      amount: {
        type: Number,
      },
    },
    tax: {
      type: Number,
    },
    status: {
      type: String,
      // required: true,
      enum: ["pending", "paid", "cancelled", "partially"],
    },
    date: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Purchase", schema);
