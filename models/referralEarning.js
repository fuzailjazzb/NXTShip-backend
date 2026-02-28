const mongoose = require("mongoose");
const shipment = require("./shipment");

const referralSchema = new mongoose.Schema({
    referredId: String,
    customerId: String,
    shipmentId: String,
    earning: Number,
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("ReferalEarning", referralSchema);