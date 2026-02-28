const express = require('express');
const router = express.Router();

const customerController = require('../controllers/customerController');
const authMiddleware = require('../middleware/authMiddleware');
const { customerAuth }  = require('../middleware/customerAuth');

console.log("customer controller:", customerController);

// Get All Customers Route
router.get('/all', authMiddleware, customerController.getAllCustomers);


// Get Customer Profile Route
router.get('/profile', customerAuth, customerController.getCustomerProfile);

// Update Customer Profile Route

console.log('Type of handler:', typeof customerController.updateCustomerProfile);
console.log('Handler value:', customerController.updateCustomerProfile);
router.put('/some-path', customerController.updateCustomerProfile); // line 18


router.put('/profile/update', customerAuth, customerController.updateCustomerProfile);
router.get("/referral", customerAuth, customerController.getReferralStats);


module.exports = router;