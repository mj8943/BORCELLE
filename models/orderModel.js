const mongoose = require("mongoose");
const orderModel = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: "user",
  }, //
  items: [
    {
      productId: {
        type: mongoose.Schema.ObjectId,
        ref: "product",
      },
      quantity: {
        type: Number,
        default: 1,
      },
      price: {
        type: Number,
      },
      variant: {
        type: String,
      },
      orderStatus: {
        type: String,
        default: "Pending",
      },
    },
  ],
  userAddress: {
    fullname: {
      type: String,
      required: true,
    },
    mobile: {
      type: Number,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    house_no: {
      type: String,
      required: true,
    },
    pincode: {
      type: Number,
      required: true,
    },
    area: {
      type: String,
      required: true,
    },
  },

  payment: {
    type: String,
    required: true,
  },
  orderedDate: {
    type: Date,
    required: true,
  },
  expectedDate: {
    type: Date,
    required: true,
  },
  total: {
    type: Number,
  },
  coupon:{
    type:Number
  }
});
module.exports = mongoose.model("order", orderModel);
