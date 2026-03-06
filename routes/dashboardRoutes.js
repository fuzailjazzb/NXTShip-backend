const express = require("express");
const router = express.Router();

const { getDashboardSummary, getDashboardAnalytics } = require("../controllers/dashboardController");
const recentShipment = require("../controllers/customerTrackingController")

const { customerAuth } = require("../middleware/customerAuth");

/*
==============================
📊 DASHBOARD ROUTES
==============================
*/

router.get("/summary", customerAuth, getDashboardSummary);

router.get("/analytics", customerAuth, getDashboardAnalytics);

router.get("/recent-shipments", customerAuth, recentShipment.getCustomerShipments);

module.exports = router;