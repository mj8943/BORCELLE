
const mongoose = require('mongoose');
const bannerModel = new mongoose.Schema({

name:{
    type:String,
    required:true
},
image:{
    type:String,
    required:true
},
link:{
    type:String,
    required:true
},
is_listed:{
    type:Boolean,
    default:true,
},
description:{
    type:String
}

});

module.exports = mongoose.model('banner',bannerModel);