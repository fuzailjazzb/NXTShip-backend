const Shipment = require("../models/shipment");
const axios = require("axios");

/* =====================================================
   ✅ Indian Courier Company API Base URL
===================================================== */
const ICC_BASE_URL =
  "https://api.indiancouriercompany.com/api/custom";

/* =====================================================
   ✅ Utility: ICC Headers
===================================================== */
const getICCHeaders = () => {
  return {
    email: process.env.ICC_EMAIL,       // 🔥 CLIENT WILL PROVIDE
    password: process.env.ICC_PASSWORD // 🔥 CLIENT WILL PROVIDE
  };
};

/* =====================================================
   ✅ 1. CREATE SHIPMENT + BOOK ORDER
===================================================== */
exports.createShipment = async (req, res) => {
  try {
    const {
      orderId,
      customerName,
      phone,
      deliveryAddress,
      weight,
    } = req.body;

    /* -------------------------------
       ✅ Basic Validation
    -------------------------------- */
    if (!orderId || !customerName || !phone || !deliveryAddress) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields!",
      });
    }

    /* -------------------------------
       ✅ Prevent Duplicate Order ID
    -------------------------------- */
    const existing = await Shipment.findOne({ orderId });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Order ID already exists!",
        shipment: existing,
      });
    }

    /* -------------------------------
       ✅ Step 1: Call Courier API First
    -------------------------------- */
    let courierResponse;

    try {
      courierResponse = await axios.post(
        `${ICC_BASE_URL}/createOrder`,
        {
          orderId,
          paymentMode: "COD",

          // ✅ Delivery Address (Must be object)
          deliveryAddress,

          // ✅ Delivery Phones
          deliveryPhones: [
            {
              phoneNumber: phone,
              phoneType: "Primary",
            },
          ],

          // ✅ Weight
          physicalWeight: weight || 1,

          // ✅ Default Dimensions
          dimensions: {
            length: 10,
            breadth: 10,
            height: 10,
          },

          // ✅ Products Dummy (Client will replace later)
          products: [
            {
              productName: "Sample Product",
              quantity: 1,
              sku: "SKU001",
              orderValue: 100,
              hsn: "0000",
            },
          ],

          // 🔥 Pickup Address ID Required
          pickupAddressId: process.env.PICKUP_ADDRESS_ID,
        },
        {
          headers: getICCHeaders(),
          timeout: 15000, // ✅ Timeout protection
        }
      );
    } catch (apiError) {
      return res.status(502).json({
        success: false,
        message: "Courier API Booking Failed",
        error: apiError.response?.data || apiError.message,
      });
    }

    console.log("✅ Courier Booking Response:", courierResponse.data);

    /* -------------------------------
       ✅ Step 2: Extract AWB Number
    -------------------------------- */
    const awbNumber =
      courierResponse.data?.data?.awbNumber ||
      courierResponse.data?.data?.awb ||
      null;

    /* -------------------------------
       ✅ Step 3: Save Shipment in MongoDB
    -------------------------------- */
    const shipment = await Shipment.create({
      orderId,
      customerName,
      phone,
      deliveryAddress,
      weight,

      awbNumber,
      status: "Booked",

      courierResponse: courierResponse.data,
    });

    /* -------------------------------
       ✅ Final Success Response
    -------------------------------- */
    res.status(201).json({
      success: true,
      message: "Shipment Created & Booked Successfully ✅",
      shipment,
    });
  } catch (error) {
    console.log("❌ Shipment Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

/* =====================================================
   ✅ 2. TRACK SHIPMENT
===================================================== */
exports.trackShipment = async (req, res) => {
  try {
    const { awb, orderId, phone } = req.body;

    /* -------------------------------
       ✅ Validation
    -------------------------------- */
    if (!awb && !orderId) {
      return res.status(400).json({
        success: false,
        message: "Provide AWB or Order ID to track shipment!",
      });
    }

    /* -------------------------------
       ✅ Prepare Request Body
    -------------------------------- */
    let trackBody = {};

    if (awb) {
      trackBody.awb = awb;
    } else {
      trackBody.orderId = orderId;
      trackBody.phone = phone; // Required if using orderId
    }

    /* -------------------------------
       ✅ Call Tracking API
    -------------------------------- */
    const response = await axios.post(
      `${ICC_BASE_URL}/tracking`,
      trackBody,
      {
        headers: getICCHeaders(),
        timeout: 15000,
      }
    );

    /* -------------------------------
       ✅ Update Shipment Status in DB
    -------------------------------- */
    if (awb) {
      await Shipment.findOneAndUpdate(
        { awbNumber: awb },
        { status: response.data?.data?.currentStatus || "In Transit" }
      );
    }

    res.json({
      success: true,
      message: "Shipment Tracked Successfully ✅",
      trackingData: response.data,
    });
  } catch (error) {
    console.log("❌ Tracking Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Tracking Failed",
      error: error.response?.data || error.message,
    });
  }
};

/* =====================================================
   ✅ 3. GET ALL SHIPMENTS (Admin Dashboard)
===================================================== */
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
      message: "Failed to fetch shipments",
      error: error.message,
    });
  }
};

/* =====================================================
   ✅ 4. GET SINGLE SHIPMENT BY ORDER ID
===================================================== */
exports.getShipmentByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;

    const shipment = await Shipment.findOne({ orderId });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found!",
      });
    }

    res.json({
      success: true,
      shipment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching shipment",
      error: error.message,
    });
  }
};