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

  console.log("🚀 Tracking API Hit");

  try {
    const trackingInput = req.params.id;

    /* =========================
       1️⃣ FIND SHIPMENT
    ========================= */

    let shipment;

    if (trackingInput.startsWith("ORD-")) {
      shipment = await Shipment.findOne({ orderId: trackingInput });
    } else {
      shipment = await Shipment.findOne({ waybill: trackingInput });
    }

    if (!shipment) {
      return res.status(404).json({
        success:false,
        message:"Shipment not found"
      });
    }

    /* =========================
       2️⃣ DELHIVERY TRACK API
    ========================= */

    let liveTracking=null;

    try{
      const response = await axios.get(
        `https://track.delhivery.com/api/v1/packages/json/?waybill=${shipment.waybill}`,
        {
          headers:{
            Authorization:`Token ${process.env.DELHIVERY_TOKEN}`
          },
          timeout:5000
        }
      );

      liveTracking=response.data;

      console.log("✅ Live tracking received");

    }catch(err){
      console.log("⚠️ Using DB fallback tracking");
    }

    const shipmentLive =
      liveTracking?.ShipmentData?.[0]?.Shipment || {};

    const currentStatus =
      shipmentLive?.Status?.Status ||
      shipment.status ||
      "Booked";

    /* =========================
       3️⃣ TIMELINE BUILD
    ========================= */

    const scans = shipmentLive?.Scans || [];

    const timeline = scans.length
      ? scans.map(scan => ({
          status: scan.ScanDetail?.Scan,
          location: scan.ScanDetail?.ScannedLocation,
          time: scan.ScanDetail?.ScanDateTime
        }))
      : [{
          status: currentStatus,
          location: shipment.city,
          time: shipment.createdAt
        }];

    /* =========================
       4️⃣ RIDER DETECTION LOGIC
    ========================= */

    let rider = {
      name: "Not Assigned Yet",
      phone: "Will be available on Out For Delivery",
      available:false
    };

    // Find OFD scan
    const ofdScan = scans.find(s =>
      s.ScanDetail?.Scan?.toLowerCase().includes("out for delivery")
    );

    if (ofdScan) {
      rider = {
        name: "Delivery Partner",
        phone:
          shipmentLive?.Status?.Instructions ||
          "Contact courier support",
        available:true
      };

      console.log("🚴 Rider Assigned");
    }

    /* =========================
       5️⃣ ETA CALCULATION
    ========================= */

    const createdDate=new Date(shipment.createdAt);
    const etaDate=new Date(createdDate);
    etaDate.setDate(createdDate.getDate()+3);

    /* =========================
       6️⃣ ROUTE STATIONS
    ========================= */

    const routeStations=[
      "Pickup Warehouse",
      "Origin Hub",
      "Transit Hub",
      "Destination Hub",
      "Out For Delivery",
      "Delivered"
    ];

    /* =========================
       7️⃣ FINAL RESPONSE
    ========================= */

    return res.status(200).json({
      success:true,
      shipment:{
        orderId:shipment.orderId,
        waybill:shipment.waybill,
        courier:"Delhivery",
        status:currentStatus,
        destination:shipment.city,
        eta:etaDate.toDateString(),
        timeline,
        routeStations,
        rider,
        deliveryCompleted: currentStatus==="Delivered"
      }
    });

  } catch(error){

    console.log("❌ Tracking Error:",error.message);

    return res.status(500).json({
      success:false,
      message:"Tracking Failed",
      error:error.message
    });
  }
};