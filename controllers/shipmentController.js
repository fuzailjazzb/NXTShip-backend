const axios = require("axios");
const Shipment = require("../models/shipment");
const { response } = require("express");

exports.bookShipment = async (req, res) => {
  try {
    const shipmentData = req.body;

    const url = "https://track.delhivery.com/api/cmu/create.json";

    // ✅ Delhivery expects FORM encoded payload
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

            shipment_width: "10",
            shipment_height: "10",
            weight: "1",
            shipping_mode: "Surface",
          },
        ],
        pickup_location: {
          name: process.env.PICKUP_NAME || "KING NXT",
        },
      });
    
    // ✅ Correct API Call
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Token ${process.env.ICC_TOKEN}`,
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      timeout: 20000,
    });


    console.log("DELHIVERY RESPONSE:", response.data);

    // ✅ Waybill extraction
    const waybill =
      response.data?.packages?.[0]?.waybill ||
      response.data?.shipment?.[0]?.waybill ||
      response.data?.waybill ||
      "N/A";

    // ✅ Save shipment in MongoDB
    const savedShipment = await Shipment.create({
      ...shipmentData,
      waybill,
    });

    res.json({
      success: true,
      message: "Shipment Booked Successfully ✅",
      waybill,
      shipment: savedShipment,
      delhiveryResponse: response.data,
    });
  } catch (error) {
    console.log("🔥 Delhivery ERROR:", error.response?.data || error.message);

    res.status(500).json({
      success: false,
      message: "Shipment Booking Failed ❌",
      error: error.response?.data || error.message,
    });
  }
};

// Fetch all shipments API 

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

// Track shipment API

exports.trackShipment = async (req, res) => {
  try {
    const waybill = req.params.waybill;

    if (!waybill) {
      return res.status(400).json({
        success: false,
        message: "Waybill number is required for tracking",
      });
    }

    const url = `https://track.delhivery.com/api/v1/packages/json/?waybill=${waybill}`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Token ${process.env.ICC_TOKEN}`,
        Accept: "application/json",
      },
      timeout: 20000,
    });
    
    res.json({
      success: true,
      waybill,
      tracking: response.data,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to track shipment",
      error: error.response?.data || error.message,
    });


    console.log("🔥 Delhivery Tracking ERROR:", error.response?.data || error.message);
  }
};

// Cancel shipment API

exports.cancelShipment = async (req, res) => {
  try {
    const shipmentId = req.params.id;
    const shipment = await Shipment.findById(shipmentId);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }
    const waybill = shipment.waybill;
    await Shipment.findByIdAndDelete(shipmentId);

    res.json({
      success: true,
      message: "Shipment cancelled successfully",
      waybill,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to cancel shipment",
      error: error.message,
    });

  }
};
