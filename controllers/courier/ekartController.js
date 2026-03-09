const axios = require("axios");
const Shipment = require("../../models/shipment");
const Customer = require("../../models/customer");
const Commission = require("../../models/commission");

/* =====================================================
   CREATE EKART SHIPMENT
===================================================== */
exports.bookEkartShipment = async (req, res) => {

    try {

        console.log("🚚 EKART BOOK SHIPMENT");

        const shipmentData = req.body;
        const customerId = req.user._id;

        /* ==============================
           CUSTOMER FETCH
        ============================== */

        const customer = await Customer.findById(customerId);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        /* ==============================
           SHIPPING CHARGE
        ============================== */

        const shippingCharge = shipmentData.shippingCharge || 50;

        /* ==============================
           COMMISSION
        ============================== */

        let commission = await Commission.findOne();

        if (!commission) {
            commission = {
                flatCommission: 10,
                percentageCommission: 0
            };
        }

        const adminCommission =
            commission.flatCommission +
            (shippingCharge * commission.percentageCommission) / 100;

        const finalCharge = shippingCharge + adminCommission;

        /* ==============================
           WALLET CHECK
        ============================== */

        if (customer.walletBalance < finalCharge) {
            return res.status(400).json({
                success: false,
                message: "Insufficient wallet balance"
            });
        }

        /* ==============================
           EKART TOKEN
        ============================== */

        const tokenResponse = await axios.post(
            `${process.env.EKART_BASE_URL}/auth/token/${process.env.EKART_CLIENT_ID}`,
            {
                client_secret: process.env.EKART_CLIENT_SECRET
            }
        );

        const token = tokenResponse.data.access_token;

        /* ==============================
           CREATE SHIPMENT PAYLOAD
        ============================== */

        const payload = {

            order_id: shipmentData.orderId,
            customer_name: shipmentData.customerName,
            phone: shipmentData.phone,
            address: shipmentData.address,
            pincode: shipmentData.pincode,
            weight: shipmentData.weight || 0.5

        };

        const shipmentResponse = await axios.post(
            `${process.env.EKART_BASE_URL}/shipments`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const waybill = shipmentResponse.data.tracking_id;

        /* ==============================
           WALLET DEDUCT
        ============================== */

        customer.walletBalance -= finalCharge;
        await customer.save();

        /* ==============================
           SAVE SHIPMENT
        ============================== */

        const newShipment = await Shipment.create({

            ...shipmentData,
            customerId,
            waybill,
            courier: "Ekart",
            status: "Booked"

        });

        /* ==============================
           RESPONSE
        ============================== */

        return res.status(201).json({

            success: true,
            message: "Ekart Shipment Created",
            waybill,
            shipment: newShipment,
            walletBalance: customer.walletBalance

        });

    } catch (error) {

        console.log("EKART BOOK ERROR:", error.message);

        return res.status(500).json({
            success: false,
            message: "Ekart booking failed"
        });

    }

};



/* =====================================================
   GET ALL SHIPMENTS
===================================================== */
exports.getAllEkartShipments = async (req, res) => {

    try {

        const shipments = await Shipment.find({
            courier: "Ekart",
            customerId: req.user._id
        }).sort({ createdAt: -1 });

        return res.json({
            success: true,
            count: shipments.length,
            shipments
        });

    } catch (err) {

        console.log("EKART ALL ERROR:", err.message);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch Ekart shipments"
        });

    }

};



/* =====================================================
   TRACK EKART SHIPMENT
===================================================== */
exports.trackEkartShipment = async (req, res) => {

    try {

        const waybill = req.params.waybill;

        const tokenResponse = await axios.post(
            `${process.env.EKART_BASE_URL}/auth/token/${process.env.EKART_CLIENT_ID}`,
            {
                client_secret: process.env.EKART_CLIENT_SECRET
            }
        );

        const token = tokenResponse.data.access_token;

        const trackingResponse = await axios.get(
            `${process.env.EKART_BASE_URL}/track/${waybill}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        return res.json({
            success: true,
            tracking: trackingResponse.data
        });

    } catch (err) {

        console.log("EKART TRACK ERROR:", err.message);

        return res.status(500).json({
            success: false,
            message: "Tracking failed"
        });

    }

};



/* =====================================================
   PIN SERVICEABILITY
===================================================== */
exports.checkEkartPinService = async (req, res) => {

    try {

        const pincode = req.params.pincode;

        const tokenResponse = await axios.post(
            `${process.env.EKART_BASE_URL}/auth/token/${process.env.EKART_CLIENT_ID}`,
            {
                client_secret: process.env.EKART_CLIENT_SECRET
            }
        );

        const token = tokenResponse.data.access_token;

        const serviceResponse = await axios.get(
            `${process.env.EKART_BASE_URL}/serviceability/${pincode}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        return res.json({
            success: true,
            service: serviceResponse.data
        });

    } catch (err) {

        console.log("EKART PIN ERROR:", err.message);

        return res.status(500).json({
            success: false,
            message: "Serviceability check failed"
        });

    }

};



/* =====================================================
   CANCEL EKART SHIPMENT
===================================================== */
exports.cancelEkartShipment = async (req, res) => {

    try {

        const shipmentId = req.params.id;

        const shipment = await Shipment.findById(shipmentId);

        if (!shipment) {
            return res.status(404).json({
                success: false,
                message: "Shipment not found"
            });
        }

        shipment.status = "Cancelled";
        await shipment.save();

        return res.json({
            success: true,
            message: "Shipment cancelled"
        });

    } catch (err) {

        console.log("EKART CANCEL ERROR:", err.message);

        return res.status(500).json({
            success: false,
            message: "Cancel failed"
        });

    }

};