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

    password: {
        type: String,
        required: true,
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