const express = require("express");
const router = express.Router();
const book = require("../controllers/customerBookingController");
const customerAuth = require("../middleware/customerAuth");

// 🔐 Customer Create Shipment
router.post("/create", customerAuth, book.bookCustomerShipment);

module.exports = router;