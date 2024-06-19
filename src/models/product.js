// const mongoose = require("mongoose");

// const schema = mongoose.Schema(
//   {
// type: {
//   type: String,
//   required: true,
//   enum: ["Product", "Service"],
// },
// productId: {
//   type: String,
//   minLength: 10,
//   maxLength: 10,
//   required: true,
// },
// name: {
//   type: String,
//   required: true,
// },
// userId: {
//   type: mongoose.Schema.Types.ObjectId,
//   ref: "User",
//   required: true,
// },
// orgId: {
//   type: mongoose.Schema.Types.ObjectId,
//   ref: "Org",
//   required: true,
// },
// categoryId: {
//   type: String,
// },
// barcode: {
//   type: String,
// },
// date: {
//   type: String,
// },
// time: {
//   type: String,
// },
// dateMilliseconds: {
//   type: Number,
// },
// erpDetails: {
//   erpPrice: {
//     type: Number,
//     required: true,
//   },
//   erpTax: {
//     type: Boolean,
//   },
//   erpTaxRate: {
//     type: Number,
//   },
//   erpActive: {
//     type: Boolean,
//   },
//   unit: {
//     type: String,
//   },
//   stackQty: {
//     type: Number,
//   },
// },
//     eCommerceDetails: {
//       stackQty: {
//         type: Number,
//       },
//       ePrice: {
//         type: Number,
//         required: true,
//       },
//       unit: {
//         type: String,
//       },
//       description: {
//         type: String,
//       },
//       eTax: {
//         type: Boolean,
//       },
//       eTaxRate: {
//         type: Number,
//       },
//       eActive: {
//         type: Boolean,
//       },
//       eStore: {
//         type: Boolean,
//       },
//       eImage: [
//         {
//           url: {
//             type: String,
//           },
//           _id: false,
//         },
//       ],
//       eProductImg: {
//         type: String,
//       },
//       eProductVideo: {
//         type: String,
//       },
//       eDiscount: {
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
//       eSellingPrice: {
//         type: Number,
//       },
//     },
//     createdAt: {
//       type: Date,
//       default: Date.now,
//     },
//   },
//   { timestamps: true, versionKey: false }
// );

// module.exports = mongoose.model("Product", schema);

const mongoose = require("mongoose");
const unit = require("../utils/unit");
const schema = mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["Product", "Service"],
    },
    productId: {
      type: String,
      minLength: 10,
      maxLength: 10,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Org",
      required: true,
    },
    categoryId: {
      type: String,
    },
    barcode: {
      type: String,
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
    unitPrice: {
      type: Number,
    },
    priceWithTax: {
      type: Number,
    },
    purchasePrice: {
      type: Number,
    },
    tax: {
      rate: {
        type: Number,
        required: true,
        default: 0,
      },
      value: {
        type: Number,
        required: true,
        default: 0,
      },
    },
    stockQty: {
      type: Number,
      required: true,
      default: 1,
    },

    isSales: {
      type: Boolean,
      default: false,
    },
    unit: {
      type: String,
      enum: unit,
    },
    description: {
      type: String,
      default: "<p></p>",
    },
    withinTax: {
      type: Boolean,
    },
    discount: {
      type: {
        type: String,
        enum: ["₹", "%"],
        default: "₹",
      },
      value: {
        type: Number,
        default: 0,
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Product", schema);
