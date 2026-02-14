const mongoose = require("mongoose");

const shipmentSchema = new mongoose.Schema({
  customerName: String,
  phone: String,
  address: String,
  pincode: String,
  city: String,
  state: String,

  orderId: String,
  paymentMode: String,

  waybill: String,
  status: {
    type: String,
    default: "Booked"
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports =
  mongoose.models.Shipment || mongoose.model("Shipment", shipmentSchema);