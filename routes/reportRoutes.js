const express = require("express");
const router = express.Router();

const { getCustomerReports } = require("../controllers/reportController");
const { customerAuth } = require("../middleware/customerAuth");

// Get Customer Reports Route
router.get("/reports", customerAuth, getCustomerReports);

module.exports = router;