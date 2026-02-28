const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },

    phone: {
        type: String,
        required: true,
        unique: true,
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

    totalOrders: {
        type: Number,
        default: 0,
    },

    walletBalance: {
        type: Number,
        default: 0,

    },

    address: {
        type: String,
        default: "",
    },

    landmark: {
        type: String,
        default: "",
    },

    city: {
        type: String,
        default: "",
    },

    state: {
        type: String,
        default: "",
    },

    pincode: {
        type: String,
        required: true,
    },

    referralCode: {
        type: String,
        unique: true
    },

    referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        default: null
    },

    referralEarnings: {
        type: Number,
        default: 0
    },



    walletTransactions: [
        {
            amount: Number,
            type: {
                type: String,
                default: "credit", // or "debit"
            },
            message: String,
            date: {
                type: Date,
                default: Date.now,
            },
        },
    ],





}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);