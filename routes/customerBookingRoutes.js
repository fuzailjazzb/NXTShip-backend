const express = require("express");
const router = express.Router();

const courierEngineController = require("../controllers/courierEngineController");
const { customerAuth } = require("../middleware/customerAuth");

console.log(typeof bookCustomerShipment);

// 🔐 Customer Create Shipment
router.post("/book",
    (req, res, next) => {
        console.log("Shipment Route Hit.....");
        next();
    },customerAuth, courierEngineController.bookShipment);



module.exports = router;