const express = require('express');
const router = express.Router();

const {
    customerController, 
    getCustomerProfile, 
    updateCustomerProfile,
} = require('../controllers/customerController');
const authMiddleware = require('../middleware/authMiddleware');
const { customerAuth } = require('../middleware/customerAuth');

// Get All Customers Route
router.get('/all', authMiddleware, customerController.getAllCustomers);

// Get Customer Profile Route
router.get('/profile', customerAuth, getCustomerProfile);

// Update Customer Profile Route
router.put('/profile/update', customerAuth, updateCustomerProfile);


module.exports = router;