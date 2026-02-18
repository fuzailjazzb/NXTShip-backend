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
                name: shipmentData.customerName || "Unknown Customer",
                phone: shipmentData.phone,
                city: shipmentData.city || "N/A",
                totalOrders: 1,
            }); 
        }

    } catch (error) {
        console.log("Customer Creation Error:", error.message);
            throw new Error("Failed to create or update customer");
    }
};


exports.getCustomerProfile = async (req, res) => {
    try {
        console.log("Get Profile API hit.......");

        const customer = await Customer.findById(req.customer.id).select("-password");

        if (!customer) {
            console.log("❌ Customer not found in profile fetch");
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        console.log("✅ Customer Profile:", customer);

        res.status(200).json({
            success: true,
            customer,
        });
        
    } catch (error) {
        console.error("Error fetching customer profile:", error);
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message,
        });
    }
};

exports.updateCustomerProfile = async (req, res) => {
    try {
        console.log("Update Profile API hit.......");
        console.log("Body Received:", req.body);

        const customer = await Customer.findById(req.customer.id);

        if (!customer) {
            console.log("❌ Customer not found in profile update");
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        customer.address = req.body.address || customer.address;
        customer.landmark = req.body.landmark || customer.landmark;
        customer.city = req.body.city || customer.city;
        customer.state = req.body.state || customer.state;
        customer.pincode = req.body.pincode || customer.pincode;

        await customer.save();

        console.log("✅ Customer Profile Updated:", customer);

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            customer,
        });

    } catch (error) {
        console.error("Error updating customer profile:", error);
        res.status(500).json({
            success: false,
            message: "Profile update failed",
            error: error.message,
        });
    }
};