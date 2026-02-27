const Customer = require("../models/customer");
const crypto = require("crypto");
const razorpay = require("../config/razorpay");

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
    const amount = Number(req.body.amount);

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

    customer.walletBalance = (customer.walletBalance || 0) + amount;

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

exports.createRazorpayOrder = async (req, res) => {
  try {
    console.log("💳 Create Razorpay Order API hit");

    const amount = Number(req.body.amount);

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount"
      });
    }

    const options = {
      amount: amount * 100, // paisa
      currency: "INR",
      receipt: "wallet_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    console.log("✅ Razorpay Order Created:", order.id);

    res.status(200).json({
      success: true,
      order
    });

  } catch (err) {
    console.log("🔥 Razorpay Order Error:", err);
    res.status(500).json({ success:false });
  }
};



exports.verifyPaymentAndAddFunds = async (req, res) => {
  try {
    console.log("✅ Payment Verification API hit");

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount
    } = req.body;

    const body =
      razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.log("❌ Signature mismatch");
      return res.status(400).json({
        success:false,
        message:"Payment verification failed"
      });
    }

    const customer = await Customer.findById(req.customer.id);

    customer.walletBalance += Number(amount);

    customer.walletTransactions.unshift({
      amount,
      type: "credit",
      message: "Added via Razorpay",
      date: new Date(),
    });

    await customer.save();

    console.log("💰 Wallet Updated:", customer.walletBalance);

    res.json({
      success:true,
      walletBalance: customer.walletBalance
    });

  } catch (err) {
    console.log("🔥 Verify Payment Error:", err);
    res.status(500).json({ success:false });
  }
};