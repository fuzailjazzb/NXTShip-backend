const express = require("express");
const router = express.Router();

const authController = require("../controllers/customerAuthController");

// Signup Route
router.post("/signup", authController.signupCustomer);

// Login Route
router.post("/login", authController.loginCustomer);

module.exports = router;