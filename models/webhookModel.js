const mongoose = require("mongoose");

const webhookSchema = new mongoose.Schema({
  userId: String,

  settings: {
    orderCreated: { type: Boolean, default: true },
    orderUpdated: Boolean,
    orderCancelled: Boolean,
    paymentSuccess: Boolean
  },

  actions: {
    autoShip: { type: Boolean, default: true },
    autoAssign: { type: Boolean, default: true }
  },

  logs: [
    {
      event: String,
      status: String,
      message: String,
      createdAt: { type: Date, default: Date.now }
    }
  ]
});

module.exports = mongoose.model("Webhook", webhookSchema);