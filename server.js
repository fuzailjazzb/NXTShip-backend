const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const adminRoutes = require("./routes/adminRoutes");
const shipmentRoutes = require("./routes/shipmentRoutes");

const app = express();
app.use(express.json());

app.use(cors({
  origin: "*"
}));

// Routes
app.get("/", (req, res) => {
  res.send("Welcome to the Shipment Tracking API 🚀");
});
app.use("/api/admin", adminRoutes);
app.use("/api/shipment", shipmentRoutes);

// MongoDB Connect
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("Mongo Error:", err));

app.listen(5000, () => {
  console.log("🚀 Backend Running on Port 5000");
});