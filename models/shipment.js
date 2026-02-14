const mongoose = require("mongoose");

const shipmentSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },

    customerName: String,
    phone: String,

    deliveryAddress: Object,

    weight: Number,

    status: {
      type: String,
      default: "Not Booked",
    },

    awbNumber: {
      type: String,
      default: null,
    },

    courierPartner: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Shipment", shipmentSchema);