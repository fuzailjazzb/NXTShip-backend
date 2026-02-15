const axios = require("axios");
const Shipment = require("../models/shipment");


// ✅ BOOK SHIPMENT (DELHIVERY FINAL)
exports.bookShipment = async (req, res) => {
  try {
    const shipmentData = req.body;
    const delivery = shipmentData.delivery;
    const product = shipmentData.product;

    // ✅ Delhivery API URL
    const url = "https://track.delhivery.com/api/cmu/create.json";

    // ✅ EXACT payload as documentation
    const payload = {
      pickup_location: {
        name: process.env.PICKUP_LOCATION || "KING NXT",
      },

      shipments: [
        {
          order: shipmentData.orderId,

          name: delivery.customerName,
          add: delivery.address,
          city: delivery.city,
          state: delivery.state,
          country: "India",
          pin: delivery.pincode,
          phone: delivery.phone,

          payment_mode: shipmentData.paymentMode,

          total_amount: product.orderValue,
          cod_amount:
            shipmentData.paymentMode === "COD"
              ? product.orderValue
              : 0,

          weight: product.weight || 0.5,
          quantity: product.quantity || 1,

          products_desc: product.productName || "NXTShip Product",
        },
      ],
    };

    // ✅ Call Delhivery with JSON
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Token ${process.env.ICC_TOKEN}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    console.log("✅ DELHIVERY RESPONSE:", response.data);

    // ✅ Waybill extract
    const waybill =
      response.data?.packages?.[0]?.waybill || null;

    return res.json({
      success: true,
      waybill,
      delhiveryResponse: response.data,
    });
  } catch (error) {
    console.log("❌ Booking Error:", error.response?.data || error.message);

    return res.status(500).json({
      success: false,
      message: "Delhivery Booking Failed ❌",
      error: error.response?.data || error.message,
    });
  }
};

// ✅ GET ALL SHIPMENTS (Dashboard)
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
        Authorization: `Token ${process.env.ICC_TOKEN}`,
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