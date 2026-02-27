

const express = require("express");
const router = express.Router();

const { bookCustomerShipment } = require("../controllers/customerBookingController");
const customerAuth = require("../middleware/customerAuth");

// 🔐 Customer Create Shipment
router.post("/create", customerAuth, bookCustomerShipment);

console.log(typeof bookCustomerShipment);

module.exports = router;