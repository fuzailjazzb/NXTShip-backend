const axios = require("axios");

module.exports = async function delhiveryLabel(shipment) {
  try {
    console.log("\n========== 🚀 DELHIVERY LABEL GENERATOR START ==========");

    /* =========================================
       ✅ BASIC VALIDATION
    ========================================= */
    if (!shipment) {
      throw new Error("❌ Shipment object missing");
    }

    console.log("📥 Incoming Shipment Object:", shipment);
    console.log("🆔 Shipment ID:", shipment._id);
    console.log("🚚 Courier:", shipment.courier);
    console.log("📦 Order ID:", shipment.orderId);

    console.log("📊 Full Shipment Keys:", Object.keys(shipment));

    /* =========================================
       ✅ AWB DETECTION
    ========================================= */
    console.log("\n🔎 Checking AWB...");
    console.log("📌 shipment.waybill:", shipment.waybill);
    console.log("📌 shipment.awb:", shipment.awb);

    const awb = shipment.waybill || shipment.awb;

    if (!awb) {
      throw new Error("❌ AWB missing in shipment");
    }

    console.log("✅ Final AWB Used:", awb);

    /* =========================================
       ✅ CALL DELHIVERY API
    ========================================= */
    const url = `https://track.delhivery.com/api/p/packing_slip?wbns=${awb}&pdf=true`;

    console.log("\n🌐 Calling Delhivery API...");
    console.log("🔗 URL:", url);

    const response = await axios.get(url, {
      headers: {
        Authorization: `Token ${process.env.DELHIVERY_TOKEN}`,
        "Content-Type": "application/json",
      },
      responseType: "arraybuffer",
    });

    console.log("✅ API RESPONSE RECEIVED");
    console.log("📊 Response Status:", response.status);
    console.log("📦 PDF Size (bytes):", response.data?.length);

    /* =========================================
       ✅ EXTRACT NESTED DATA (FIXED)
    ========================================= */

    console.log("\n🔍 Extracting Shipment Fields...");

    // DELIVERY
    const delivery = {
      name: shipment.delivery?.customerName || null,
      phone: shipment.delivery?.phone || null,
      address: shipment.delivery?.address || null,
      city: shipment.delivery?.city || null,
      state: shipment.delivery?.state || null,
      pincode: shipment.delivery?.pincode || null,
    };

    console.log("🚚 Delivery Data:", delivery);

    // PICKUP (WAREHOUSE)
    const pickup = {
      name: shipment.pickup?.name || "Default Warehouse",
      phone: shipment.pickup?.phone || null,
      address: shipment.pickup?.address || null,
      city: shipment.pickup?.city || null,
      state: shipment.pickup?.state || null,
      pincode: shipment.pickup?.pincode || null,
    };

    console.log("🏢 Pickup Data:", pickup);

    // PRODUCT
    const product = {
      name: shipment.product?.productName || null,
      quantity: shipment.product?.quantity || 1,
      weight: shipment.product?.weight || null,
      orderValue: shipment.product?.orderValue || null,
    };

    console.log("📦 Product Data:", product);

    /* =========================================
       ✅ FINAL SAFE DATA
    ========================================= */

    console.log("\n🛠 Building safeData object...");

    const safeData = {
      success: true,
      awb: awb,
      labelUrl: url,
      labelData: response.data,

      shipmentData: {
        orderId: shipment.orderId || null,
        paymentMode: shipment.paymentMode || null,
        status: shipment.status || null,
        courier: shipment.courier || null,

        delivery,
        pickup,
        product,

        seller: {
          name: "KING NXT",
          gst: null,
        },
      },
    };

    console.log("\n📦 FINAL SAFE DATA (WITHOUT PDF):");
    console.log("AWB:", safeData.awb);
    console.log("OrderId:", safeData.shipmentData.orderId);
    console.log("Courier:", safeData.shipmentData.courier);
    console.log("🚚 Delivery:", safeData.shipmentData.delivery);
    console.log("🏢 Pickup:", safeData.shipmentData.pickup);
    console.log("📦 Product:", safeData.shipmentData.product);

    console.log("\n========== ✅ DELHIVERY LABEL SUCCESS ==========");

    return safeData;

  } catch (error) {
    console.log("\n====== ❌ DELHIVERY LABEL ERROR ======");

    if (error.response) {
      console.log("📡 Delhivery API Error Status:", error.response.status);
      console.log("📡 Delhivery API Error Data:", error.response.data);
    } else {
      console.log("🔥 Internal Error:", error.message);
    }

    console.log("======================================\n");

    throw error;
  }
};