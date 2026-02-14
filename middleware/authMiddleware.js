const jwt = require("jsonwebtoken");
const Admin = require("../models/admin");

// ✅ Protect Admin Routes
exports.protectAdmin = async (req, res, next) => {
  let token;

  // Token Header Check
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Extract Token
      token = req.headers.authorization.split(" ")[1];

      // Verify Token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find Admin
      req.admin = await Admin.findById(decoded.id).select("-password");

      if (!req.admin) {
        return res.status(401).json({
          success: false,
          message: "Admin not found",
        });
      }

      next(); // ✅ Allow Request
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Token Invalid",
      });
    }
  }

  // No Token
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "No Token, Unauthorized",
    });
  }
};