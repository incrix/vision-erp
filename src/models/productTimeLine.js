const mongoose = require("mongoose");
const unit = require("../utils/unit");

const schema = mongoose.Schema({
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Org",
    required: true,
  },
  productList: [
    {
      _id: false,
      isCancelled: {
        type: Boolean,
        default: false,
      },
      name: {
        type: String,
        required: true,
      },
      productId:{
        type:String,
      },
      description: {
        type: String,
        default:"",
      },
      date: {
        type: String,
      },
      stockIn: {
        type: Number,
        default: 0,
      },
      stockOut: {
        type: Number,
        default: 0,
      },
      unit:{
        type: String,
        enum:unit
      },
      billingDetails:{
        unitPrice:{
          type: Number,
        },
        price:{
          type: Number,
        },
        totalPrice:{
          type: Number,
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
      },
      source: {
        type: String,
        required: true,
        default: "manual",
      },
      user: {
        id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
      },
      category: {
        type: String,
        default:"",
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
},
{ timestamps: true, versionKey: false });



module.exports = mongoose.model("productTimeline", schema);
