const mongoose = require("mongoose");

const schema = mongoose.Schema(
  {
  orgId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Org",
    required: true,
  },
  type:{
    type: String,
    enum: ["product","payment"],
    required: true,
  },
  productList:[
    {
        _id: false,
        productId:{
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        status:{
          type: String,
        },
        
        date:{
          type: Date,
        },
        description:{
          type: String,
        },
      
    }
  ]
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("timeLine", schema);
