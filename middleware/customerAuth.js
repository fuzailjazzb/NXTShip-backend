const jwt = require("jsonwebtoken");
const Customer = require("../models/customer");

exports.customerAuth = async (req, res, next) => {
  try {
    console.log("🔐 Customer Auth Middleware Hit...");

    // Token check
    const authHeader = req.headers.authorization;

    console.log("Raw Authorization Header:", authHeader);

    if (!authHeader) {
      console.log("❌ No TAuthorization Header");
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      console.log("❌ Bearer Missing");
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    console.log("✅ Token Received:", token);

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("✅ Token Decoded:", decoded);

    // Find customer from DB
    const customer = await Customer.findById(decoded.id).select("-password");

    console.log("DB Customer Found:", customer ? customer.email: "NOT FOUND");

    if (!customer) {
      console.log("❌ Customer not found in DB");
      return res.status(401).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Attach customer to request
    req.customer = customer;

    console.log("✅ Customer Authenticated Successfully:", customer.email);

    next();
  } catch (error) {
    console.log("❌ Auth Middleware Error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};