const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const adminRoutes = require("./routes/adminRoutes");
const shipmentRoutes = require("./routes/shipmentRoutes");
const customerRoutes = require("./routes/customerRoutes");
const supportRoutes = require("./routes/supportRoutes");
const customerBookingRoutes = require("./routes/customerBookingRoutes");
const walletRoutes = require("./routes/walletRoutes");

const app = express();
app.use(express.json());

app.use(cors({
  origin: "*"
}));

// Routes

app.use((req, res, next) => {
  console.log("========================================================================");
  console.log("Incoming Request");
  console.log("Method:", req.method);
  console.log("URL:", req.originalUrl);
  console.log("Headers Authorization:", req.headers.authorization);
  console.log("Time:", new Date().toISOString());
  console.log("========================================================================");

  next();
})

app.get("/", (req, res) => {
  res.send("Welcome to the Shipment Tracking API 🚀");
});
app.use("/api/admin", adminRoutes);
app.use("/api/shipment", shipmentRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/customers", require("./routes/customerRoutes"));
app.use("/api/customer/auth", require("./routes/customerAuthRoutes"));
app.use("/api/customer/shipment", require("./routes/customerShipmentRoutes"));
app.use("/api/wallet", walletRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/customer", require("./routes/reportRoutes"));
app.use("/api/resources", require("./routes/resourceRoutes"));
app.use("/api/rate", require("./routes/rateRoutes"));
app.use("/api/customer/shipment", require("./routes/customerBookingRoutes"));
app.use("/api/commission", require("./routes/commissionRoutes"));
app.use("/api/customer", require("./routes/customerTrackingRoutes"));




// MongoDB Connect
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("Mongo Error:", err));

app.listen(process.env.PORT || 5000, () => {
  console.log("🚀 Backend Running on Port 5000");
});