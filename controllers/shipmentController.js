const axios = require("axios");
const Shipment = require("../models/shipment");
const { fetchWaybill } = require("../services/delhiveryService");

/**
 * ✅ BOOK SHIPMENT (DELHIVERY FINAL SIMPLE)
 * Frontend से direct fields आएंगे:
 * customerName, phone, address, city, state, pincode, orderId, paymentMode
 */

exports.bookShipment = async (req, res) => {
  try {
    const shipmentData = req.body;

    // ✅ Basic Validation
    if (
      !shipmentData.customerName ||
      !shipmentData.phone ||
      !shipmentData.address ||
      !shipmentData.pincode
    ) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing ❌",
      });
    }

    // ✅ 1. Generate Order ID (Manual bhi चलेगा)
    const lastShipment = await Shipment.findOne().sort({ orderNumber: -1 });
    const nextOrderNumber = lastShipment ? lastShipment.orderNumber + 1 : 1;

    const newOrderId = `ORD-${new Date().getFullYear()}-${String(
      nextOrderNumber
    ).padStart(5, "0")}`;

    shipmentData.orderId = newOrderId;

    // ✅ 2. Get Waybill First (MOST IMPORTANT FIX)
    const waybillRes = await axios.get(
      "https://track.delhivery.com/waybill/api/bulk/json/?count=1",
      {
        headers: {
          Authorization: `Token ${process.env.ICC_TOKEN}`,
          Accept: "application/json",
        },
      }
    );

    const waybill = waybillRes.data?.waybills?.[0];

    if (!waybill) {
      return res.status(500).json({
        success: false,
        message: "Waybill Fetch Failed ❌ Delhivery AWB not available",
      });
    }

    console.log("✅ Waybill Generated:", waybill);

    // ✅ 3. Save Shipment in DB (Pending)
    const savedShipment = await Shipment.create({
      customerName: shipmentData.customerName,
      phone: shipmentData.phone,
      address: shipmentData.address,
      city: shipmentData.city,
      state: shipmentData.state,
      pincode: shipmentData.pincode,

      orderId: shipmentData.orderId,
      orderNumber: nextOrderNumber,

      paymentMode: shipmentData.paymentMode,
      orderValue: shipmentData.orderValue || 0,
      weight: shipmentData.weight || 0.5,

      status: "Pending",
    });

    // ✅ 4. Booking Payload (Waybill Included)
    const url = "https://track.delhivery.com/api/cmu/create.json";

    const payload =
      "format=json&data=" +
      JSON.stringify({
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

            // ✅ MOST IMPORTANT FIX
            
          },
        ],

        pickup_location: {
          name: process.env.PICKUP_LOCATION || "KING NXT",
        },
      });

    // ✅ 5. Call Delhivery Booking API
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Token ${process.env.ICC_TOKEN}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    console.log("✅ DELHIVERY RESPONSE:", response.data);

    // ✅ 6. Update Shipment with Waybill
    savedShipment.waybill = waybill;
    savedShipment.status = "Booked";
    await savedShipment.save();

    // ✅ Final Response
    return res.json({
      success: true,
      message: "Shipment Booked Successfully ✅",
      waybill,
      orderId: shipmentData.orderId,
      shipment: savedShipment,
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