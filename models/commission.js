const mongoose = require("mongoose");

const commissionSchema = new mongoose.Schema({
    flatCommission: {
        type: Number,
        default: 10
    },

    percentageCommission: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model("Commission", commissionSchema);