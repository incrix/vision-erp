const mongoose = require("mongoose");

const schema = mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Org",
      required: true,
    },

    isCancelled: {
      type: Boolean,
      required: true,
      default: false,
    },
    name: {
      type: String,
      required: true,
    },
    whose: {
      type: String,
      enum: ["customer", "vendor"],
      required: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    mode: {
      type: String,
      enum:["Net Bank", "Cash", "UPI", "EMI"],
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["in", "out"],
    },
    description: {
      type: String,
    },
    id: {
      type: String,
      required: true,
    },
    documents: [
      {
        type: {
          type: String,
          enum: ["erp", "cloud"],
        },
        id: {
          type: String,
        },
        _id: false,
      },
    ],
    date: {
      type: String,
    },
    createAt: {
      type: Date,
      default: Date.now(),
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("payment", schema);
