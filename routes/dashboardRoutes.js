const express = require("express");
const router = express.Router();

const dashboardController = require("../controllers/dashboardController");

const customerAuth = require("../middleware/customerAuth");

/*
==============================
📊 DASHBOARD ROUTES
==============================
*/

router.get("/summary", customerAuth, dashboardController.getDashboardSummary);

router.get("/analytics", customerAuth, dashboardController.getDashboardAnalytics);

// router.get("/recent-shipments", customerAuth, dashboardController.getRecentShipments);

module.exports = router;