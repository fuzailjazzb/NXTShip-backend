const Webhook = require("../models/webhookModel");

/* ================= WEBHOOK RECEIVER ================= */

exports.handleWebhook = async (req, res) => {

  try {

    console.log("========== 🚀 WEBHOOK RECEIVED ==========");
    console.log("📦 BODY:", JSON.stringify(req.body));

    /* ================= IDENTIFY PLATFORM ================= */

    const isShopify = req.headers["x-shopify-topic"];
    const isWoo = req.body?.id && req.body?.billing;

    let event = "unknown";
    let orderData = {};

    /* ================= SHOPIFY ================= */

    if (isShopify) {

      event = req.headers["x-shopify-topic"];

      orderData = {
        orderId: req.body.id,
        name: req.body.shipping_address?.name,
        phone: req.body.shipping_address?.phone || "9999999999",
        address: req.body.shipping_address?.address1,
        city: req.body.shipping_address?.city,
        state: req.body.shipping_address?.province,
        pincode: req.body.shipping_address?.zip,
        paymentType: req.body.financial_status === "paid" ? "Pre-paid" : "COD",
        items: req.body.line_items
      };

      console.log("🛒 Shopify Order Parsed:", orderData);
    }

    /* ================= WOOCOMMERCE ================= */

    else if (isWoo) {

      event = "woocommerce_order";

      orderData = {
        orderId: req.body.id,
        name: req.body.billing.first_name + " " + req.body.billing.last_name,
        phone: req.body.billing.phone,
        address: req.body.billing.address_1,
        city: req.body.billing.city,
        state: req.body.billing.state,
        pincode: req.body.billing.postcode,
        paymentType: req.body.payment_method === "cod" ? "COD" : "Pre-paid",
        items: req.body.line_items
      };

      console.log("🛒 Woo Order Parsed:", orderData);
    }

    else {
      console.log("❌ Unknown webhook source");
      return res.sendStatus(400);
    }

    /* ================= GET USER ================= */

    const userId = req.query.userId; // 👈 IMPORTANT (store webhook URL me bhejenge)

    console.log("👤 UserId:", userId);

    const webhook = await Webhook.findOne({ userId });

    if (!webhook) {
      console.log("⚠️ No webhook config found");
    }

    /* ================= AUTO SHIPMENT ================= */

    if (webhook?.actions?.autoShip) {

      console.log("🚀 Auto Shipment Started");

      const shipmentPayload = {
        customerName: orderData.name,
        address: orderData.address,
        city: orderData.city,
        state: orderData.state,
        pincode: orderData.pincode,
        phone: orderData.phone,
        paymentType: orderData.paymentType,
        weight: 0.5 // default
      };

      console.log("📦 Shipment Payload:", shipmentPayload);

      /* ================= COURIER ASSIGN ================= */

      let selectedCourier = "shipfast"; // default

      if (webhook?.actions?.autoAssign) {
        console.log("🤖 Auto assigning courier...");
        selectedCourier = "shipfast";
      }

      /* ================= CALL YOUR EXISTING BOOKING ================= */

      console.log("📡 Calling shipment API...");

      // 👉 yaha tu apna existing booking function call karega
      // Example dummy:

      const shipmentResponse = {
        success: true,
        trackingId: "TRK" + Date.now()
      };

      console.log("✅ Shipment Created:", shipmentResponse);

      /* ================= SAVE LOG ================= */

      await Webhook.updateOne(
        { userId },
        {
          $push: {
            logs: {
              event,
              status: "success",
              message: `Shipment Created: ${shipmentResponse.trackingId}`
            }
          }
        }
      );
    }

    else {
      console.log("⚠️ AutoShip disabled");
    }

    res.sendStatus(200);

  } catch (err) {

    console.log("❌ WEBHOOK ERROR:", err.message);

    await Webhook.updateOne(
      {},
      {
        $push: {
          logs: {
            event: "error",
            status: "failed",
            message: err.message
          }
        }
      }
    );

    res.sendStatus(500);
  }
};