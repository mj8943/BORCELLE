const mongoose = require("mongoose");

const productModel = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    ref: "category",
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  discount: {
    type: mongoose.Schema.ObjectId,
    ref: "Offer",
  },
  discountPrice: {
    type: Number,
  },
  finalPrice: {
    type: Number,
  },
  description: {
    type: String,
    required: true,
  },
  is_listed: {
    type: Boolean,
    default: true,
  },
  image: [
    {
      type: String,
    },
  ],
  variant: {
    xs: {
      type: Number,
      default: 0,
      min: 0,
    },
    s: {
      type: Number,
      default: 0,
      min: 0,
    },
    m: {
      type: Number,
      default: 0,
      min: 0,
    },
    l: {
      type: Number,
      default: 0,
      min: 0,
    },
    xl: {
      type: Number,
      default: 0,
      min: 0,
    },
    xxl: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  reviews: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: "user",
      },
      rating: {
        type: Number,
        required: true,
      },
      date: {
        type: Date,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
    },
  ],
});

module.exports = mongoose.model("product", productModel);
