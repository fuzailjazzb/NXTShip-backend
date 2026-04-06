const express = require("express");
const router = express.Router();

const ctrl = require("../controllers/catalogueController");
const auth = require("../middleware/authMiddleware");

console.log("📦 Catalogue Routes Loaded");

router.post("/", auth, (req, res, next) => {
  console.log("➡️ POST /api/catalogue");
  next();
}, ctrl.addProduct);

router.get("/", auth, (req, res, next) => {
  console.log("➡️ GET /api/catalogue");
  next();
}, ctrl.getProducts);

router.put("/:id", auth, (req, res, next) => {
  console.log("➡️ PUT /api/catalogue/:id", req.params.id);
  next();
}, ctrl.updateProduct);

router.delete("/:id", auth, (req, res, next) => {
  console.log("➡️ DELETE /api/catalogue/:id", req.params.id);
  next();
}, ctrl.deleteProduct);

module.exports = router;