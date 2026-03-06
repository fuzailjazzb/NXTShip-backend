const express = require("express");
const router = express.Router();

const { getDashboardSummary, 
    getDashboardAnalytics, 
    getDashboardShipments, 
    getDashboardActivity } = require("../controllers/dashboardController");


const { customerAuth } = require("../middleware/customerAuth");

/*
==============================
📊 DASHBOARD ROUTES
==============================
*/

router.get("/summary", customerAuth, getDashboardSummary);

router.get("/analytics", customerAuth, getDashboardAnalytics);

router.get("/recent-shipments", customerAuth, getDashboardShipments);

router.get("/live-activity", customerAuth, getDashboardActivity )

module.exports = router;