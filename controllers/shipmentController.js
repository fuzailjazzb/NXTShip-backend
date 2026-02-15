const axios = require("axios");
const Shipment = require("../models/shipment");


// ✅ BOOK SHIPMENT (DELHIVERY)
exports.bookShipment = async (req, res) => {
  try {
    const shipmentData = req.body;

    // ✅ 1. Prevent Duplicate Order ID
    const existing = await Shipment.findOne({ orderId: shipmentData.orderId });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Order ID already exists ❌ Please use unique Order ID",
      });
    }

    // ✅ 2. Save Shipment First (Pending)
    const savedShipment = await Shipment.create({
      orderId: shipmentData.orderId,
      customerName: shipmentData.customerName,
      phone: shipmentData.phone,
      address: shipmentData.address,
      city: shipmentData.city,
      state: shipmentData.state,
      pincode: shipmentData.pincode,
      paymentMode: shipmentData.paymentMode,
      orderValue: shipmentData.orderValue,
      weight: shipmentData.weight,
      status: "Pending",
    });

    // ✅ 3. Delhivery API URL
    const url = "https://track.delhivery.com/api/cmu/create.json";

    // ✅ 4. Correct Payload Format (MOST IMPORTANT FIX)
    const payload = {
      format: "json",
      data: {
        shipments: [
          {
            name: shipmentData.customerName,
            add: shipmentData.address,
            pin: shipmentData.pincode,
            city: shipmentData.city,
            state: shipmentData.state,
            country: "India",
            phone: shipmentData.phone,
            order: shipmentData.orderId,
            payment_mode: shipmentData.paymentMode,
            total_amount: shipmentData.orderValue,
            quantity: shipmentData.quantity || 1,
            weight: shipmentData.weight || 0.5,
          },
        ],
        pickup_location:
          process.env.PICKUP_LOCATION || "KING NXT",
      },
    };
          

    // ✅ 5. Call Delhivery API
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Token ${process.env.ICC_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    console.log("✅ DELHIVERY RESPONSE:", response.data);

    // ✅ 6. Waybill Extract Safely
    const waybill =
      response.data?.packages?.[0]?.waybill ||
      response.data?.packages?.waybill ||
      response.data?.waybill ||
      null;

    // ✅ 7. Update Shipment DB
    savedShipment.waybill = waybill;
    savedShipment.status = waybill ? "Booked" : "Failed";
    await savedShipment.save();

    // ✅ 8. Return Response
    return res.json({
      success: true,
      message: waybill
        ? "Shipment Booked Successfully ✅"
        : "Shipment Created but Waybill Not Assigned ❌",

      waybill,
      shipment: savedShipment,
      delhiveryResponse: response.data,
    });
  } catch (error) {
    console.log("❌ Booking Error:", error.response?.data || error.message);

    return res.status(500).json({
      success: false,
      message: "Delhivery Booking Failed ❌",
      error: error.response?.data || error.message,
    });
  }
};



// ✅ GET ALL SHIPMENTS (Dashboard)
exports.getAllShipments = async (req, res) => {
  try {
    const shipments = await Shipment.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      total: shipments.length,
      shipments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch shipments ❌",
      error: error.message,
    });
  }
};



// ✅ TRACK SHIPMENT
exports.trackShipment = async (req, res) => {
  try {
    const waybill = req.params.waybill;

    const url = `https://track.delhivery.com/api/v1/packages/json/?waybill=${waybill}`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Token ${process.env.ICC_TOKEN}`,
        Accept: "application/json",
      },
    });

    res.json({
      success: true,
      waybill,
      tracking: response.data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Tracking Failed ❌",
      error: error.response?.data || error.message,
    });
  }
};



// ✅ CANCEL SHIPMENT
exports.cancelShipment = async (req, res) => {
  try {
    const shipmentId = req.params.id;

    const shipment = await Shipment.findById(shipmentId);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found ❌",
      });
    }

    shipment.status = "Cancelled";
    await shipment.save();

    res.json({
      success: true,
      message: "Shipment Cancelled Successfully ✅",
      shipment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Cancel Failed ❌",
      error: error.message,
    });
  }
};