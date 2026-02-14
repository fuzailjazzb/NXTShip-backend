const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const adminRoutes = require("./routes/adminRoutes");
const shipmentRoutes = require("./routes/shipmentRoutes"); // ✅ Added
const Admin = require("./models/admin");
const PORT = process.env.PORT || 5000;

const app = express();
app.use(express.json());

// Routes
app.use("/api/admin", adminRoutes);
app.use("/api/shipment", shipmentRoutes); // ✅ Added

app.get("/", (req, res) => {
  res.send("Welcome to the Shipment Management API ,, Backend is live!");
});

app.use((req, res) => {
  res.status(404).send("Route Not Found: " + req.originalUrl);
});



const createDefaultAdmin = async () => {
  const adminExists = await Admin.findOne({
    email: process.env.ADMIN_EMAIL,
  });

  if (!adminExists) {
    await Admin.create({
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    });

    console.log("✅ Default Admin Created");
  } else {
    console.log("✅ Admin Already Exists");
  }
};

// createDefaultAdmin();
//to creating default admin we have to run this function once and then comment it out to avoid creating multiple admins with the same email.

// MongoDB Connect
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ DB Error:", err));



app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);