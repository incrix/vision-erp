const mongoose = require("mongoose");

const schema = mongoose.Schema(
  {
    orgId: {
      type:mongoose.Schema.Types.ObjectId,
      ref:"Org",
      required:true
    },
    type:{
      type: String,
      required: true,
      enum: ["in", "out", ],
    },
    status:{
    type: String,
    // required: true,
    enum: ["approved", "pending", "rejected"],
    },
    name:{
      type: String,
      required: true,
    },
    whose:{
      type: String,
      enum:["customer","vendor"],
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
      enum: ["cash", "card", "debit", "upi"],
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
    documents: [
      {
        type: {
          type: String,
          enum: ["erp", "cloud"],
        },
        id: {
          type: String,
        },
        _id:false
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
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("payment", schema);
