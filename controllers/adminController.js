const Admin = require("../models/Admin");
const jwt = require("jsonwebtoken");

// ✅ Generate Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};


// ✅ Admin Login
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find admin
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid Email or Password",
      });
    }

    // Match password
    const isMatch = await admin.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid Email or Password",
      });
    }

    res.json({
      success: true,
      message: "Admin Login Successful",
      token: generateToken(admin._id),
      admin: {
        id: admin._id,
        email: admin.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Login Failed",
      error: error.message,
    });
  }
};