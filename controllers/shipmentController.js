const axios = require("axios");
const Shipment = require("../models/shipment");


// ✅ BOOK SHIPMENT (DELHIVERY FINAL)
exports.bookShipment = async (req, res) => {
  try {
    const shipmentData = req.body;

    // ✅ Extract Correct Fields (Delivery Side)
    const delivery = shipmentData.delivery;
    const product = shipmentData.product;

    if (!delivery?.customerName || !delivery?.phone) {
      return res.status(400).json({
        success: false,
        message: "Delivery details missing ❌",
      });
    }

    // ✅ Prevent Duplicate Order ID
    const existing = await Shipment.findOne({ orderId: shipmentData.orderId });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Order ID already exists ❌ Use unique Order ID",
      });
    }

    // ✅ Save Shipment First
    const savedShipment = await Shipment.create({
      orderId: shipmentData.orderId,

      customerName: delivery.customerName,
      phone: delivery.phone,
      address: delivery.address,
      city: delivery.city,
      state: delivery.state,
      pincode: delivery.pincode,

      paymentMode: shipmentData.paymentMode,
      orderValue: product.orderValue,
      weight: product.weight,

      status: "Pending",
    });

    // ✅ Delhivery API URL
    const url = "https://track.delhivery.com/api/cmu/create.json";

    // ✅ Correct Delhivery Payload (Form Encoded)
    const delhiveryPayload = {
      shipments: [
        {
          name: delivery.customerName,
          add: delivery.address,
          pin: delivery.pincode,
          city: delivery.city,
          state: delivery.state,
          country: "India",
          phone: delivery.phone,

          order: shipmentData.orderId,
          payment_mode: shipmentData.paymentMode,

          cod_amount:
            shipmentData.paymentMode === "COD"
              ? product.orderValue
              : 0,

          total_amount: product.orderValue,
          quantity: product.quantity || 1,
          weight: product.weight || 0.5,
        },
      ],

      // ✅ MUST BE STRING
      pickup_location: process.env.PICKUP_LOCATION || "KING NXT",
    };


    const body = new URLSearchParams();
    body.append("format", "json");
    body.append("data", JSON.stringify(delhiveryPayload));

    const response = await axios.post(url, body, {
      headers: {
        Authorization: `Token ${process.env.ICC_TOKEN}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    // ✅ Convert to x-www-form-urlencoded
   
    console.log("✅ DELHIVERY RESPONSE:", response.data);

    // ✅ Waybill Extract
    const waybill =
      response.data?.packages?.[0]?.waybill ||
      response.data?.packages?.waybill ||
      response.data?.waybill ||
      null;

    // ✅ Update Shipment
    savedShipment.waybill = waybill;
    savedShipment.status = waybill ? "Booked" : "Failed";
    await savedShipment.save();

    return res.json({
      success: true,
      message: waybill
        ? "Shipment Booked Successfully ✅"
        : "Shipment Created but Waybill Not Assigned ❌",

      waybill,
      shipment: savedShipment,
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