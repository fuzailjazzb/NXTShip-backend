const Customer = require('../models/customer');


exports.getAllCustomers = async (req, res) => {
    try {
        const customers = await Customer.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            total: customers.length,
            customers,
        });
    } catch (error) {        console.error('Error fetching customers:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message,
        });
    }
}


exports.createCustomerFromShipment = async (shipmentData) => {
    try {
        if (!shipmentData.phone) return;

        const existingCustomer = await Customer.findOne({ phone: shipmentData.phone });

        if (existingCustomer) {
            existingCustomer.totalOrders += 1;
            await existingCustomer.save();
        } else {
            await Customer.create({
                name: shipmentData.name,
                phone: shipmentData.phone,
                city: shipmentData.city,
                totalOrders: 1,
            }); 
        }

    } catch (error) {
        console.log("Customer Creation Error:", error.message);
            throw new Error("Failed to create or update customer");
    }
};