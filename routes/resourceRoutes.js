const express = require('express');
const router = express.Router();

const {
    generateInvoicePDF,
    generateShippingLabelPDF,
    exportShipmentCSV
} = require('../controllers/resourceController');

const { customerAuth } = require('../middleware/customerAuth');

// Generate Invoice PDF Route
router.get('/invoice/:shipmentId', customerAuth, generateInvoicePDF);
// Generate Shipping Label PDF Route
router.get('/shipping-label/:shipmentId', customerAuth, generateShippingLabelPDF);
// Export Shipment as CSV Route
router.get('/export/:shipmentId', customerAuth, exportShipmentCSV);

module.exports = router;