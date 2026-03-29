const axios = require("axios");
const { getToken } = require("./shipfastAuthService");

const BASE_URL = process.env.SHIPFAST_BASE_URL;

/* =====================================================
   🔧 HELPER: SAFE VALUE EXTRACTOR
===================================================== */
const getValue = (obj, path, fallback = null) => {
    return path.split('.').reduce((o, k) => (o || {})[k], obj) ?? fallback;
};

/* =====================================================
   1. SERVICEABILITY (PINCODE CHECK)
===================================================== */
exports.checkServiceability = async (pickupPincode, deliveryPincode, paymentType) => {
    try {
        const token = await getToken();

        console.log("📍 Checking serviceability...");

        const res = await axios.post(
            `${BASE_URL}/serviceability`,
            {
                from: pickupPincode,
                to: deliveryPincode,
                payment_mode: paymentType === "COD" ? "cod" : "prepaid",
                shipment_type: "forward"
            },
            {
                headers: { Authorization: token }
            }
        );

        console.log("✅ Serviceability Response:", JSON.stringify(res.data, null, 2));

        return {
            success: true,
            data: res.data.result
        };

    } catch (err) {
        console.error("❌ Serviceability Error:", err.response?.data || err.message);

        return {
            success: false,
            error: err.response?.data || err.message
        };
    }
};

/* =====================================================
   2. RATE (DERIVED FROM SERVICEABILITY)
===================================================== */
exports.getRates = async (shipment) => {
    try {
        const pickupPincode =
            getValue(shipment, "pickup.pincode") || shipment.fromPincode;

        const deliveryPincode =
            getValue(shipment, "delivery.pincode") || shipment.toPincode;

        const paymentType =
            getValue(shipment, "product.orderValue", 0) > 0 ? "COD" : "PREPAID";

        const service = await exports.checkServiceability(
            pickupPincode,
            deliveryPincode,
            paymentType
        );

        if (!service.success) throw new Error("Serviceability failed");

        const carriers = service.data.serviceability_results || [];

        return {
            success: true,
            data: carriers.map(c => ({
                courier: c.carrier_name,
                carrier_id: c.carrier_id
            }))
        };

    } catch (err) {
        console.error("❌ Rate Error:", err.message);

        return {
            success: false,
            error: err.message
        };
    }
};

/* =====================================================
   3. CREATE SHIPMENT
===================================================== */
exports.createShipment = async (shipment) => {
    try {
        console.log("🚀 [Shipfast] CREATE ORDER START");

        const token = await getToken();

        // ======================
        // SAFE EXTRACTION
        // ======================
        const pickupPincode =
            getValue(shipment, "pickup.pincode") || shipment.fromPincode;

        const deliveryPincode =
            getValue(shipment, "delivery.pincode") || shipment.toPincode;

        const orderValue =
            getValue(shipment, "product.orderValue", 0) || shipment.orderValue || 0;

        const customerName =
            getValue(shipment, "delivery.name") || shipment.customerName;

        const phone =
            getValue(shipment, "delivery.phone") || shipment.phone;

        const address =
            getValue(shipment, "delivery.address") || shipment.address;

        const city =
            getValue(shipment, "delivery.city") || shipment.city;

        const state =
            getValue(shipment, "delivery.state") || shipment.state;

        const weight =
            getValue(shipment, "product.weight", 1) || shipment.weight || 1;

        const quantity =
            getValue(shipment, "product.quantity", 1) || shipment.quantity || 1;

        const productName =
            getValue(shipment, "product.name") || shipment.productName || "Item";

        const warehouse = shipment.pickup || shipment.warehouse;

        if (!pickupPincode || !deliveryPincode) {
            throw new Error("Pincode missing in shipment");
        }

        // ======================
        // SERVICEABILITY
        // ======================
        const service = await exports.checkServiceability(
            pickupPincode,
            deliveryPincode,
            orderValue > 0 ? "COD" : "PREPAID"
        );

        if (!service.success || !service.data.serviceability_results?.length) {
            throw new Error("No carriers available");
        }

        const carrier_id = service.data.serviceability_results[0].carrier_id;

        console.log("🚚 Selected Carrier:", carrier_id);

        // ======================
        // CREATE ORDER PAYLOAD
        // ======================
        const payload = {
            order_id: shipment.orderId || `NXT_${Date.now()}`,
            order_date: new Date().toISOString().slice(0, 16).replace("T", " "),
            carrier_id,

            billing_customer_name: customerName,
            billing_address: address,
            billing_city: city,
            billing_pincode: deliveryPincode,
            billing_state: state,
            billing_country: "India",
            billing_phone: phone,

            shipping_is_billing: true,
            print_label: true,

            order_items: [{
                name: productName,
                sku: shipment.sku || "SKU001",
                units: quantity,
                selling_price: orderValue,
                discount: 0,
                tax: 0
            }],

            payment_method: orderValue > 0 ? "COD" : "PREPAID",
            sub_total: orderValue,
            cod_collectible: orderValue,

            length: shipment.length || 10,
            breadth: shipment.width || 10,
            height: shipment.height || 10,
            weight: weight,

            pickup_location: warehouse?.name,
            warehouse_id: warehouse?.shipfastWarehouseId,

            vendor_details: {
                name: warehouse?.name,
                address: warehouse?.address,
                city: warehouse?.city,
                state: warehouse?.state,
                country: "India",
                pin_code: pickupPincode,
                phone: warehouse?.phone
            }
        };

        console.log("📦 Final Payload:", JSON.stringify(payload, null, 2));

        const res = await axios.post(
            `${BASE_URL}/forward-order-orchestration`,
            payload,
            {
                headers: { Authorization: token }
            }
        );

        console.log("✅ Order Response:", JSON.stringify(res.data, null, 2));

        const data = res.data.payload;

        return {
            success: true,
            data: {
                awb: data.awb_code,
                labelUrl: data.label_url,
                courierName: data.courier_name,
                charges: data.charges
            }
        };

    } catch (err) {
        console.error("❌ Create Shipment Error:", err.response?.data || err.message);

        return {
            success: false,
            error: err.response?.data || err.message
        };
    }
};

/* =====================================================
   4. TRACK SHIPMENT
===================================================== */
exports.trackShipment = async (awb) => {
    try {
        const token = await getToken();

        const res = await axios.post(
            `${BASE_URL}/order-tracking`,
            { awbs: [awb] },
            { headers: { Authorization: token } }
        );

        return {
            success: true,
            data: res.data.result[awb]
        };

    } catch (err) {
        return {
            success: false,
            error: err.response?.data || err.message
        };
    }
};

/* =====================================================
   5. CANCEL SHIPMENT
===================================================== */
exports.cancelShipment = async (awb) => {
    try {
        const token = await getToken();

        const res = await axios.post(
            `${BASE_URL}/cancel-order`,
            { awbs: [awb] },
            { headers: { Authorization: token } }
        );

        return {
            success: true,
            data: res.data
        };

    } catch (err) {
        return {
            success: false,
            error: err.response?.data || err.message
        };
    }
};