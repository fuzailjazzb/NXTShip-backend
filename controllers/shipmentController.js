const axios = require("axios");
const Shipment = require("../models/shipment");

const { CreateShipmentOnDelhivery } = require("../services/delhiveryService");
const shipment = require("../models/shipment");

exports.bookShipment = async (req, res) => {
  try {
    const shipmentData = req.body;

    const payload = {
      shipment: [
        {
          name: shipmentData.customerName,
          add: shipmentData.address,
          pin: shipmentData.pinCode,
          city: shipmentData.city,
          state: shipmentData.state,
          country: "india",
          phone: shipmentData.phone,
          order: shipmentData.orderId,
          payment_mode: shipmentData.paymentMode,
        },
      ],
      pickup_location: {
        name: "KING NXT",
      },
    };

    const response = await axios.post(
      "https://track.delhivery.com/api/cmu/create/json",
      payload,
      {
        headers: {
          Authorization: `Token ${process.env.ICC_TOKEN}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    const waybill = response.data?.packages?.[0]?.waybill || "N/A";

    const savedShipment = await Shipment.create({
      ...shipmentData,
      waybill: waybill,

    });

    res.json({
      success: true,
      message: "Shipment Booked Successfully ✅",
      shipment: savedShipment,
      delhiveryResponse: response.data,
    });
  } catch (error) {
    console.log("Error:", error.response?.data || error.message);

    res.status(500).json({
      success: false,
      message: "Shipment Booking Failed ❌",
      error: error.response?.data || error.message,
    });
  }
};