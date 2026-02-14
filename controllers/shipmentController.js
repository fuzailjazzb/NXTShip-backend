const axios = require("axios");
const Shipment = require("../models/shipment");

exports.bookShipment = async (req, res) => {
  try {
    const shipmentData = req.body;

    // ✅ Delhivery API Production URL
    const url = "https://track.delhivery.com/api/cmu/create.json";

    // ✅ Payload Format Required by Delhivery
    const payload = `format=json&data=${JSON.stringify({
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
          shipping_mode: "Surface"
        }
      ],
      pickup_location: {
        name: shipmentData.pickupLocation || "KING NXT"
      }
    })}`;

    // ✅ API Call
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Token ${process.env.ICC_TOKEN}`,
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      timeout: 20000
    });

    // ✅ Save Shipment to MongoDB
    const savedShipment = await Shipment.create({
      ...shipmentData,
      waybill: response.data?.packages?.[0]?.waybill || "Not Assigned"
    });

    res.json({
      success: true,
      message: "Shipment Booked Successfully ✅",
      delhiveryResponse: response.data,
      shipment: savedShipment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Shipment Booking Failed ❌",
      error: error.message
    });
  }
};