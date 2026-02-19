const express = require("express");
const router = express.Router();

const { getWalletBalance, addFunds, getWalletTransactions } = require("../controllers/walletController");
const { customerAuth } = require("../middleware/customerAuth");


// Get Wallet Balance Route
router.get("/balance", customerAuth, getWalletBalance);


// Get Wallet Transactions Route
router.get("/transactions", customerAuth, getWalletTransactions);

// Add Funds to Wallet Route
router.post("/add-funds", customerAuth, addFunds);


module.exports = router;