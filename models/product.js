const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  name: { type: String, required: true },
  sku: { type: String, required: true },

  price: { type: Number, default: 0 },
  weight: { type: Number, required: true },

  dimensions: {
    length: Number,
    breadth: Number,
    height: Number
  },

  category: String,
  description: String

}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);
