const express = require("express");
const router = express.Router();

const {
createWarehouse,
getWarehouses
} = require("../controllers/warehouseController");

const { customerAuth } = require('../middleware/customerAuth');

router.post("/warehouse", customerAuth, createWarehouse);

router.get("/warehouse", customerAuth, getWarehouses);

module.exports = router;