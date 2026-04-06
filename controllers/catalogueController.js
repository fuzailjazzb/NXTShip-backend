const Product = require("../models/product");

/* ================= ADD PRODUCT ================= */

exports.addProduct = async (req, res) => {

  try {

    console.log("========== 📦 ADD PRODUCT START ==========");

    console.log("📥 Request Body:", req.body);
    console.log("👤 User:", req.user);

    const userId = req.user.id;
    const data = req.body;

    console.log("🧠 Parsed Data:", data);

    const product = await Product.create({
      userId,
      ...data
    });

    console.log("✅ Product Created:", product);

    return res.json({
      success: true,
      product
    });

  } catch (err) {

    console.log("❌ ADD PRODUCT ERROR:", err.message);
    console.log("❌ STACK:", err.stack);

    return res.status(500).json({
      success: false
    });
  }
};


/* ================= GET PRODUCTS ================= */

exports.getProducts = async (req, res) => {

  try {

    console.log("========== 📦 GET PRODUCTS ==========");

    console.log("👤 User:", req.user);

    const userId = req.user.id;

    console.log("🔍 Fetching products for user:", userId);

    const products = await Product.find({ userId }).sort({ createdAt: -1 });

    console.log("📦 Products Found:", products.length);

    return res.json({
      success: true,
      products
    });

  } catch (err) {

    console.log("❌ GET PRODUCTS ERROR:", err.message);
    console.log("❌ STACK:", err.stack);

    return res.status(500).json({
      success: false
    });
  }
};


/* ================= DELETE ================= */

exports.deleteProduct = async (req, res) => {

  try {

    console.log("========== 🗑️ DELETE PRODUCT ==========");

    const { id } = req.params;

    console.log("🆔 Product ID:", id);

    await Product.findByIdAndDelete(id);

    console.log("✅ Product Deleted");

    return res.json({ success: true });

  } catch (err) {

    console.log("❌ DELETE ERROR:", err.message);
    console.log("❌ STACK:", err.stack);

    return res.status(500).json({ success: false });
  }
};


/* ================= UPDATE ================= */

exports.updateProduct = async (req, res) => {

  try {

    console.log("========== ✏️ UPDATE PRODUCT ==========");

    const { id } = req.params;

    console.log("🆔 Product ID:", id);
    console.log("📥 Update Data:", req.body);

    const updated = await Product.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    console.log("✅ Updated Product:", updated);

    return res.json({
      success: true,
      product: updated
    });

  } catch (err) {

    console.log("❌ UPDATE ERROR:", err.message);
    console.log("❌ STACK:", err.stack);

    return res.status(500).json({ success: false });
  }
};