const axios = require("axios");
const Shipment = require("../../models/shipment");
const Customer = require("../../models/customer");
const Commission = require("../../models/commission");

/* =====================================================
   GET EKART TOKEN
===================================================== */

const getEkartToken = async () => {

    const response = await axios.post(
        `${process.env.EKART_BASE_URL}/integrations/v2/auth/token/${process.env.EKART_CLIENT_ID}`,
        {
            username: process.env.EKART_USERNAME,
            password: process.env.EKART_PASSWORD
        }
    );

    return response.data.access_token;
};


/* =====================================================
   CREATE EKART SHIPMENT
===================================================== */

exports.bookEkartShipment = async (req, res) => {

    try {

        console.log("🚀 EKART BOOK SHIPMENT STARTED");

        const shipmentData = req.body;
        console.log("📦 Shipment Data:", shipmentData);

        const customerId = req.user._id || req.user.id;
        console.log("👤 Customer ID:", customerId);

        const customer = await Customer.findById(customerId);
        console.log("👤 Customer DB Result:", customer);

        if (!customer) {
            console.log("❌ CUSTOMER NOT FOUND");
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        console.log("💰 Wallet Balance:", customer.walletBalance);

        const shippingCharge = shipmentData.shippingCharge || 50;
        console.log("🚚 Shipping Charge:", shippingCharge);

        let commission = await Commission.findOne();
        console.log("💼 Commission Config:", commission);

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

        console.log("💰 Final Charge:", finalCharge);

        if (customer.walletBalance < finalCharge) {

            console.log("❌ WALLET LOW");

            return res.status(400).json({
                success: false,
                message: "Insufficient wallet balance"
            });
        }

        console.log("🔑 REQUESTING EKART TOKEN");

        const tokenResponse = await axios.post(
            `${process.env.EKART_BASE_URL}/integrations/v2/auth/token/${process.env.EKART_CLIENT_ID}`,
            {
                username: process.env.EKART_USERNAME,
                password: process.env.EKART_PASSWORD
            }
        );

        console.log("🔑 TOKEN RESPONSE:", tokenResponse.data);

        const token = tokenResponse.data.access_token;

        console.log("📦 BUILDING EKART PAYLOAD");

        const payload = {

            seller_name: process.env.EKART_SELLER_NAME,
            seller_address: process.env.EKART_SELLER_ADDRESS,
            seller_gst_tin: process.env.EKART_GST,

            order_number: shipmentData.orderId || Date.now().toString(),
            invoice_number: shipmentData.orderId || Date.now().toString(),
            invoice_date: new Date().toISOString().split("T")[0],

            consignee_name: shipmentData.customerName,
            consignee_alternate_phone: shipmentData.phone,
            consignee_gst_amount: 0,

            products_desc: shipmentData.product || "Parcel",

            payment_mode: shipmentData.paymentMode && shipmentData.paymentMode.toUpperCase() === "COD" ? "COD" : "Prepaid",

            category_of_goods: "General",

            total_amount: shipmentData.amount || 1,
            tax_value: 0,
            taxable_amount: shipmentData.amount || 1,
            commodity_value: String(shipmentData.amount || 1),

            cod_amount: shipmentData.codAmount || 0,

            quantity: 1,

            weight: parseInt(shipmentData.weight) || 500,
            length: 10,
            height: 10,
            width: 10,

            drop_location: {
                location_type: "Home",
                address: shipmentData.address,
                city: shipmentData.city,
                state: shipmentData.state,
                country: "India",
                name: shipmentData.customerName,
                phone: shipmentData.phone ? parseInt(shipmentData.phone) : 9553281751,
                pin: shipmentData.pincode ? parseInt(shipmentData.pincode) : 500055
            }

        };

        console.log("📦 EKART PAYLOAD:", JSON.stringify(payload, null, 2));

        console.log("📡 SENDING SHIPMENT REQUEST");

        const shipmentResponse = await axios.put(

            `${process.env.EKART_BASE_URL}/api/v1/package/create`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }

        );

        console.log("📦 EKART RESPONSE:", shipmentResponse.data);

        const waybill = shipmentResponse.data.tracking_id;

        console.log("📦 WAYBILL:", waybill);

        customer.walletBalance -= finalCharge;
        await customer.save();

        console.log("💰 WALLET UPDATED:", customer.walletBalance);

        const newShipment = await Shipment.create({

            ...shipmentData,
            customerId,
            waybill,
            courier: "Ekart",
            status: "Booked"

        });

        console.log("📦 SHIPMENT SAVED:", newShipment._id);

        return res.status(201).json({

            success: true,
            message: "Ekart Shipment Created",
            waybill,
            shipment: newShipment,
            walletBalance: customer.walletBalance

        });

    } catch (error) {

        console.log("❌ EKART FULL ERROR");

        if (error.response) {
            console.log("📡 EKART API ERROR:", error.response.data);
            console.log("📡 STATUS:", error.response.status);
        }

        console.log("❌ MESSAGE:", error.message);

        return res.status(500).json({
            success: false,
            message: "Ekart booking failed"
        });

    }

};



