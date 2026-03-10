const express = require("express");
const router = express.Router();

const {
createWarehouse,
getWarehouses
} = require("../controllers/warehouseController");

router.post("/warehouse",createWarehouse);

router.get("/warehouse",getWarehouses);

module.exports = router;