
const express = require("express");
const router = express.Router();

const { customerAuth } = require("../middleware/customerAuth");

const {
  getCustomerShipments

} = require("../controllers/customerTrackingController");

const { trackShipment } = require("../controllers/courierEngineController");

// Last Orders
router.get("/shipments", customerAuth, getCustomerShipments);

// Track
router.get("/track/:id", customerAuth, trackShipment);

module.exports = router;
