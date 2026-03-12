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
    console.log("👤 User:", req.customer?._id);

    /* =====================================================
       1️⃣ DATABASE SEARCH (UNCHANGED LOGIC)
    ====================================================== */

    const shipment = await Shipment.findOne({
      $or: [{ orderId: id }, { waybill: id }],
      
    });

    if (!shipment) {
      console.log("❌ Shipment Not Found");
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    console.log("✅ Shipment Found:", shipment.waybill);

    /* =====================================================
       2️⃣ DELHIVERY LIVE TRACK
    ====================================================== */

    let liveTracking = null;
    let timeline = [];
    let rider = {
      name: "Not Assigned Yet",
      phone: "Available once Out For Delivery",
      available: false,
    };

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

      /* =========================
         BUILD TIMELINE
      ========================= */

      const scans = liveTracking?.Scans || [];

      timeline = scans.map((scan) => ({
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

    } catch (apiErr) {
      console.log("⚠️ Delhivery API Error:", apiErr.message);
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