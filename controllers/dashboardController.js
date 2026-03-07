const Shipment = require("../models/shipment");
const Customer = require("../models/customer");
const { default: axios } = require("axios");

/*
=====================================
📊 DASHBOARD SUMMARY
=====================================
*/

exports.getDashboardSummary = async (req, res) => {
    try {

        const customerId = req.customer._id;

        const orders = await Shipment.countDocuments({ customerId });

        const shipments = await Shipment.countDocuments({
            customerId,
            status: { $ne: "Cancelled" }
        });

        const delivered = await Shipment.countDocuments({
            customerId,
            status: "Delivered"
        });

        const customer = await Customer.findById(customerId);

        res.json({
            success: true,
            orders,
            shipments,
            delivered,
            walletBalance: customer.walletBalance || 0
        });

    } catch (err) {
        console.log("Dashboard Summary Error:", err.message);

        res.status(500).json({
            success: false,
            message: "Failed to load dashboard summary"
        });
    }
};



/*
=====================================
📈 DASHBOARD ANALYTICS
=====================================
*/

exports.getDashboardAnalytics = async (req, res) => {
    try {

        const customerId = req.customer._id;

        const analytics = await Shipment.aggregate([
            {
                $match: { customerId }
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    shipments: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        res.json({
            success: true,
            analytics
        });

    } catch (err) {
        console.log("Analytics Error:", err.message);

        res.status(500).json({
            success: false,
            message: "Failed to load analytics"
        });
    }
};



/*
=====================================
📦 RECENT SHIPMENTS
=====================================
*/

exports.getDashboardShipments = async (req, res) => {
    try {

        const customerId = req.customer._id;

        const shipments = await Shipment.find({ customerId })
            .sort({ createdAt: -1 })
            .limit(5)
            .select("orderId waybill city status createdAt");

        res.status(200).json({
            success: true,
            shipments
        });

    } catch (err) {
        console.log("Recent Shipments Error:", err.message);

        res.status(500).json({
            success: false,
            message: "Failed to load shipments"
        });
    }
};



/*
=====================================
📦 LIVE ACTIVITY
=====================================
*/

exports.getDashboardActivity = async (req, res) => {

    try {

        // 1️⃣ Latest shipment find
        const shipment = await Shipment.findOne({
            customerId: req.customer._id
        }).sort({ createdAt: -1 });

        if (!shipment) {

            return res.json({
                success: true,
                smartTracking: {
                    status: { status: "No Shipment" },
                    eta: null,
                    timeline: [],
                    routeStations: [],
                    rider: null,
                    courier: null || "Delhivery"
                }
            });

        }
        console.log("Latest Shipment:", shipment.waybill);

        // 3️⃣ Delhivery API call
        const response = await axios.get(
            `https://track.delhivery.com/api/v1/packages/json/?waybill=${shipment.waybill}`,
            {
                headers: {
                    Authorization: `Token ${process.env.DELHIVERY_TOKEN}`
                }
            }
        );

        const liveTracking =
            response.data?.ShipmentData?.[0]?.Shipment || null;

        // Extract Shipment Tracking Data
        if (!liveTracking) {

            return res.json({
                success: true,
                smartTracking: {
                    status: shipment.status || "Booked",
                    eta: null,
                    timeline: [],
                    routeStations: [],
                    rider: null,
                    courier: "Delhivery"
                }
            });

        }

        // 4️⃣ Build Timeline

        const scans = liveTracking?.Scans || [];

        const timeline = scans.map((scan) => ({
            status: scan.ScanDetail?.Scan,
            location: scan.ScanDetail?.ScannedLocation,
            time: scan.ScanDetail?.ScanDateTime,
        }));

        /* =========================
           RIDER DETECTION
        ========================= */

        const ofdScan = scans.find((s) =>
            s.ScanDetail?.Scan?.toLowerCase().includes("out for delivery")
        );

        if (ofdScan) {
            rider = {
                name: "Delivery Partner",
                phone:
                    liveTracking?.Status?.Instructions ||
                    "Contact courier support",
                available: true,
            };

            console.log("🚴 Rider Assigned");
        }

    

    /* =====================================================
       3️⃣ ETA CALCULATION
    ====================================================== */

    const createdDate = new Date(shipment.createdAt);
    const etaDate = new Date(createdDate);
    etaDate.setDate(createdDate.getDate() + 3);

    const eta = etaDate.toDateString();

    /* =====================================================
       4️⃣ STATIC ROUTE STATIONS (UX)
    ====================================================== */

    const routeStations = [
        "Pickup Warehouse",
        "Origin Hub",
        "Transit Hub",
        "Destination Hub",
        "Out For Delivery",
        "Delivered",
    ];

    /* =====================================================
       5️⃣ FINAL RESPONSE (BACKWARD SAFE)
    ====================================================== */

    res.status(200).json({
        success: true,

        // ✅ OLD RESPONSE (unchanged)
        shipment,
        liveTracking,

        // ✅ NEW PRO DATA (frontend optional use)
        smartTracking: {
            status:
                liveTracking?.Status?.Status ||
                shipment.status ||
                "Booked",

            eta,
            timeline,
            routeStations,
            rider,
            courier: "Delhivery",
            deliveryCompleted:
                liveTracking?.Status?.Status === "Delivered",
        },
    });

} catch (err) {
    console.log("🔥 Tracking Controller Error:", err.message);

    res.status(500).json({
        success: false,
        message: "Tracking Failed",
    });
}
};