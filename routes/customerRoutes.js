const express = require('express');
const router = express.Router();

const getAllCustomers = require('../controllers/customerController');
const authMiddleware = require('../middleware/authMiddleware');

// Get All Customers Route
router.get('/all', authMiddleware, getAllCustomers.createCustomerFromShipment);


module.exports = router;