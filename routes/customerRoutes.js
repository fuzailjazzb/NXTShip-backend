const express = require('express');
const router = express.Router();

const customerController = require('../controllers/customerController');
const authMiddleware = require('../middleware/authMiddleware');
const  customerAuth  = require('../middleware/customerAuth');

console.log("customer controller:", customerController);

// Get All Customers Route
router.get('/all', authMiddleware, customerController.getAllCustomers);


// Get Customer Profile Route
router.get('/profile', customerController.getCustomerProfile);

// Update Customer Profile Route
router.put('/profile/update', customerAuth, customerController.updateCustomerProfile);


module.exports = router;