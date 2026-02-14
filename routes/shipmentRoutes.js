const express = require("express");
const router = express.Router();

const { bookShipment } = require("../controllers/shipmentController");
const authMiddleware = require("../middleware/authMiddleware");

// ✅ Protected Booking Route
router.post("/book", authMiddleware, bookShipment);

module.exports = router;