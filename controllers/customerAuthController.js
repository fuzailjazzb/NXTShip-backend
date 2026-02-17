const Customer = require("../models/customer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.signupCustomer = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existing = await Customer.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Customer already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const customer = await Customer.create({
      name,
      email,
      password: hashedPassword,
    });

    res.json({
      message: "Signup successful",
      customer,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;

    const customer = await Customer.findOne({ email });
    if (!customer)
      return res.status(400).json({ message: "Customer not found" });

    const match = await bcrypt.compare(password, customer.password);
    if (!match)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: customer._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};