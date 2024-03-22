const mongoose = require("mongoose");
const userModel = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  mobile: {
    type: String,
    required: true,
  },
  is_blocked: {
    type: Boolean,
    default: false,
  },
  is_admin: {
    type: Number,
    default: 0,
  },
  referralCode: {
    type: String,
  },
  address: [
    {
      id: {
        type: String,
      },
      fullname: {
        type: String,
        required: true,
      },
      mobile: {
        type: String,
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
  ],
});

module.exports = mongoose.model("user", userModel);
