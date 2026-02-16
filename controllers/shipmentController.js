const axios = require("axios");
const Shipment = require("../models/shipment");

/**
 * ✅ BOOK SHIPMENT (DELHIVERY FINAL SIMPLE)
 * Frontend से direct fields आएंगे:
 * customerName, phone, address, city, state, pincode, orderId, paymentMode
 */
const axios = require("axios");
const Shipment = require("../models/shipment");
const { fetchWaybill } = require("../services/delhiveryService");

exports.bookShipment = async (req, res) => {
  try {
    const shipmentData = req.body;

    // ✅ Basic Validation
    if (
      !shipmentData.customerName ||
      !shipmentData.phone ||
      !shipmentData.address ||
      !shipmentData.city ||
      !shipmentData.state ||
      !shipmentData.pincode ||
      !shipmentData.paymentMode
    ) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing ❌",
      });
    }

    // ✅ Generate Order ID (Simple Working)
    const orderId = "ORD" + Date.now();
    shipmentData.orderId = orderId;

    // ✅ Step 1: Fetch Waybill FIRST
    const waybill = await fetchWaybill();
    console.log("✅ Waybill Assigned:", waybill);

    // ✅ Step 2: Save Shipment in DB
    const savedShipment = await Shipment.create({
      customerName: shipmentData.customerName,
      phone: shipmentData.phone,
      address: shipmentData.address,
      city: shipmentData.city,
      state: shipmentData.state,
      pincode: shipmentData.pincode,
      orderId: shipmentData.orderId,
      paymentMode: shipmentData.paymentMode,
      orderValue: shipmentData.orderValue || 0,
      weight: shipmentData.weight || 0.5,
      waybill: waybill,
      status: "Pending",
    });

    // ✅ Step 3: Delhivery Booking API
    const url = "https://track.delhivery.com/api/cmu/create.json";

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

            cod_amount:
              shipmentData.paymentMode === "COD"
                ? shipmentData.orderValue
                : 0,

            total_amount: shipmentData.orderValue || 0,
            quantity: 1,
            weight: shipmentData.weight || 0.5,

            // ✅ MOST IMPORTANT
            waybill: waybill,
          },
        ],

        pickup_location: {
          name: "KING NXT",
        },
      },
    };

    // ✅ Step 4: Call Delhivery
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Token ${process.env.ICC_TOKEN}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    console.log("✅ DELHIVERY RESPONSE:", response.data);

    // ✅ Step 5: Update Status
    savedShipment.status = "Booked";
    await savedShipment.save();

    return res.json({
      success: true,
      message: "Shipment Booked Successfully ✅",
      waybill,
      orderId: shipmentData.orderId,
      shipment: savedShipment,
      delhiveryResponse: response.data,
    });
  } catch (error) {
    console.log("❌ Booking Error:", error.response?.data || error.message);

    return res.status(500).json({
      success: false,
      message: "Shipment Booking Failed ❌",
      error: error.response?.data || error.message,
    });
  }
};

/**
 * ✅ GET ALL SHIPMENTS (Dashboard + View Shipments)
 */
exports.getAllShipments = async (req, res) => {
  try {
    const shipments = await Shipment.find().sort({ createdAt: -1 });

    return res.json({
      success: true,
      total: shipments.length,
      shipments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch shipments ❌",
      error: error.message,
    });
  }
};

/**
 * ✅ TRACK SHIPMENT (Waybill Tracking)
 */
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

    return res.json({
      success: true,
      waybill,
      tracking: response.data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Tracking Failed ❌",
      error: error.response?.data || error.message,
    });
  }
};

/**
 * ✅ CANCEL SHIPMENT (Local Cancel Only)
 */
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

    return res.json({
      success: true,
      message: "Shipment Cancelled Successfully ✅",
      shipment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Cancel Failed ❌",
      error: error.message,
    });
  }
};