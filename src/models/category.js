const mongoose = require('mongoose')

const schema = mongoose.Schema(
    {
        userId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        catList:[
            {
                _id : false,
                name:{
                    type: String,
                    required: true
                },
                catId:{
                  type:String,
                  required: true
                },
                // parentId:{
                //     type:String
                // },
                // parent:{
                //     type:Boolean
                // },
                online:{
                    type: Boolean,
                    default: false
                },
                catImageUrl:{
                    type: String,
                },
            }
        ]
    },
    { timestamps: true, versionKey: false }
)

module.exports = mongoose.model('Category', schema)