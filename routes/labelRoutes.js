const express = require("express");
const router = express.Router();

const { generateLabel } = require("../controllers/courierEngineController");

router.get("/courier/label/:awb", generateLabel);

module.exports = router;