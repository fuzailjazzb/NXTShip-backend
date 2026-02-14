const express = require("express");
const router = express.Router();

const {
  createShipment,
  trackShipment,
} = require("../controllers/shipmentController");

// ✅ Middleware Import
const { protectAdmin } = require("../middleware/authMiddleware");

// ✅ Create Shipment + Save + API Booking
router.post("/create", createShipment);


// ✅ Track Shipment
router.post("/track", trackShipment);

// Track all shipments (for testing)


// track by orderId


module.exports = router;