const express = require("express");
const router = express.Router();

const {
createWarehouse,
getWarehouses,
deleteWarehouse,
updateWarehouse,
setDefaultWarehouse
} = require("../controllers/warehouseController");

const authMiddleware = require("../middleware/authMiddleware");


// to create
router.post("/warehouse", authMiddleware, createWarehouse);

// to fetch all warehouse
router.get("/warehouse", authMiddleware, getWarehouses);

// to delete 
router.delete("/warehouse/:id", authMiddleware, deleteWarehouse);

// to update
router.put("/warehouse/:id", authMiddleware, updateWarehouse);

// to set default
router.delete("/warehouse/default/:id", authMiddleware, setDefaultWarehouse);


module.exports = router;