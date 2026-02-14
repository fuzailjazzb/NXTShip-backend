const express = require("express");
const router = express.Router();

const { loginAdmin } = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/login", loginAdmin);

router.get("/dashboard", authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: "Welcome Admin Dashboard 🚀",
    admin: req.admin
  });
});

module.exports = router;