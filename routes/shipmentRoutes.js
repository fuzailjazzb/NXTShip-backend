const express = require("express");
const router = express.Router();

const { bookShipment, getAllShipments, trackShipment, delhiveryTracking, checkPinSrvice, cancelShipment } = require("../controllers/shipmentController");
const authMiddleware = require("../middleware/authMiddleware");


// ✅ Create Shipment Route
router.post("/book", authMiddleware, bookShipment);

// ✅ Fetch All Shipments Route
router.get("/all", authMiddleware, getAllShipments);

// Track Shipment Route
router.get("/track/:waybill", authMiddleware, trackShipment);

// Track Shipment AWB Route
router.get("/delhivery/:waybill", authMiddleware, delhiveryTracking);

// track shipment route
router.get("/track/:awb", authMiddleware, trackShipment);

// pin availability route
router.get("/pin/:pin", authMiddleware, checkPinSrvice);

//cancel shipment route
router.post("/cancel/:id", authMiddleware, cancelShipment);

module.exports = router;