const express = require('express');
const router = express.Router();

const customerController = require('../controllers/customerController');
const authMiddleware = require('../middleware/authMiddleware');

// Get All Customers Route
router.get('/all', authMiddleware, customerController.getAllCustomers);


module.exports = router;