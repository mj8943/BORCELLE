const mongoose = require("mongoose");
const wallet = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref:"user",
    required: true,
  },
  balance: {
    type: Number,
    required: true,
    default: 0,
  },
  history: [
    {
      Reason: {
        type: String,
      },
      amount: {
        type: Number,
      },
      transaction:{
        type: String,
      },
      date: {
        type: Date,
        default: Date.now(),
      },
    },
  ],
});

module.exports = mongoose.model("wallet", wallet);
