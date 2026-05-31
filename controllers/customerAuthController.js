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

      // User ka naam fetch karna (fallback to 'User' if name is missing)
      const userName = customer.name || "User";

      // Send Email
      await resend.emails.send({
  from: "No-Reply@nxtship.in",
  reply_to: "support@nxtship.in",
  to: email,
  subject: "Your NXTShips Login Verification Code",
  text: `Hello ${userName},\n\nWe received a request to access your NXTShips account. Please use the verification code below to securely log in to your dashboard:\n\nOTP: ${generatedOtp}\n\nThis code is valid for the next 10 minutes. For your security, please do not share this OTP with anyone.\n\nIf you did not initiate this request, you can safely ignore this email or contact our support team.\n\n---\nNeed help? Contact us at support@nxtship.in\n© 2026 NXTShips.in. All rights reserved.`,
  html: `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #eaeaea; border-radius: 10px; background-color: #ffffff;">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #f0f0f0;">
        <h2 style="color: #0056b3; margin: 0; font-size: 28px;">NXTShips.in</h2>
        <p style="color: #888888; margin: 5px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Courier Management Software</p>
      </div>
      <div style="padding: 30px 0;">
        <p style="font-size: 16px; color: #333333; margin-bottom: 20px;">Hello,</p>
        <p style="font-size: 16px; color: #444444; line-height: 1.6;">We received a request to access your <strong>NXTShips</strong> account. Please use the verification code below to securely log in to your dashboard:</p>
        <div style="text-align: center; margin: 35px 0;">
          <span style="display: inline-block; font-size: 36px; font-weight: bold; color: #1a1a1a; padding: 15px 30px; background-color: #f8f9fa; border: 1px solid #e2e8f0; border-radius: 8px; letter-spacing: 6px;">
            ${generatedOtp}
          </span>
        </div>
        <p style="font-size: 15px; color: #555555;">This code is valid for the next <strong>10 minutes</strong>. For your security, <strong>please do not share this OTP with anyone</strong>.</p>
        <p style="font-size: 14px; color: #777777; margin-top: 25px;">If you did not initiate this request, you can safely ignore this email or contact our support team.</p>
      </div>
      <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eaeaea; font-size: 13px; color: #999999;">
        <p style="margin-bottom: 5px;">Need help? Contact us at <a href="mailto:support@nxtships.in" style="color: #0056b3; text-decoration: none;">support@nxtships.in</a></p>
        <p style="margin: 0;">&copy; 2026 NXTShips.in. All rights reserved.</p>
      </div>
    </div>
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