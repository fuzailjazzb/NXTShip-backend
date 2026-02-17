const express = require('express');
const router = express.Router();

const { getAllCustomers } = require('../controllers/customerController');

router.get('/all', getAllCustomers);

module.exports = router;