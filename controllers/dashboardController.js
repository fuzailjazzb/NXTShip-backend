const Shipment = require("../models/shipment");
const Customer = require("../models/customer");

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

