const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const otpStore = {};

exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email required",
      });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Save OTP temporarily
    otpStore[email] = otp;

    // Send Email
    await resend.emails.send({
      from: "No-Reply@NXTShip.in",
      to: email,
      subject: "Your Login OTP",
      html: `<h2>Your OTP is: ${otp}</h2>`,
    });

    res.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
    });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (otpStore[email] == otp) {
      delete otpStore[email];

      return res.json({
        success: true,
        message: "OTP verified",
      });
    }

    res.status(400).json({
      success: false,
      message: "Invalid OTP",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};