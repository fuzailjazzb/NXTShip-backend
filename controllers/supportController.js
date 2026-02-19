const SupportTicket = require("../models/SupportTickets");

console.log("✅ Support Controller Loaded...");

/**
* CREATE NEW SUPPORT TICKET
*/
exports.createTicket = async (req, res) => {
  try {
    console.log("🎫 Create Ticket API hit...");

    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Subject and Message are required",
      });
    }

    const ticket = await SupportTicket.create({
      customerId: req.customer._id,
      subject,
      message,
    });

    console.log("✅ Ticket Created:", ticket);

    res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      ticket,
    });
  } catch (error) {
    console.error("❌ Ticket Creation Error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

/**
* GET ALL TICKETS OF LOGGED IN CUSTOMER
*/
exports.getMyTickets = async (req, res) => {
  try {
    console.log("📌 Fetch Tickets API hit...");

    const tickets = await SupportTicket.find({
      customerId: req.customer._id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: tickets.length,
      tickets,
    });
  } catch (error) {
    console.error("❌ Fetch Tickets Error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};


