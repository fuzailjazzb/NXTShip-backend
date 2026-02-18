const Customer = require("../models/customer");

exports.getWalletBalance = async (req, res) => {
  try {
    console.log("📌 Wallet Request User:", req.customer);

    const customer = await Customer.findById(req.customer.id);

    if (!customer) {
      console.log("❌ Customer not found in wallet fetch");

      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    console.log("✅ Wallet Balance:", customer.walletBalance);

    res.status(200).json({
      success: true,
      balance: customer.walletBalance
    });

  } catch (err) {
    console.log("🔥 Wallet Error:", err);

    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message
    });
  }
};
