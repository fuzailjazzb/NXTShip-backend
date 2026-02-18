const Customer = require("../models/customer");

exports.getWalletBalance = async (req, res) => {
  try {
    console.log("Wallet Balance API hit.......");
  
    const customerId = req.customer.id;
    console.log("📌 Customer ID:", customerId);

    const customer = await Customer.findById(customerId);

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
      walletBalance: customer.walletBalance,
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
