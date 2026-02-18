const express = require("express");
const router = express.Router();

const { getWalletBalance, addFunds } = require("../controllers/walletController");
const customerAuth = require("../middleware/customerAuth");

// Get Wallet Balance Route
router.get("/balance", customerAuth, getWalletBalance);

// Add Funds to Wallet Route
// router.post("/add-funds", customerAuth, addFunds);

module.exports = router;