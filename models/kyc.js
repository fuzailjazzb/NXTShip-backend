const mongoose = require("mongoose");

const kycSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    type: {
        type: String,
        enum: ["aadhaar", "pan", "gst", "bank"],
        required: true
    },

    details: {
        type: Object,
        required: true
    },

    status: {
        type: String,
        enum: ["pending", "verified", "rejected"],
        default: "pending"
    }

}, { timestamps: true });

module.exports = mongoose.model("Kyc", kycSchema);