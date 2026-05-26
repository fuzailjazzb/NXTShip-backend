const Customer = require("../models/customer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);
global.otpStore = global.otpStore || {};


exports.signupCustomer = async (req, res) => {
  try {
    console.log("📩 Signup Body:", req.body);

    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields required"
      });
    }

    // Already exists check
    const existing = await Customer.findOne({ email });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Email already registered"
      });
    }

    const { referral } = req.body;

    let referredUser = null;

    if (referral) {
      referredUser = await Customer.findOne({
        referralCode: referral
      });
    }



    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // creating Referral code
    const referralCode = crypto.randomBytes(4).toString("hex");

    // Create customer
    const customer = await Customer.create({
      name,
      email,
      phone,
      password: hashedPassword,
      referralCode,
      referredBy: referredUser ? referredUser._id : null
    });

    // Generate Token
    const token = jwt.sign(
      { id: customer._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      message: "Signup Successful",
      token,
      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone
      }
    });

  } catch (err) {
    console.log("🔥 Signup Error:", err);

    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message
    });
  }
};


exports.loginCustomer = async (req, res) => {
  try {
    console.log("=======================================");
    console.log("✅ LOGIN API HIT");
    console.log("➡️ Request Body:", req.body);
    console.log("=======================================");

    const { email, password, otp } = req.body;

    // ✅ Check missing fields
    if (!email || !password) {
      console.log("❌ Missing Email or Password");

      return res.status(400).json({
        success: false,
        message: "Email and Password required",
      });
    }

    console.log("🔍 Searching customer in DB with email:", email);

    // ✅ Find Customer
    const customer = await Customer.findOne({ email });

    console.log("📌 Customer Found:", customer);

    if (!customer) {
      console.log("❌ Customer NOT Found in DB");

      return res.status(400).json({
        success: false,
        message: "Customer not found",
      });
    }

    // ✅ Password field check
    console.log("🔑 Customer Password Stored:", customer.password);

    if (!customer.password) {
      console.log("❌ Password missing inside DB record");

      return res.status(500).json({
        success: false,
        message: "Customer password missing in DB",
      });
    }

    // ✅ Compare Password
    console.log("🔁 Comparing Password...");

    const match = await bcrypt.compare(password, customer.password);

    console.log("✅ Password Match Result:", match);

    if (!match) {
      console.log("❌ Invalid Password Entered");

      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!otp) {

      // Generate OTP
      const generatedOtp = Math.floor(
        100000 + Math.random() * 900000
      );

      // Save OTP
      global.otpStore[email] = generatedOtp;

      // Send Email
      await resend.emails.send({
        from: "No-Reply@NXTShip.in",
        to: email,
        subject: "Your Login OTP",
        html: `
      <h2>Your OTP is:</h2>
      <h1>${generatedOtp}</h1>
    `,
      });

      return res.json({
        success: true,
        otpRequired: true,
        message: "OTP sent to email",
      });
    }


    if (global.otpStore[email] != otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Remove OTP after verification
    delete global.otpStore[email];


    // ✅ JWT Secret check
    console.log("🔐 JWT_SECRET Value:", process.env.JWT_SECRET);

    if (!process.env.JWT_SECRET) {
      console.log("❌ JWT_SECRET Missing in Render ENV");

      return res.status(500).json({
        success: false,
        message: "JWT_SECRET not set in Render environment",
      });
    }

    // ✅ Generate Token
    console.log("⚡ Generating Token...");

    const token = jwt.sign(
      { id: customer._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("✅ Token Generated Successfully:", token);

    // ✅ Success Response
    console.log("🎉 LOGIN SUCCESSFUL");
    console.log("=======================================");

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
    });
  } catch (err) {
    console.log("=======================================");
    console.error("🔥 LOGIN ERROR OCCURRED");
    console.error("Error Message:", err.message);
    console.error("Full Error:", err);
    console.log("=======================================");

    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};