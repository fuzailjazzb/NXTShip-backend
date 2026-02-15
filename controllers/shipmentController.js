const axios = require("axios");

const Shipment = require("../models/shipment");
const { json } = require("express");

// ✅ BOOK SHIPMENT
exports.bookShipment = async (req, res) => {
  try {
    const shipmentData = req.body;

    // ✅ Duplicate Check
    const existing = await Shipment.findOne({
      orderId: shipmentData.orderId,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Order ID already exists ❌",
      });
    }

    // ✅ Save Shipment First
    const savedShipment = await Shipment.create({
      ...shipmentData,
      status: "Booked",
    });

    // ✅ Token Check
    if (!process.env.ICC_TOKEN) {
      return res.status(500).json({
        success: false,
        message: "Delhivery Token Missing in Backend ENV ❌",
      });
    }

    // ✅ Delhivery URL
    const url = "https://track.delhivery.com/api/cmu/create.json";

    // ✅ Correct Payload Encoding
    const payload = {
      pickup_location: "KING NXT",

      shipments: [
        {
          name: shipmentData.customerName,
          add: shipmentData.address,
          city: shipmentData.city,
          state: shipmentData.state,
          country: "India",
          pin: shipmentData.pincode,
          phone: shipmentData.phone,

          order: shipmentData.orderId,
          payment_mode: shipmentData.paymentMode,

          shipment_length: 10,
          shipment_width: 10,
          shipment_height: 10,
          weight: shipmentData.weight || 0.5,

          quantity: shipmentData.quantity || 1,
          total_amount: shipmentData.orderValue || 500
        }
      ]
    };

    // ✅ API Call
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Token ${process.env.ICC_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    console.log("✅ DELHIVERY RESPONSE:", response.data);

    res.json({
      success: true,
      message: "Shipment Booked Successfully ✅",
      data: response.data,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Shipment Booking Failed ❌",
      error: error.response?.data || error.message,
    });
  };


  // ✅ Waybill Extract
  const waybill =
    response.data?.packages?.[0]?.waybill ||
    response.data?.packages?.waybill ||
    response.data?.waybill ||
    null;

  // ✅ Update DB
  savedShipment.waybill = waybill;
  savedShipment.status = "Booked";
  await savedShipment.save();

  return res.json({
    success: true,
    message: "Shipment Booked Successfully ✅",
    waybill,
    shipment: savedShipment,
    delhiveryResponse: response.data,
  });

};




// ✅ GET ALL SHIPMENTS

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

        Authorization: `Token${process.env.ICC_TOKEN}`,

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