/* =====================================================
   TRACK EKART SHIPMENT
===================================================== */

exports.trackEkartShipment = async (req, res) => {

    try {

        const token = await getEkartToken();

        const waybill = req.params.waybill;

        const response = await axios.get(
            `${process.env.EKART_BASE_URL}/api/v1/track/${waybill}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        return res.json({
            success: true,
            tracking: response.data
        });

    } catch (error) {

        console.log("EKART TRACK ERROR:", error.message);

        return res.status(500).json({
            success: false,
            message: "Tracking failed"
        });

    }

};



/* =====================================================
   CANCEL EKART SHIPMENT
===================================================== */

exports.cancelEkartShipment = async (req, res) => {

    try {

        const token = await getEkartToken();

        const trackingId = req.params.waybill;

        const response = await axios.delete(
            `${process.env.EKART_BASE_URL}/api/v1/package/cancel?tracking_id=${trackingId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        return res.json({
            success: true,
            cancel: response.data
        });

    } catch (error) {

        console.log("EKART CANCEL ERROR:", error.message);

        return res.status(500).json({
            success: false,
            message: "Cancel failed"
        });

    }

};



/* =====================================================
   PIN SERVICEABILITY
===================================================== */

exports.checkEkartPinService = async (req, res) => {

    try {

        const token = await getEkartToken();

        const response = await axios.post(
            `${process.env.EKART_BASE_URL}/data/pricing/estimate`,
            {
                pickupPincode: req.query.pickup,
                dropPincode: req.query.drop,
                weight: 500,
                length: 10,
                height: 10,
                width: 10,
                serviceType: "SURFACE"
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        return res.json({
            success: true,
            data: response.data
        });

    } catch (error) {

        console.log("EKART PIN ERROR:", error.message);

        return res.status(500).json({
            success: false,
            message: "Serviceability check failed"
        });

    }

};



/* =====================================================
   DOWNLOAD LABEL
===================================================== */

exports.downloadEkartLabel = async (req, res) => {

    try {

        const token = await getEkartToken();

        const response = await axios.post(
            `${process.env.EKART_BASE_URL}/api/v1/package/label`,
            {
                ids: [req.params.waybill]
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        return res.json({
            success: true,
            label: response.data
        });

    } catch (error) {

        console.log("EKART LABEL ERROR:", error.message);

        return res.status(500).json({
            success: false,
            message: "Label download failed"
        });

    }

};



exports.getEkartRate = async (pickupPincode, deliveryPincode, weight) => {

    try {

        console.log("📦 Checking Ekart rate...");


        // STEP 1 — GET EKART TOKEN
        const tokenResponse = await axios.post(
            `${process.env.EKART_BASE_URL}/integrations/v2/auth/token/${process.env.EKART_CLIENT_ID}`,
            {
                username: process.env.EKART_USERNAME,
                password: process.env.EKART_PASSWORD
            }
        );

        const token = tokenResponse.data.access_token;

        console.log("✅ Ekart Token Received");


        // STEP 2 — CHECK SERVICEABILITY
        const serviceResponse = await axios.get(
            `${process.env.EKART_BASE_URL}/integrations/v2/pincode/serviceability`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                params: {
                    pickup_pincode: pickupPincode,
                    delivery_pincode: deliveryPincode
                }
            }
        );

        const serviceData = serviceResponse.data;

        console.log("📍 Ekart Service Response:", serviceData);


        // STEP 3 — ESTIMATE DELIVERY DAYS
        let deliveryDays = 3;

        if (serviceData && serviceData.estimated_delivery_days) {
            deliveryDays = serviceData.estimated_delivery_days;
        }


        // STEP 4 — CALCULATE PRICE (example logic)

        let basePrice = 50;

        if (weight > 1) {
            basePrice += (weight - 1) * 10;
        }


        // RETURN RESULT

        return {
            price: basePrice,
            estimatedDays: deliveryDays
        };

    } catch (error) {

        console.log("❌ Ekart Rate Error:", error.response?.data || error.message);

        return {
            price: 0,
            estimatedDays: null
        };

    }

};

