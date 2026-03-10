const mongoose = require("mongoose");

const warehouseSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Customer",
        required:true
    },

    name:String,

    address:String,

    city:String,

    state:String,

    pincode:String,

    phone:String,

    isDefault:{
        type:Boolean,
        default:false
    },

    createdAt:{
        type:Date,
        default:Date.now
    }

});

module.exports = mongoose.model("Warehouse",warehouseSchema);