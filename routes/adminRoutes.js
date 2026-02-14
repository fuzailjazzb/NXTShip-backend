const express = require("express");
const router = express.Router();

const {
  loginAdmin,
} = require("../controllers/adminController");

const { protectAdmin } = require("../middleware/authMiddleware");

// ✅ Login Route
router.post("/login", loginAdmin);

// ✅ Protected Dashboard Route
router.get("/dashboard", protectAdmin, (req, res) => {
  res.json({
    success: true,
    message: "Welcome Admin Dashboard",
    admin: req.admin,
  });
});

module.exports = router;