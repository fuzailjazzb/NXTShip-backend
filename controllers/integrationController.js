const crypto = require("crypto");
const IntegrationModel = require("../models/IntegrationModel");

/* =====================================================
   🛒 CONNECT STORE
===================================================== */
exports.connectStore = async (req, res) => {
  try {

    console.log("========== 🛒 CONNECT STORE ==========");

    const userId = req.user.id;
    const { storeUrl, key, secret } = req.body;

    console.log("📥 Incoming:", { storeUrl, key, secret });

    if (!storeUrl || !key || !secret) {
      return res.status(400).json({
        success: false,
        message: "All fields required"
      });
    }

    const storeData = {
      type: "woocommerce",
      url: storeUrl,
      key,
      secret
    };

    let data = await IntegrationModel.findOne({ userId });

    if (!data) {
      console.log("🆕 Creating new integration doc");
      data = new IntegrationModel({ userId, stores: [storeData] });
    } else {
      console.log("🔄 Updating store");
      data.stores.push(storeData);
    }

    await data.save();

    console.log("✅ Store saved");

    return res.json({
      success: true,
      message: "Store connected successfully"
    });

  } catch (err) {
    console.log("❌ STORE ERROR:", err.message);

    return res.status(500).json({
      success: false,
      message: "Store connection failed"
    });
  }
};

exports.deleteStore = async (req, res) => {
  const userId = req.user.id;
  const index = req.params.index;

  const data = await IntegrationModel.findOne({ userId });

  data.stores.splice(index, 1);
  await data.save();

  res.json({ success: true });
};

exports.toggleAutoSync = async (req, res) => {
  const { index, value } = req.body;
  const userId = req.user.id;

  const data = await IntegrationModel.findOne({ userId });

  data.stores[index].autoSync = value;
  await data.save();

  res.json({ success: true });
};

/* =====================================================
   🔄 SYNC ORDERS
===================================================== */
exports.syncOrders = async (req, res) => {
  try {

    console.log("========== 🔄 SYNC ORDERS ==========");

    const userId = req.user.id;

    // 👉 future: Woo API call
    console.log("📡 Fetching orders from Woo...");

    // dummy count
    const ordersFetched = 5;

    await IntegrationModel.findOneAndUpdate(
      { userId },
      { $inc: { "analytics.orders": ordersFetched } }
    );

    console.log("✅ Orders synced:", ordersFetched);

    return res.json({
      success: true,
      message: "Orders synced",
      count: ordersFetched
    });

  } catch (err) {
    console.log("❌ SYNC ERROR:", err.message);

    return res.status(500).json({
      success: false,
      message: "Sync failed"
    });
  }
};


/* =====================================================
   🚚 SAVE COURIER SETTINGS
===================================================== */
exports.saveCourierSettings = async (req, res) => {
  try {

    console.log("========== 🚚 COURIER SETTINGS ==========");

    const userId = req.user.id;
    const settings = req.body;

    console.log("📥 Settings:", settings);

    await IntegrationModel.findOneAndUpdate(
      { userId },
      { couriers: settings },
      { upsert: true }
    );

    console.log("✅ Courier settings saved");

    return res.json({
      success: true,
      message: "Courier settings saved"
    });

  } catch (err) {
    console.log("❌ COURIER ERROR:", err.message);

    return res.status(500).json({
      success: false,
      message: "Failed"
    });
  }
};


/* =====================================================
   🔐 GENERATE API KEY
===================================================== */
exports.generateApiKey = async (req, res) => {
  try {

    console.log("========== 🔐 GENERATE API KEY ==========");

    const userId = req.user.id;

    const apiKey = crypto.randomBytes(16).toString("hex");

    await IntegrationModel.findOneAndUpdate(
      { userId },
      { apiKey },
      { upsert: true }
    );

    console.log("✅ API Key:", apiKey);

    return res.json({
      success: true,
      key: apiKey
    });

  } catch (err) {
    console.log("❌ API KEY ERROR:", err.message);

    return res.status(500).json({
      success: false,
      message: "Failed"
    });
  }
};


/* =====================================================
   ⚙️ SAVE AUTOMATION
===================================================== */
exports.saveAutomation = async (req, res) => {
  try {

    console.log("========== ⚙️ AUTOMATION ==========");

    const userId = req.user.id;
    const settings = req.body;

    console.log("📥 Automation:", settings);

    await IntegrationModel.findOneAndUpdate(
      { userId },
      { automation: settings },
      { upsert: true }
    );

    console.log("✅ Automation saved");

    return res.json({
      success: true,
      message: "Saved"
    });

  } catch (err) {
    console.log("❌ AUTOMATION ERROR:", err.message);

    return res.status(500).json({
      success: false,
      message: "Failed"
    });
  }
};


/* =====================================================
   🔁 RETRY FAILED ORDERS
===================================================== */
exports.retryFailedOrders = async (req, res) => {
  try {

    console.log("========== 🔁 RETRY FAILED ==========");

    const userId = req.user.id;

    // 👉 future: retry logic
    console.log("♻️ Retrying failed orders...");

    return res.json({
      success: true,
      message: "Retry triggered"
    });

  } catch (err) {
    console.log("❌ RETRY ERROR:", err.message);

    return res.status(500).json({
      success: false,
      message: "Failed"
    });
  }
};


/* =====================================================
   📊 GET INTEGRATION DATA
===================================================== */
exports.getIntegrationData = async (req, res) => {
  try {

    console.log("========== 📊 GET DATA ==========");

    const userId = req.user.id;

    const data = await IntegrationModel.findOne({ userId });

    console.log("📦 Data:", data);

    return res.json({
      success: true,
      orders: data?.analytics?.orders || 0,
      shipments: data?.analytics?.shipments || 0,
      data
    });

  } catch (err) {
    console.log("❌ GET ERROR:", err.message);

    return res.status(500).json({
      success: false,
      message: "Failed"
    });
  }
};