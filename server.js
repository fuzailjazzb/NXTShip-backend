const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const adminRoutes = require("./routes/adminRoutes");
const shipmentRoutes = require("./routes/shipmentRoutes");
const customerRoutes = require("./routes/customerRoutes");
const supportRoutes = require("./routes/supportRoutes");

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
app.use("/api/customer", customerRoutes);
app.use("/api/customers", require("./routes/customerRoutes"));
app.use("/api/customer/auth", require("./routes/customerAuthRoutes"));
app.use("/api/customer/shipment", require("./routes/customerShipmentRoutes"));
app.use("/api/wallet", require("./routes/walletRoutes"));
app.use("/api/add-funds", require("./routes/walletRoutes"));
app.use("/api/support", supportRoutes);
app.use("/api/customer", require("./routes/reportRoutes"));
app.use("/api/resources", require("./routes/resourceRoutes"));






// MongoDB Connect
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("Mongo Error:", err));

app.listen(process.env.PORT || 5000, () => {
  console.log("🚀 Backend Running on Port 5000");
});