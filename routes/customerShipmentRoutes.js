const express = require("express");
const router = express.Router();

const { customerAuth } = require("../middleware/customerAuth");
const { shipmentController } = require("../controllers/customerShipmentController");

console.log("customer shipment controller:", shipmentController);
console.log("type of shipmentController:", typeof shipmentController);
console.log("getCustomerShipments function:", shipmentController.getCustomerShipments);
console.log("Type of getCustomerShipments:", typeof shipmentController.getCustomerShipments);
console.log("customerAuth middleware:", customerAuth);
console.log("Type of customerAuth middleware:", typeof customerAuth);


// Get Customer Shipments Route
router.get("/shipments", customerAuth, shipmentController.getCustomerShipments);

module.exports = router;