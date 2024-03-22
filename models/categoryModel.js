const mongoose = require('mongoose');
const categoryModel = new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        required:true,
    },
    discount: {
      type: mongoose.Schema.ObjectId,
      ref: "Offer",
    },
    is_listed:{
        type:Boolean,
        default:true
    }
});

module.exports = mongoose.model('category',categoryModel);