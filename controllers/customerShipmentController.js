const shipment = require("../models/shipment");

exports.getCustomerShipments = async (req, res) => {
  try {

    console.log(" type of customer id:", typeof req.customer._id);

    console.log("Get Shipments API hit for customer:", req.customer._id);

    const shipments = await shipment.find({ customerId: req.customer._id }).sort({ createdAt: -1 });

    console.log(`Found ${shipments.length} shipments for customer ${req.customer._id}`);

      res.status(200).json({
        success: true,
        total: shipments.length,
        shipments,
      }); 
  } catch (error) {
    console.log("Error fetching shipments for customer:", error.message);

    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  } 
};

console.log("customer shipment controller:", exports);
console.log("getCustomerShipments function:", exports.getCustomerShipments);
console.log("Type of getCustomerShipments:", typeof exports.getCustomerShipments);