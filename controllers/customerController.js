const Customer = require('../models/customer');
const Shipment = require('../models/shipment');

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
        let customer = await Customer.findOne({ phone: shipmentData.phone });

        if (customer) {
            customer.totalOrders += 1;
            await customer.save();
        } else {
            customer = await Customer.create({
                name: shipmentData.name,
                phone: shipmentData.phone,
                city: shipmentData.city,
                totalOrders: 1,
            });
        }
        return customer;
    } catch (error) {
        throw error;
    }
}