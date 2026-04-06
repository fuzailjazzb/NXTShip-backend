const mongoose = require("mongoose");

const returnQcSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  shipmentId: String,
  awb: String,

  product: {
    name: String
  },

  returnReason: String,

  qc: {
    condition: String,
    packaging: String,
    remarks: String,
    images: [String]
  },

  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  }

}, { timestamps: true });

module.exports = mongoose.model("ReturnQc", returnQcSchema);