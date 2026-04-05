const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/integrationController");
const auth = require("../middleware/authMiddleware");

router.post("/store", auth, ctrl.connectStore);
router.get("/sync", auth, ctrl.syncOrders);
router.post("/courier", auth, ctrl.saveCourierSettings);
router.get("/apikey", auth, ctrl.generateApiKey);
router.post("/automation", auth, ctrl.saveAutomation);
router.get("/retry", auth, ctrl.retryFailedOrders);
router.get("/", auth, ctrl.getIntegrationData);

module.exports = router;