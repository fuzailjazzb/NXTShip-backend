const express = require("express");
const router = express.Router();

const {
    getCommission,
    updateCommission
} = require("../controllers/commissionController");

router.get("/", getCommission);
router.post("/update", updateCommission);

module.exports = router;