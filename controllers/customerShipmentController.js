const shipment = require("../models/shipment");

exports.getCustomerShipments = async (req, res) => {
  try {
    const shipments = await shipment.find({ customerId: req.customer._id }).sort({ createdAt: -1 });

    res.json({ shipments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};