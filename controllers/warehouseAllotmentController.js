const WarehouseAllotment = require("../models/WarehouseAllotmentModel");
const Warehouse = require("../models/warehouse");
const Integration = require("../models/IntegrationModel");

/* ================= GET ================= */

exports.getAllotment = async (req, res) => {

  try {

    const userId = req.user.id;

    console.log("📥 Get Allotment for:", userId);

    let data = await WarehouseAllotment.findOne({ userId });

    if (!data) {
      data = await WarehouseAllotment.create({ userId });
    }

    const warehouses = await Warehouse.find({ userId });

    const integrations = await Integration.findOne({ userId });

    return res.json({
      success: true,
      data,
      warehouses,
      stores: integrations?.stores || []
    });

  } catch (err) {
    console.log("❌ GET ERROR:", err.message);
    res.status(500).json({ success: false });
  }
};

/* ================= SAVE DEFAULT ================= */

exports.saveDefaultWarehouse = async (req, res) => {

  try {

    const userId = req.user.id;
    const { warehouseId } = req.body;

    console.log("📦 Save Default:", warehouseId);

    const data = await WarehouseAllotment.findOneAndUpdate(
      { userId },
      { defaultWarehouseId: warehouseId },
      { upsert: true, new: true }
    );

    res.json({ success: true, data });

  } catch (err) {
    console.log("❌ SAVE DEFAULT:", err.message);
    res.status(500).json({ success: false });
  }
};

/* ================= STORE MAPPING ================= */

exports.saveStoreMapping = async (req, res) => {

  try {

    const userId = req.user.id;
    const { mappings } = req.body;

    console.log("🔗 Store Mapping:", mappings);

    const data = await WarehouseAllotment.findOneAndUpdate(
      { userId },
      { storeMapping: mappings },
      { upsert: true, new: true }
    );

    res.json({ success: true, data });

  } catch (err) {
    console.log("❌ STORE MAP ERROR:", err.message);
    res.status(500).json({ success: false });
  }
};

/* ================= AUTO TOGGLE ================= */

exports.saveAutoWarehouse = async (req, res) => {

  try {

    const userId = req.user.id;
    const { autoWarehouse } = req.body;

    console.log("🤖 Auto Warehouse:", autoWarehouse);

    const data = await WarehouseAllotment.findOneAndUpdate(
      { userId },
      { autoWarehouse },
      { upsert: true, new: true }
    );

    res.json({ success: true });

  } catch (err) {
    console.log("❌ AUTO ERROR:", err.message);
    res.status(500).json({ success: false });
  }
};

exports.testWarehouse = async (req, res) => {

  try {

    console.log("🧪 Testing warehouse allotment...");

    const userId = req.user.id;
    const { pincode } = req.body;

    console.log("🧪 Testing warehouse for:", pincode);

    const allotment = await WarehouseAllocation.findOne({ userId });
    const warehouses = await Warehouse.find({ userId });

    let selected = null;

    /* ================= AUTO LOGIC ================= */

    if (allotment?.autoWarehouse) {

      console.log("🤖 Auto ON");

      // 🔥 simple logic (future me improve karenge)
      selected = warehouses.find(w =>
        w.pincode.substring(0, 2) === pincode.substring(0, 2)
      );
    }

    /* ================= FALLBACK ================= */

    if (!selected && allotment?.defaultWarehouseId) {

      selected = warehouses.find(
        w => w._id.toString() === allotment.defaultWarehouseId
      );
    }

    console.log("🏭 Selected:", selected?.name);

    res.json({
      success: true,
      warehouse: selected
    });

  } catch (err) {

    console.log("❌ TEST ERROR:", err.message);

    res.status(500).json({ success: false });
  }
};