const jwt = require("jsonwebtoken");


exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ Only One Admin Allowed (ENV)
    if (
      email !== process.env.ADMIN_EMAIL ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid Admin Credentials ❌"
      });
    }

    // ✅ JWT Token Generate
    const token = jwt.sign(
      { email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Admin Login Successful ✅",
      token
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Login Failed",
      error: error.message
    });
  }
};