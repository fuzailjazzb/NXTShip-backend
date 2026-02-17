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

    city: {
        type: String,
        required: true,
    },

    totalOrders: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);