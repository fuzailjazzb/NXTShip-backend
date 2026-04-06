const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/warehouseAllotmentController");
const auth = require("../middleware/authMiddleware");

router.get("/", auth, ctrl.getAllotment);
router.post("/default", auth, ctrl.saveDefaultWarehouse);
router.post("/mapping", auth, ctrl.saveStoreMapping);
router.post("/auto", auth, ctrl.saveAutoWarehouse);
router.post("/test", auth, ctrl.testWarehouse);

module.exports = router;