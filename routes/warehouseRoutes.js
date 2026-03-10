const express = require("express");
const router = express.Router();

const {
createWarehouse,
getWarehouses
} = require("../controllers/warehouseController");

const authMiddleware = require("../middleware/authMiddleware");

router.post("/warehouse", authMiddleware, createWarehouse);

router.get("/warehouse", authMiddleware, getWarehouses);

module.exports = router;