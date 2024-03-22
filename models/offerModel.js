const mongoose = require("mongoose");

const offermodel = new mongoose.Schema({

    offerName: {
        type: String,
        required: true
    },
 
    validFrom: {
        type: String,
        required: true
    },
    expiry: {
        type: String,
        required: true
    },
    discountOffer: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
    },
});

module.exports = mongoose.model("Offer", offermodel)