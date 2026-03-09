const express = require("express");
const router = express.Router();

const courierEngineController = require("../controllers/courierEngineController");
const { bookShipment, getAllShipments, trackShipment, delhiveryTracking, checkPinSrvice, cancelShipment } = require("../controllers/shipmentController");
const authMiddleware = require("../middleware/authMiddleware");


// ✅ Create Shipment Route
router.post("/book", authMiddleware, courierEngineController.bookShipment);

// ✅ Fetch All Shipments Route
router.get("/all", authMiddleware, getAllShipments);

// Recommended Route
router.get("/courier/recommendation", authMiddleware, courierEngineController.getCourierRecommendations)

// Track Shipment Route
router.get("/track/:waybill", authMiddleware, trackShipment);

// Track Shipment AWB Route
router.get("/delhivery/:waybill", authMiddleware, delhiveryTracking);

// track shipment route
router.get("/track/:awb", authMiddleware, trackShipment);

// pin availability route
router.get("/pin/:pincode", checkPinSrvice);

//cancel shipment route
router.post("/cancel/:id", authMiddleware, cancelShipment);

module.exports = router;