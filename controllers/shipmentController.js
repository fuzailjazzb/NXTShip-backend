const axios = require("axios");
const Shipment = require("../models/shipment");

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

