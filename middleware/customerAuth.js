const jwt = require("jsonwebtoken");
const Customer = require("../models/customer");

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) return res.status(401).json({ message: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.customer = await Customer.findById(decoded.id).select("-password");

    next();
    } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};