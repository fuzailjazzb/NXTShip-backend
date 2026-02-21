const express = require('express');
const router = express.Router();

const { calculateDelhiveryRate } = require('../controllers/rateControllers');
const { customerAuth } = require('../middleware/customerAuth');

// Rate Calculation Route
router.post("/calculate-rate", customerAuth, calculateDelhiveryRate);

module.exports = router;