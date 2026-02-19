const Shipment = require("../models/shipment");

exports.getCustomerReports = async (req, res) => {
    try {
        console.log("📊 Reports API hit");

        const customerId = req.customer.id;

        // 🔹 Base filter
        const baseMatch = {
            customerId: customerId
        };

        // ===============================
        // 1️⃣ STATUS COUNTS
        // ===============================
        const statusStats = await Shipment.aggregate([
            { $match: baseMatch },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        let totalShipments = 0;
        let delivered = 0;
        let inTransit = 0;
        let cancelled = 0;

        statusStats.forEach(s => {
            totalShipments += s.count;
            if (s._id === "Delivered") delivered = s.count;
            if (s._id === "In Transit") inTransit = s.count;
            if (s._id === "Cancelled") cancelled = s.count;
        });

        // ===============================
        // 2️⃣ THIS MONTH SHIPMENTS
        // ===============================
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const thisMonth = await Shipment.countDocuments({
            ...baseMatch,
            createdAt: { $gte: startOfMonth }
        });

        // ===============================
        // 3️⃣ SHIPMENTS PER DAY (Last 7 Days)
        // ===============================
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const shipmentsPerDay = await Shipment.aggregate([
            {
                $match: {
                    ...baseMatch,
                    createdAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$createdAt"
                        }
                    },
                    total: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // ===============================
        // 4️⃣ TOP DESTINATIONS
        // ===============================
        const topDestinations = await Shipment.aggregate([
            { $match: baseMatch },
            {
                $group: {
                    _id: "$city",
                    total: { $sum: 1 }
                }
            },
            { $sort: { total: -1 } },
            { $limit: 5 }
        ]);

        // ===============================
        // 5️⃣ RECENT SHIPMENTS (Table)
        // ===============================
        const recentShipments = await Shipment.find(baseMatch)
            .sort({ createdAt: -1 })
            .limit(20)
            .select("orderId city state status paymentMode createdAt");

        console.log("✅ Reports Data Generated");

        res.status(200).json({
            success: true,
            totalShipments,
            delivered,
            inTransit,
            cancelled,
            thisMonth,
            shipmentsPerDay,
            topDestinations,
            recentShipments
        });

    } catch (error) {
        console.error("❌ Reports Error:", error);
        res.status(500).json({
            success: false,
            message: "Reports generation failed",
            error: error.message
        });
    }
};