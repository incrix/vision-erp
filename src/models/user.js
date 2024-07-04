const mongoose = require("mongoose");

const schema = mongoose.Schema(
  {
    name: {
      type: String,
      
    },
    email: {
      type: String,
    },
    phone: {
      type: String,
    },
    OTP: {
      code: {
        type: String,
         required: true,
        max: 5,
        min: 5,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
    avatar: {
      type: String,
    },
    gender: {
      type: String,
    },
    orgList: [
      {
        orgID: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Org",
         // required: true,
        },
      },
    ],
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("User", schema);
