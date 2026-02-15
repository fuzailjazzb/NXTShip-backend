const mongoose = require("mongoose");

const shipmentSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },

    paymentMode: {
      type: String,
      default: "Prepaid",
    },

    pickup: {
      name: String,
      phone: String,
      address: String,
      city: String,
      state: String,
      pincode: String,
    },

    delivery: {
      customerName: String,
      phone: String,
      address: String,
      city: String,
      state: String,
      pincode: String,
    },

    product: {
      productName: String,
      quantity: Number,
      orderValue: Number,
      weight: Number,
    },

    seller: {
      sellerName: String,
      gst: String,
    },

    waybill: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      default: "Pending",
    },

  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Shipment || mongoose.model("Shipment", shipmentSchema);