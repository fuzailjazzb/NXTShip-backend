const axios = require("axios");
const Shipment = require("../models/shipment");

const { CreateShipmentOnDelhivery } = require("../services/delhiveryService");
const shipment = require("../models/shipment");

exports.bookShipment = async (req, res) => {
  try {
    const shipmentData = req.body;

    // ✅ Delhivery API Production URL
    const delhiveryResponse = await CreateShipmentOnDelhivery(shipmentData);

    const saved = await Shipment.create({
      ...shipmentData,
      delhiveryResponse,
      status: "Booked",
    });

    res.json({
      success: true,
      message: "Shipment Booked Successfully ✅",
      delhiveryResponse: response.data,
      shipment: savedShipment,
      shipment: saved,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Shipment Booking Failed ❌",
      error: error.message,
    });
  }
};