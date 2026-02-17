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

    // ✅ Delhivery Payload (documentation exact)
    const payload = {
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

          total_amount: shipmentData.orderValue,
          quantity: 1,
          weight: shipmentData.weight || 0.5,

          shipment_width: "10",
          shipment_height: "10",
          shipping_mode: "Surface",
          address_type: "home",
        },
      ],

      pickup_location: {
        name: "KING NXT",
      },
    };

    // ✅ सबसे जरूरी चीज
    const formData =
      "format=json&data=" + encodeURIComponent(JSON.stringify(payload));

    // ✅ Delhivery API Call
    const response = await axios.post(
      "https://track.delhivery.com/api/cmu/create.json",
      formData,
      {
        headers: {
          Authorization: `Token ${process.env.DELHIVERY_TOKEN}`,
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    console.log("DELHIVERY RESPONSE:", response.data);

    // ✅ Waybill निकालो
    const waybill =
      response.data?.packages?.[0]?.waybill ||
      response.data?.packages?.[0]?.waybill_number;

    if (!waybill) {
      return res.status(400).json({
        success: false,
        message: "No waybill received from Delhivery",
        delhiveryResponse: response.data,
      });
    }

    return res.json({
      success: true,
      waybill,
      orderId: shipmentData.orderId,
    });
  } catch (error) {
    console.log("Booking Error:", error.response?.data || error.message);

    return res.status(500).json({
      success: false,
      message: "Shipment Booking Failed",
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
    const { awb } = req.params;

    const shipment = await Shipment.findOne({ waybill: awb });

    if (!shipment) {
      return res.json({
        success: false,
        message: "Shipment not found for this Waybill ❌",
      });
    }

    return res.json({
      success: true,
      status: shipment.status || "Booked",
      log: shipment.city || "N/A",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Tracking Failed ❌",
      error: error.message,
    });
  }
};

/**
 * ✅ DELHIVERY TRACKING API CALL (External Tracking)
 */
exports.delhiveryTracking = async (req, res) => {
  try {
    const { waybill } = req.params;

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

exports.checkPinSrvice = async (req, res) => {
  try {
    const pincode = req.params.pincode ||req.params.pin;

    if (!pincode || pincode.length !== 6) {
      return res.status(400).json({
        success: false,
        message: "Pincode is required ❌",
      });
    }

    const url = `https://track.delhivery.com/c/api/pin-codes/json/?filter_codes=${pincode}`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Token ${process.env.ICC_TOKEN}`,
      },
    });
    
    return res.json({
      success: true,
      pincode,
      data: response.data,
    });
  } catch (error) {

    console.log("❌ Pincode Check Error:", error.response?.data || error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to check pincode service ❌",
      error: error.message,
    });
  }
};