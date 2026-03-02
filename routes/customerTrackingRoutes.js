
const express = require("express");
const router = express.Router();

const { customerAuth } = require("../middleware/customerAuth");

const {
  getCustomerShipments,
  trackShipment,
} = require("../controllers/customerTrackingController");

// Last Orders
router.get("/shipments", customerAuth, getCustomerShipments);

// Track
router.get("/track/:id", trackShipment);

module.exports = router;
