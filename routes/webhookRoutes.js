const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/webhookController");

router.post("/order", ctrl.handleWebhook);

module.exports = router;