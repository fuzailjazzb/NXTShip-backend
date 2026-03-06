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
                smartTracking: null,
                message: "Shipment Not Found"
            });

        }

        // 2️⃣ Waybill check
        if (!shipment.waybill) {

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

        // 4️⃣ Build response
        res.json({

            success: true,

            smartTracking: {
                status:
                    liveTracking?.Status?.Status ||
                    shipment.status ||
                    "Booked",

                eta: liveTracking?.ExpectedDeliveryDate || null,

                timeline: liveTracking?.Scans || [],

                routeStations: [
                    "Warehouse",
                    "Origin Hub",
                    "Transit Hub",
                    "Destination Hub",
                    "Delivered"
                ],

                rider: {
                    name: "Not Assigned",
                    phone: "Available once Out For Delivery"
                },

                courier: "Delhivery"

            }

        });

    } catch (err) {

        console.log("Dashboard Activity Error:", err);

        res.status(500).json({
            success: false,
            message: "Activity failed"
        });

    }

};