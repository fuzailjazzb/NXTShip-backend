const axios = require("axios");
const Shipment = require("../models/shipment");
const Customer = require("../models/customer");

/**
 * 📦 CUSTOMER BOOK SHIPMENT
 * Secure – Customer can only create shipment for himself
 */
exports.bookCustomerShipment = async (req, res) => {
    try {
        const shipmentData = req.body;

        // 🔐 Attach logged-in customer ID
        shipmentData.customerId = req.user.id;

        const payload = {
            shipments: [
                {
                    name: shipmentData.customerName,
                    add: shipmentData.address,
                    pin: shipmentData.pincode,
                    city: shipmentData.city,
                    state: shipmentData.state,
                    country: "India",
                    phone: shipmentData.phone,

                    order: shipmentData.orderId,
                    payment_mode: shipmentData.paymentMode,

                    products_desc: "Clothes",
                    hsn_code: "6109",

                    cod_amount:
                        shipmentData.paymentMode === "COD"
                            ? shipmentData.orderValue
                            : 0,

                    total_amount: shipmentData.orderValue,
                    quantity: "1",

                    shipment_length: "10",
                    shipment_width: "10",
                    shipment_height: "10",

                    weight: shipmentData.weight || "0.5",

                    return_add: shipmentData.address,
                    return_pin: shipmentData.pincode,
                    return_city: shipmentData.city,
                    return_state: shipmentData.state,
                    return_country: "India",
                    return_phone: shipmentData.phone,

                    seller_name: "KING NXT",
                    seller_add: "Hyderabad Warehouse",
                    seller_inv: shipmentData.orderId,

                    shipping_mode: "Surface",
                    address_type: "home",
                },
            ],
            pickup_location: {
                name: "KING NXT",
            },
        };

        const formData =
            "format=json&data=" + encodeURIComponent(JSON.stringify(payload));

        const response = await axios.post(
            "https://track.delhivery.com/api/cmu/create.json",
            formData,
            {
                headers: {
                    Authorization: `Token ${process.env.DELHIVERY_TOKEN}`,
                    Accept: "application/json",
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );

        const shippingCharge = shippingData.shippingCharge || 42.5;

        // Get Customer Wallet
        const customer = await Customer.findById(req.user.id);
        try {
            if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        // Insufficient Wallet
        if (customer.walletBalance < shippingCharge) {
            return res.status(404).json({
                success: false,
                message: "Insufficient Wallet Balance. Please Recharge."
            });
        }

        // Deduct Wallet
        customer.walletBalance -= shippingCharge;

        // Save Transactions
        customer.walletTransactions.unshift({
            amount: shippingCharge,
            type: "debit",
            message: " Shipment Booking Charge Deducted.",
            date: new Date()

        });

        await customer.save();
            
        } catch (error) {
            if (customer) {
                customer.walletBalance += shippingCharge;

                customer.walletTransactions.unshift({
                    amount: shippingCharge,
                    type: "credit",
                    message: "Refund - Shipment Booking Failed",
                    date: new Date()
                });
                await customer.save();
            }
        }

        

        const waybill =
            response.data?.packages?.[0]?.waybill ||
            response.data?.packages?.[0]?.waybill_number;

        if (!waybill) {
            return res.status(400).json({
                success: false,
                message: "No waybill received from Delhivery",
                delhiveryResponse: response.data,
            });
        }

        const newShipment = await Shipment.create({
            ...shipmentData,
            waybill,
            status: "Booked",
            customerId: req.user.id,
        });

        return res.status(201).json({
            success: true,
            message: "Shipment Created Successfully 🚀",
            waybill,
            trackingId: waybill,
            shipment: newShipment,
            walletBalance: customer.walletBalance
        });
    } catch (error) {
        console.log(
            "Customer Booking Error:",
            error.response?.data || error.message
        );

        return res.status(500).json({
            success: false,
            message: "Customer Shipment Booking Failed ❌",
            error: error.response?.data || error.message,
        });
    }
};
