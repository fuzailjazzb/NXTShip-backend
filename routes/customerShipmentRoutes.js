const express = require("express");
const router = express.Router();

const customerAuth = require("../middleware/customerAuth");
const shipmentController = require("../controllers/customerShipmentController");

// Get Customer Shipments Route
router.get("/shipments", customerAuth, shipmentController.getCustomerShipments);

module.exports = router;