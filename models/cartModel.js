const mongoose = require('mongoose');
const cartModel = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user',
    },
    items:[{
        productId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'product',
        },
        quantity:{
            type:Number,
            default:1,
        },
        variant:{
            type:String,
        },
    }]
});

module.exports = mongoose.model('cart',cartModel);