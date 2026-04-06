const express = require("express");
const router = express.Router();

const ctrl = require("../controllers/returnQcController");
const auth = require("../middleware/authMiddleware");

console.log("📦 RQC Routes Loaded");

router.post("/", auth, (req,res,next)=>{
  console.log("➡️ POST /api/rqc");
  next();
}, ctrl.createReturn);

router.get("/", auth, (req,res,next)=>{
  console.log("➡️ GET /api/rqc");
  next();
}, ctrl.getReturns);

router.put("/:id", auth, (req,res,next)=>{
  console.log("➡️ PUT /api/rqc/:id", req.params.id);
  next();
}, ctrl.updateQc);

module.exports = router;