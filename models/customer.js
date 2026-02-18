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

    city: {
        type: String,
        default: "",
    },

    totalOrders: {
        type: Number,
        default: 0,
    },

    walletBalance: {
        type: Number,
        default: 0,
        
    }
    

}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);