const express = require("express");
const router = express.Router();

const { bookCustomerShipment } = require("../controllers/customerBookingController");
const { customerAuth } = require("../middleware/customerAuth");

console.log(typeof bookCustomerShipment);

// 🔐 Customer Create Shipment
router.post("/book",
    (req, res, next) => {
        console.log("Shipment Route Hit.....");
        next();
    },customerAuth, bookCustomerShipment);



module.exports = router;