const Customer = require("../models/customer");

// Get Wallet Balance

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


// Add Money to Wallet

exports.addFunds = async (req, res) => {
  try {
    console.log("Add Funds API hit.......");

    const customerId = req.customer.id;
    const { amount } = req.body;

    console.log("📌 Customer ID:", customerId);
    console.log("📌 Amount Recieved:", amount);

    if (!amount || amount <= 0) {
      console.log("❌ Invalid amount provided");
      return res.status(400).json({
        success: false,
        message: "Invalid amount. Must be greater than 0."
      });
    }

    const customer = await Customer.findById(customerId);

    if (!customer) {
      console.log("❌ Customer not found in add funds");

      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    // Update wallet balance

    customer.walletBalance += amount;

    // Save Trnsaction 

    customer.walletTransactions.unshift({
      amount,
      type: "credit",
      date: new Date(),
      message: "Added funds to wallet"
    });

    await customer.save();

    console.log("✅ Funds Added. New Balance:", customer.walletBalance);

    res.status(200).json({
      success: true,
      walletBalance: customer.walletBalance,
      message: `₹${amount} added to wallet successfully!`
    });

  } catch (err) {
    console.log("🔥 Add Funds Error:", err);

    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message
    });
  }
};

// Transaction History

exports.getWalletTransactions = async (req, res) => {
  try {
    console.log("Wallet Transactions API hit.......");

    const customerId = req.customer.id;
    console.log("📌 Customer ID:", customerId);

    const customer = await Customer.findById(customerId);

    if (!customer) {
      console.log("❌ Customer not found in transaction history");
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    console.log("✅ Wallet Transactions Fetched. Count:", customer.walletTransactions.length);

    res.status(200).json({
      success: true,
      transactions: customer.walletTransactions
    });

  } catch (err) {
    console.log("🔥 Wallet Transactions Error:", err);
    
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message
    });
  }
};