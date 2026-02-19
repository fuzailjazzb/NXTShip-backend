const express = require("express");
const router = express.Router();

const customerAuth = require("../middleware/customerAuth");
const shipmentController = require("../controllers/customerShipmentController");

console.log("customer shipment controller:", shipmentController);

// Get Customer Shipments Route
router.get("/shipments", shipmentController.getCustomerShipments);

module.exports = router;