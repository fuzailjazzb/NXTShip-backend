const express = require("express");
const router = express.Router();

const { bookShipment, getAllShipments, trackShipment, cancelShipment } = require("../controllers/shipmentController");
const authMiddleware = require("../middleware/authMiddleware");

// ✅ Create Shipment Route
router.post("/book", authMiddleware, bookShipment);

// ✅ Fetch All Shipments Route
router.get("/all", authMiddleware, getAllShipments);

// Track Shipment Route
router.get("/track/:waybill", authMiddleware, trackShipment);

//cancel shipment route
router.post("/cancel/:waybill", authMiddleware, cancelShipment);
router.post("/cancel/:id", authMiddleware, cancelShipment);

module.exports = router;