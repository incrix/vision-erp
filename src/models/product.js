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
    category: {
      name: {
        type: String,
      },
      catId: {
        type: String,
      },
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
