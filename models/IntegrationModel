const mongoose = require("mongoose");

/* =====================================================
   🛒 STORE SCHEMA (Multi-store support)
===================================================== */
const storeSchema = new mongoose.Schema({
  type: {
    type: String,
    default: "woocommerce"
  },
  url: String,
  key: String,
  secret: String
}, { _id: false });

/* =====================================================
   🚚 COURIER SETTINGS
===================================================== */
const courierSchema = new mongoose.Schema({
  shipfast: { type: Boolean, default: true },
  delhivery: { type: Boolean, default: false },
  ekart: { type: Boolean, default: false }
}, { _id: false });

/* =====================================================
   ⚙️ AUTOMATION SETTINGS
===================================================== */
const automationSchema = new mongoose.Schema({
  autoShip: { type: Boolean, default: false },
  autoAssign: { type: Boolean, default: false }
}, { _id: false });

/* =====================================================
   📊 ANALYTICS
===================================================== */
const analyticsSchema = new mongoose.Schema({
  orders: { type: Number, default: 0 },
  shipments: { type: Number, default: 0 }
}, { _id: false });

/* =====================================================
   🔥 MAIN SCHEMA
===================================================== */
const integrationSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },

  stores: [storeSchema],

  couriers: {
    type: courierSchema,
    default: () => ({})
  },

  automation: {
    type: automationSchema,
    default: () => ({})
  },

  apiKey: {
    type: String
  },

  analytics: {
    type: analyticsSchema,
    default: () => ({})
  }

}, { timestamps: true });

module.exports = mongoose.model("Integration", integrationSchema);
