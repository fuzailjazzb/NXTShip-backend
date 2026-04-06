const ReturnQc = require("../models/ReturnQc");

/* ================= CREATE RETURN ================= */

exports.createReturn = async (req, res) => {

  try {

    console.log("========== 📦 CREATE RETURN ==========");

    console.log("📥 Body:", req.body);

    const userId = req.user.id;

    const data = await ReturnQc.create({
      userId,
      ...req.body
    });

    console.log("✅ Return Created:", data);

    res.json({ success: true, data });

  } catch (err) {
    console.log("❌ CREATE RETURN ERROR:", err.message);
    res.status(500).json({ success: false });
  }
};


/* ================= GET RETURNS ================= */

exports.getReturns = async (req, res) => {

  try {

    console.log("========== 📥 GET RETURNS ==========");

    const userId = req.user.id;

    const data = await ReturnQc.find({ userId }).sort({ createdAt: -1 });

    console.log("📦 Returns Found:", data.length);

    res.json({ success: true, data });

  } catch (err) {
    console.log("❌ FETCH ERROR:", err.message);
    res.status(500).json({ success: false });
  }
};


/* ================= UPDATE QC ================= */

exports.updateQc = async (req, res) => {

  try {

    console.log("========== 🔬 UPDATE QC ==========");

    const { id } = req.params;

    console.log("🆔 ID:", id);
    console.log("📥 QC Data:", req.body);

    const updated = await ReturnQc.findByIdAndUpdate(
      id,
      { qc: req.body.qc, status: req.body.status },
      { new: true }
    );

    console.log("✅ QC Updated:", updated);

    res.json({ success: true, data: updated });

  } catch (err) {
    console.log("❌ QC UPDATE ERROR:", err.message);
    res.status(500).json({ success: false });
  }
};