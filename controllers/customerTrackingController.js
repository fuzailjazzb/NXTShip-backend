const axios = require("axios");
const Shipment = require("../models/shipment");

/**
 * ============================================
 * 📦 GET CUSTOMER LAST SHIPMENTS
 * ============================================
 */
exports.getCustomerShipments = async (req, res) => {
  try {
    console.log("📦 Fetch Customer Shipments");
    console.log("Customer:", req.customer);

    const shipments = await Shipment.find({
      customerId: req.customer._id,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    console.log("✅ Shipments Found:", shipments.length);

    res.status(200).json({
      success: true,
      shipments,
    });
  } catch (err) {
    console.log("❌ Shipment Fetch Error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

/**
 * ============================================
 * 🔍 TRACK SHIPMENT (ORDERID OR AWB)
 * ============================================
 */
exports.trackShipment = async (req, res) => {
  try {
    const id = req.params.id;

    console.log("🔎 Tracking Request:", id);
    console.log("User:", req.customer);

    // 1️⃣ DB SEARCH
    const shipment = await Shipment.findOne({
      $or: [{ orderId: id }, { waybill: id }],
      customerId: req.customer._id,
    });

    if (!shipment) {
      console.log("❌ Shipment Not Found");
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    console.log("✅ Shipment Found:", shipment.waybill);

    // 2️⃣ DELHIVERY LIVE TRACK
    let liveTracking = null;

    try {
      const response = await axios.get(
        `https://track.delhivery.com/api/v1/packages/json/?waybill=${shipment.waybill}`,
        {
          headers: {
            Authorization: `Token ${process.env.DELHIVERY_TOKEN}`,
          },
        }
      );

      console.log("📡 Delhivery Response Received");

      liveTracking =
        response.data?.ShipmentData?.[0]?.Shipment || null;
    } catch (apiErr) {
      console.log("⚠️ Delhivery API Error:", apiErr.message);
    }

    // 3️⃣ RETURN MERGED DATA
    res.status(200).json({
      success: true,
      shipment,
      liveTracking,
    });
  } catch (err) {
    console.log("🔥 Tracking Controller Error:", err.message);

    res.status(500).json({
      success: false,
      message: "Tracking Failed",
    });
  }
};