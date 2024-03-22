const mongoose = require("mongoose");

const couponModel = new mongoose.Schema({
  couponCode: {
    type: String,
    required: true,
  },
  discountAmount: {
    type: Number,
    required: true,
  },
  minimumSpend: {
    type: Number,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
});

module.exports = mongoose.model("coupon",couponModel);