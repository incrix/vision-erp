
const mongoose = require("mongoose");

const schema = mongoose.Schema({
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
      type: Number,
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

  transationDetails: {
    mode: {
      type: String,
      enum: ["Debit", "Cash", "UPI", "Credit"],
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
        value: {
          type: Number,
        },
        amount: {
          type: Number,
        },
      },
    },
  ],
  paymentTransactions: [],
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
    enum: ["pending", "completed", "cancelled", "partially"],
  },

  date: {
    type: String,
  },
  time: {
    type: String,
  },
  dateMilliseconds: {
    type: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Invoice", schema);

// const mongoose = require("mongoose");

// const schema = mongoose.Schema({
//   orgId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Org",
//     required: true,
//   },
//   invoiceId: {
//     type: String,
//     required: true,
//   },
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//     required: true,
//   },
//   customerDetails: {
//     customerName: {
//       type: String,
//       required: true,
//     },
//     cusID: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Customer",
//       required: true,
//     },
//     phone: {
//       type: Number,
//       required: true,
//     },
//     email: {
//       type: String,
//       required: true,
//     },
//     billingAddress: {
//       address1: {
//         type: String,
//       },
//       address2: {
//         type: String,
//       },
//       city: {
//         type: String,
//       },
//       state: {
//         type: String,
//       },
//       zipCode: {
//         type: String,
//       },
//     },
//     companyDetails: {
//       companyName: {
//         type: String,
//       },
//       GSTIN: {
//         type: Number,
//         maxLength: 15,
//         minLength: 15,
//       },
//     },
//   },

//   transationDetails: {
//     mode: {
//       type: String,
//       enum: ["Debit", "Cash", "UPI", "Credit"],
//     },
//   },
//   items: [
//     {
//       name: {
//         type: String,
//         required: true,
//       },
//       productId: {
//         type: String,
//       },
//       tax: {
//         cgst: {
//           type: Number,
//         },
//         sgst: {
//           type: Number,
//         },
//         igst: {
//           type: Number,
//         },
//         cessPercentage: {
//           type: Number,
//           default: 0,
//         },
//         cessValue: {
//           type: Number,
//           default: 0,
//         },
//       },
//       price: {
//         type: Number,
//         required: true,
//       },
//       quantity: {
//         type: Number,
//         required: true,
//       },
//       taxableValue: {
//         type: Number,
      
//       },

//       totalPrice: {
//         type: Number,
//         required: true,
//       },
//       discount: {
//         type: {
//           type: String,
//           enum: ["₹", "%"],
//         },
//         value: {
//           type: Number,
//         },
//         amount: {
//           type: Number,
//         },
//       },
//     },
//   ],
//   paymentTransactions: [],
//   additionalCharges: {
//     package: {
//       type: {
//         type: String,
//       },
//       value: {
//         type: Number,
//       },
//       amount: {
//         type: Number,
//       },
//     },
//     delivery: {
//       type: {
//         type: String,
//       },
//       value: {
//         type: Number,
//       },
//       amount: {
//         type: Number,
//       },
//     },
//   },
//   totalPrice: {
//     type: Number,
//     required: true,
//   },
//   paidAmount: {
//     type: Number,
//     required: true,
//   },
//   discount: {
//     type: {
//       type: String,
//       enum: ["₹", "%"],
//     },
//     value: {
//       type: Number,
//     },
//     amount: {
//       type: Number,
//     },
//   },
//   tax: {
//     type: Number,
//   },
//   status: {
//     type: String,
//     // required: true,
//     enum: ["pending", "completed", "cancelled", "partially"],
//   },

//   date: {
//     type: String,
//   },
//   time: {
//     type: String,
//   },
//   dateMilliseconds: {
//     type: Number,
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },
// });

// module.exports = mongoose.model("Invoice", schema);
