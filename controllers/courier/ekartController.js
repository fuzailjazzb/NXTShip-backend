const axios = require("axios");
const Shipment = require("../../models/shipment");
const Customer = require("../../models/customer");
const Commission = require("../../models/commission");

exports.createEkartShipment = async (req, res) => {

    console.log("🚚 EKART SHIPMENT CONTROLLER HIT");

    try {

        const shipmentData = req.body;
        const customerId = req.customer._id;

        console.log("Customer:", customerId);

        const customer = await Customer.findById(customerId);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        const shippingCharge = shipmentData.shippingCharge || 50;

        let commission = await Commission.findOne();

        if (!commission) {
            commission = {
                flatCommission: 10,
                percentageCommission: 0
            }
        }

        const adminCommission =
            commission.flatCommission +
            (shippingCharge * commission.percentageCommission) / 100;

        const finalCharge = shippingCharge + adminCommission;

        if (customer.walletBalance < finalCharge) {
            return res.status(400).json({
                success: false,
                message: "Insufficient Wallet Balance"
            });
        }

        console.log("💰 Wallet OK");

        // EKART TOKEN

        const tokenResponse = await axios.post(
            `${process.env.EKART_BASE_URL}/auth/token/${process.env.EKART_CLIENT_ID}`,
            {
                client_secret: process.env.EKART_CLIENT_SECRET
            }
        );

        const token = tokenResponse.data.access_token;

        console.log("EKART TOKEN RECEIVED");

        // CREATE SHIPMENT

        const ekartPayload = {
            order_id: shipmentData.orderId,
            customer_name: shipmentData.customerName,
            phone: shipmentData.phone,
            address: shipmentData.address,
            pincode: shipmentData.pincode,
            weight: shipmentData.weight || 0.5
        };

        const shipmentResponse = await axios.post(
            `${process.env.EKART_BASE_URL}/shipments`,
            ekartPayload,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const trackingId = shipmentResponse.data.tracking_id;

        console.log("📦 EKART TRACKING:", trackingId);

        // WALLET DEDUCTION

        customer.walletBalance -= finalCharge;

        await customer.save();

        // SAVE SHIPMENT

        const newShipment = await Shipment.create({

            ...shipmentData,
            trackingId,
            courier: "Ekart",
            customerId

        });

        return res.status(201).json({

            success: true,
            message: "Ekart Shipment Created",
            trackingId,
            shipment: newShipment,
            walletBalance: customer.walletBalance

        });

    } catch (error) {

        console.log("EKART ERROR:", error.message);

        return res.status(500).json({
            success: false,
            message: "Ekart Shipment Failed"
        });

    }

};