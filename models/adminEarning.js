const mongoose = require("mongoose");
const shipment = require("./shipment");

const earningSchema = new mongoose.Schema({
    customerId: String,
    shipmentId: String,
    amount: Number,
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("AdminEarning", earningSchema);