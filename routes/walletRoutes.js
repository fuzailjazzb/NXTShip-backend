const express = require("express");
const router = express.Router();

const { getWalletBalance, createRazorpayOrder, getWalletTransactions, verifyPaymentAndAddFunds } = require("../controllers/walletController");
const { customerAuth } = require("../middleware/customerAuth");


// Get Wallet Balance Route
router.get("/balance", customerAuth, getWalletBalance);


// Get Wallet Transactions Route
router.get("/transactions", customerAuth, getWalletTransactions);

// Add Funds to Wallet Route
router.post("/create-order", customerAuth, createRazorpayOrder);

// verify orders funds
router.post("/verify-payment", customerAuth, verifyPaymentAndAddFunds);


module.exports = router;