const axios = require("axios");

module.exports = async function delhiveryLabel(shipment) {
  try {
    console.log("\n========== 🚀 DELHIVERY LABEL GENERATOR START ==========");

    /* =========================================
       🔍 INPUT CHECK
    ========================================= */
    console.log("📥 Incoming Shipment Object:", shipment);

    if (!shipment) {
      console.log("❌ ERROR: Shipment object is missing");
      throw new Error("Shipment object missing");
    }

    console.log("🆔 Shipment ID:", shipment._id);
    console.log("🚚 Courier:", shipment.courier);
    console.log("📦 Order ID:", shipment.orderId);
    console.log("📊 Full Shipment Keys:", Object.keys(shipment));

    /* =========================================
       ✅ AWB DETECTION
    ========================================= */
    console.log("\n🔎 Checking AWB...");
    const awb = shipment.waybill || shipment.awb;

    console.log("📌 shipment.waybill:", shipment.waybill);
    console.log("📌 shipment.awb:", shipment.awb);
    console.log("✅ Final AWB Used:", awb);

    if (!awb) {
      console.log("❌ ERROR: AWB missing");
      throw new Error("AWB missing");
    }

    /* =========================================
       🌐 DELHIVERY LABEL API CALL
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
       🧠 DATA EXTRACTION DEBUG
    ========================================= */
    console.log("\n🔍 Extracting Shipment Fields...");

    console.log("👤 Customer Name:", shipment.customerName);
    console.log("📞 Phone:", shipment.phone);
    console.log("🏠 Address:", shipment.address);
    console.log("🏙 City:", shipment.city);
    console.log("🌍 State:", shipment.state);
    console.log("📮 Pincode:", shipment.pincode);

    console.log("\n🏢 Warehouse Info:");
    console.log("Name:", shipment.warehouseName);
    console.log("Phone:", shipment.warehousePhone);
    console.log("Address:", shipment.warehouseAddress);
    console.log("City:", shipment.warehouseCity);
    console.log("State:", shipment.warehouseState);
    console.log("Pincode:", shipment.warehousePincode);

    console.log("\n📦 Product Info:");
    console.log("Name:", shipment.productName);
    console.log("Quantity:", shipment.quantity);
    console.log("Weight:", shipment.weight);
    console.log("Order Value:", shipment.orderValue);

    /* =========================================
       ✅ SAFE DATA STRUCTURE
    ========================================= */
    console.log("\n🛠 Building safeData object...");

    const safeData = {
      awb: awb,
      labelUrl: url,
      labelData: response.data,

      shipmentData: {
        orderId: shipment.orderId || null,
        paymentMode: shipment.paymentMode || null,
        status: shipment.status || null,
        courier: shipment.courier || null,

        delivery: {
          name: shipment.customerName || null,
          phone: shipment.phone || null,
          address: shipment.address || null,
          city: shipment.city || null,
          state: shipment.state || null,
          pincode: shipment.pincode || null,
        },

        pickup: {
          name: shipment.warehouseName || "Default Warehouse",
          phone: shipment.warehousePhone || null,
          address: shipment.warehouseAddress || null,
          city: shipment.warehouseCity || null,
          state: shipment.warehouseState || null,
          pincode: shipment.warehousePincode || null,
        },

        product: {
          name: shipment.productName || null,
          quantity: shipment.quantity || 1,
          weight: shipment.weight || null,
          orderValue: shipment.orderValue || null,
        },

        seller: {
          name: "KING NXT",
          gst: null,
        },
      },
    };

    /* =========================================
       📤 FINAL DEBUG OUTPUT
    ========================================= */
    console.log("\n📦 FINAL SAFE DATA (WITHOUT PDF):");

    console.log("AWB:", safeData.awb);
    console.log("OrderId:", safeData.shipmentData.orderId);
    console.log("Courier:", safeData.shipmentData.courier);

    console.log("\n🚚 Delivery:");
    console.log(safeData.shipmentData.delivery);

    console.log("\n🏢 Pickup:");
    console.log(safeData.shipmentData.pickup);

    console.log("\n📦 Product:");
    console.log(safeData.shipmentData.product);

    console.log("\n========== ✅ DELHIVERY LABEL SUCCESS ==========\n");

    return safeData;

  } catch (error) {
    console.log("\n❌❌❌ DELHIVERY LABEL ERROR ❌❌❌");

    if (error.response) {
      console.log("🌐 API Error Status:", error.response.status);
      console.log("📄 API Error Data:", error.response.data);
    } else {
      console.log("⚠️ Internal Error Message:", error.message);
    }

    console.log("==============================================\n");

    throw error;
  }
};