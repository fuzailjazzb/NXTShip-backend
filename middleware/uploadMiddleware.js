const multer = require("multer");
 
/* =========================
   📦 STORAGE CONFIG
========================== */

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];  

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG, and JPG files are allowed."));
  }
};

/* =========================
   🚀 MULTER INIT
========================== */

const upload = multer({ 
  storage,
  limits: {fileSize: 2 * 1024 * 1024},
  fileFilter 
});

module.exports = upload;
