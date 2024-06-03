// const mongoose = require("mongoose");

// const schema = mongoose.Schema(
//   {
//     type: {
//       type: String,
//       required: true,
//       enum: ["Product", "Service"],
//     },
//     productId: {
//       type: String,
//       minLength: 10,
//       maxLength: 10,
//       required: true,
//     },
//     name: {
//       type: String,
//       required: true,
//     },
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     orgId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Org",
//       required: true,
//     },
//     categoryId: {
//       type: String,
//     },
//     barcode: {
//       type: String,
//     },
//     stackQty: {
//       type: Number,
//     },
//     erpPrice: {
//       type: Number,
//     },
//     ePrice: {
//       type: Number,
//     },
//     unit: {
//       type: String,
//     },
//     description: {
//       type: String,
//     },
//     erpTax: {
//       type: Boolean,
//     },
//     erpTaxRate: {
//       type: Number,
//     },
//     eTax: {
//       type: Boolean,
//     },
//     eTaxRate: {
//       type: Number,
//     },
//     erpActive: {
//       type: Boolean,
//     },
//     eActive: {
//       type: Boolean,
//     },
//     eDiscount: {
//       type: {
//         type: String,
//         enum: ["amount", "persentage"],
//       },
//       value: {
//         type: Number,
//       },
//     },
//     eSellingPrice: {
//       type: Number,
//     },
//     eStore: {
//       type: Boolean,
//     },
//     eImage: [
//       {
//         url: {
//           type: String,
//         },
//         _id: false,
//       },
//     ],
//     eProductImg: {
//       type: String,
//     },
//     eProductVideo: {
//       type: String,
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
    erpDetails: {
      erpPrice: {
        type: Number,
        required: true,
      },
      erpTax: {
        type: Boolean,
      },
      erpTaxRate: {
        type: Number,
      },
      erpActive: {
        type: Boolean,
      },
      unit: {
        type: String,
      },
      stackQty: {
        type: Number,
      },
    },
    eCommerceDetails: {
      stackQty: {
        type: Number,
      },
      ePrice: {
        type: Number,
        required: true,
      },
      unit: {
        type: String,
      },
      description: {
        type: String,
      },
      eTax: {
        type: Boolean,
      },
      eTaxRate: {
        type: Number,
      },
      eActive: {
        type: Boolean,
      },
      eStore: {
        type: Boolean,
      },
      eImage: [
        {
          url: {
            type: String,
          },
          _id: false,
        },
      ],
      eProductImg: {
        type: String,
      },
      eProductVideo: {
        type: String,
      },
      eDiscount: {
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
      eSellingPrice: {
        type: Number,
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
