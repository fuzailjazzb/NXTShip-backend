const express = require("express");
const router = express.Router();

const upload = require("../middleware/uploadMiddleware");
const { submitKyc } = require("../controllers/kycController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/submit", authMiddleware, upload.single("document"), submitKyc);

module.exports = router;