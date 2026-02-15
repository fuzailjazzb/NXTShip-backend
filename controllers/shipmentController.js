const axios = require("axios");

const Shipment = require("../models/shipment");
const { json } = require("express");

// ✅ BOOK SHIPMENT

exports.bookShipment = async (req, res) => {

  try {

    const shipmentData = req.body;

    // ✅ Step 1: Save Shipment in MongoDB First

    const savedShipment = await Shipment.create({

      ...shipmentData,

      status: "Pending",

    });

    // ✅ Step 2: Delhivery Payload

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

          shipment_width: "10",

          shipment_height: "10",

          weight: "1",

          shipping_mode: "Surface",

        },

      ],

      pickup_location: {

        name: process.env.PICKUP_NAME || "KING NXT",

      },

    };

    // ✅ Step 3: Delhivery API Call

    const url = "https://track.delhivery.com/api/cmu/create.json";

    const response = await axios.post(
      url,
      `format = json&data=${JSON.stringify(payload)}`,
      {

        headers: {

          Authorization: `Token${process.env.ICC_TOKEN}`,
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",

        },

}

    );

console.log("✅ DELHIVERY RESPONSE:", response.data);

// ✅ Step 4: Extract Waybill

const waybill =

  response.data?.packages?.[0]?.waybill ||

  response.data?.waybill ||

  "N/A";

// ✅ Step 5: Update Shipment in MongoDB

savedShipment.waybill = waybill;

savedShipment.status = "Booked";

await savedShipment.save();

// ✅ Final Response

res.json({

  success: true,

  message: "Shipment Booked Successfully ✅",

  waybill,

  shipment: savedShipment,

  delhiveryResponse: response.data,

});

  } catch (error) {

  console.log("❌ Booking Error:", error.response?.data || error.message);

  res.status(500).json({

    success: false,

    message: "Shipment Booking Failed ❌",

    error: error.response?.data || error.message,

  });

}

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