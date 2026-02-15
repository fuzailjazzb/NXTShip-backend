const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // ✅ Check header exists
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "No Token Provided ❌",
      });
    }

    // ✅ Check correct format
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Token must be Bearer format ❌",
      });
    }

    // ✅ Extract token
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token Missing ❌",
      });
    }

    // ✅ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.admin = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or Expired Token ❌",
    });
  }
};

module.exports = authMiddleware;