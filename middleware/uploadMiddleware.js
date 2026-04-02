const multer = require("multer");
const fs = require("fs");
const path = require("path");

/* =========================
   📁 CREATE FOLDER IF NOT EXISTS
========================== */

const uploadPath = path.join(__dirname, "../uploads/kyc");

if (!fs.existsSync(uploadPath)) {
  console.log("📁 Creating KYC upload folder...");
  fs.mkdirSync(uploadPath, { recursive: true });
}

/* =========================
   📦 STORAGE CONFIG
========================== */

const storage = multer.diskStorage({

  destination: function (req, file, cb) {

    console.log("📁 Upload destination:", uploadPath);

    cb(null, uploadPath);
  },

  filename: function (req, file, cb) {

    const filename = Date.now() + "-" + file.originalname;

    console.log("📄 Saving file as:", filename);

    cb(null, filename);
  }

});

/* =========================
   🚀 MULTER INIT
========================== */

const upload = multer({ storage });

module.exports = upload;
