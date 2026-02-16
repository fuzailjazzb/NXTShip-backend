const axios = require("axios");
const Shipment = require("../models/shipment");

/**
 * ✅ BOOK SHIPMENT (DELHIVERY FINAL SIMPLE)
 * Frontend से direct fields आएंगे:
 * customerName, phone, address, city, state, pincode, orderId, paymentMode
 */
exports.bookShipment = async (req, res) => {
  try {

    const lastShipment = await Shipment.findOne().sort({ orderNumber: -1 });

    const lastNumber = lastShipment?.orderNumber || 0;
    const nextOrderNumber = Number(lastNumber) + 1;

    const newOrderId = `ORD-${new Date().getFullYear()}-${String(nextOrderNumber).padStart(5, "0")}`;


    const shipmentData = req.body;
    shipmentData.orderId = newOrderId; // Ensure unique order ID is generated on the server side

    // ✅ 1. Basic Validation
    if (
      !shipmentData.customerName ||
      !shipmentData.phone ||
      !shipmentData.address ||
      !shipmentData.pincode 
    ) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing ❌",
      });
    }

    // ✅ 2. Prevent Duplicate Order ID
    const existing = await Shipment.findOne({
      orderId: shipmentData.orderId,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Order ID already exists ❌ Use unique Order ID",
      });
    }

    // ✅ 3. Save Shipment First (Pending)
    const savedShipment = await Shipment.create({
      customerName: shipmentData.customerName,
      phone: shipmentData.phone,
      address: shipmentData.address,
      city: shipmentData.city,
      state: shipmentData.state,
      pincode: shipmentData.pincode,

      orderId: shipmentData.orderId,
      orderNumber: nextOrderNumber,
      paymentMode: shipmentData.paymentMode,

      orderValue: shipmentData.orderValue || 0,
      weight: shipmentData.weight || 0.5,

      status: "Pending",
    });

    // ✅ 4. Delhivery Token Check
    if (!process.env.ICC_TOKEN) {
      return res.status(500).json({
        success: false,
        message: "ICC_TOKEN missing in Render ENV ❌",
      });
    }

    // ✅ 5. Delhivery Booking API
    const url = "https://track.delhivery.com/api/cmu/create.json";

    // ✅ Delhivery expects x-www-form-urlencoded
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

            // COD जरूरी है
            cod_amount:
              shipmentData.paymentMode === "COD"
                ? shipmentData.orderValue
                : 0,

            total_amount: shipmentData.orderValue || 0,
            quantity: 1,
            weight: shipmentData.weight || 0.5,
          },
        ],

        pickup_location: {
          name: process.env.PICKUP_LOCATION || "KING NXT",
        },
      });

    // ✅ 6. Call Delhivery
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Token ${process.env.ICC_TOKEN}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    console.log("✅ DELHIVERY RESPONSE:", response.data);

    // ✅ 7. Extract Waybill Properly
    const waybill =
      response.data?.packages?.[0]?.waybill ||
      response.data?.packages?.waybill ||
      null;

    // ✅ 8. Update Shipment in DB
    savedShipment.waybill = waybill;
    savedShipment.status = waybill ? "Booked" : "Failed";
    await savedShipment.save();

    // ✅ 9. Final Response
    return res.json({
      success: true,
      message: waybill
        ? "Shipment Booked Successfully ✅"
        : "Shipment Created but Waybill Not Assigned ❌",

      waybill,
      orderId: shipmentData.orderId,
      shipment: savedShipment,
      delhiveryResponse: response.data,
    });
  } catch (error) {
    console.log("❌ Booking Error:", error.response?.data || error.message);

    return res.status(500).json({
      success: false,
      message: "Shipment Booking Failed ❌",
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
    const waybill = req.params.waybill;

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

    // ✅ Step 1: Shipment find करो
    const shipment = await Shipment.findById(shipmentId);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found ❌",
      });
    }

    // ✅ Step 2: Waybill जरूरी है
    if (!shipment.waybill || shipment.waybill === "Not Assigned") {
      return res.status(400).json({
        success: false,
        message: "Waybill not assigned, cannot cancel ❌",
      });
    }

    // ✅ Step 3: Delhivery Cancel API URL
    const url = "https://track.delhivery.com/api/p/edit";

    // ✅ Step 4: Payload (waybill cancel)
    const body = new URLSearchParams();
    body.append(
      "cancellation",
      JSON.stringify({
        waybill: shipment.waybill,
        cancel: true,
      })
    );

    // ✅ Step 5: Call Delhivery Cancel API
    const response = await axios.post(url, body.toString(), {
      headers: {
        Authorization: `Token ${process.env.ICC_TOKEN}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    console.log("✅ DELHIVERY CANCEL RESPONSE:", response.data);

    // ✅ Step 6: Check Response
    if (response.data?.success === false) {
      return res.status(400).json({
        success: false,
        message: "Delhivery Cancel Failed ❌",
        delhiveryResponse: response.data,
      });
    }

    // ✅ Step 7: Update DB Status
    shipment.status = "Cancelled";
    await shipment.save();

    return res.json({
      success: true,
      message: "Shipment Cancelled Successfully ✅",
      shipment,
      delhiveryResponse: response.data,
    });

  } catch (error) {
    console.log("❌ Cancel Error:", error.response?.data || error.message);

    return res.status(500).json({
      success: false,
      message: "Cancel Failed ❌",
      error: error.response?.data || error.message,
    });
  }
};