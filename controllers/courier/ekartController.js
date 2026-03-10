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

        console.log("🚚 EKART BOOK SHIPMENT");
        console.log("req user", req.user);

        if (!req.user || req.user._id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized usersa"
            })
        }

        const shipmentData = req.body;
        const customerId = req.user._id;

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
            };
        }

        const adminCommission =
            commission.flatCommission +
            (shippingCharge * commission.percentageCommission) / 100;

        const finalCharge = shippingCharge + adminCommission;

        if (customer.walletBalance < finalCharge) {
            return res.status(400).json({
                success: false,
                message: "Insufficient wallet balance"
            });
        }

        const token = await getEkartToken();

        const payload = {

            seller_name: shipmentData.sellerName || "Default Seller",

            seller_address: shipmentData.sellerAddress || "Warehouse Address",

            seller_gst_tin: shipmentData.sellerGst || "GST123",

            seller_gst_amount: 0,

            consignee_gst_amount: 0,

            integrated_gst_amount: 0,

            order_number: shipmentData.orderId,

            invoice_number: shipmentData.invoiceNumber || shipmentData.orderId,

            invoice_date: new Date().toISOString().split("T")[0],

            consignee_name: shipmentData.customerName,

            consignee_alternate_phone: shipmentData.phone,

            products_desc: shipmentData.product || "Product",

            payment_mode: shipmentData.paymentMode || "Prepaid",

            category_of_goods: shipmentData.category || "General",

            total_amount: shipmentData.amount || 1,

            tax_value: shipmentData.tax || 0,

            taxable_amount: shipmentData.amount || 1,

            commodity_value: String(shipmentData.amount || 1),

            cod_amount: shipmentData.codAmount || 0,

            quantity: shipmentData.quantity || 1,

            weight: shipmentData.weight || 500,

            length: shipmentData.length || 10,

            height: shipmentData.height || 10,

            width: shipmentData.width || 10,

            drop_location: {

                location_type: "Home",

                address: shipmentData.address,

                city: shipmentData.city,

                state: shipmentData.state,

                country: "India",

                name: shipmentData.customerName,

                phone: shipmentData.phone,

                pin: shipmentData.pincode

            },

            pickup_location: {

                location_type: "Office",

                address: shipmentData.pickupAddress || "Warehouse",

                city: shipmentData.pickupCity || "Patna",

                state: shipmentData.pickupState || "Bihar",

                country: "India",

                name: shipmentData.pickupName || "Warehouse",

                phone: shipmentData.pickupPhone || "9999999999",

                pin: shipmentData.pickupPincode || 800001

            },

            return_location: {

                location_type: "Office",

                address: shipmentData.pickupAddress || "Warehouse",

                city: shipmentData.pickupCity || "Patna",

                state: shipmentData.pickupState || "Bihar",

                country: "India",

                name: shipmentData.pickupName || "Warehouse",

                phone: shipmentData.pickupPhone || "9999999999",

                pin: shipmentData.pickupPincode || 800001

            }

        };

        const shipmentResponse = await axios.put(
            `${process.env.EKART_BASE_URL}/api/v1/package/create`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const waybill = shipmentResponse.data.tracking_id;

        customer.walletBalance -= finalCharge;
        await customer.save();

        const newShipment = await Shipment.create({

            ...shipmentData,
            customerId,
            waybill,
            courier: "Ekart",
            status: "Booked"

        });

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