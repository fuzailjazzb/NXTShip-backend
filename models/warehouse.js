const mongoose = require("mongoose");

const warehouseSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    name:String,

    address:String,

    city:String,

    state:String,

    pincode:String,

    phone:String,

    createdAt:{
        type:Date,
        default:Date.now
    }

});

module.exports = mongoose.model("Warehouse",warehouseSchema);