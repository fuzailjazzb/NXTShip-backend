const axios = require("axios");
const { getToken } = require("./shipfastAuthService");

const BASE_URL = process.env.SHIPFAST_BASE_URL;

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
   2. CREATE SHIPMENT
===================================================== */
exports.createShipment = async (shipment) => {
  try {

    console.log("🚀 [Shipfast] CREATE ORDER START");

    const token = await getToken();

    // ======================
    // SERVICEABILITY FIRST
    // ======================
    const service = await exports.checkServiceability(
      shipment.pickup.pincode,
      shipment.delivery.pincode,
      shipment.product.orderValue > 0 ? "COD" : "PREPAID"
    );

    if (!service.success || !service.data.serviceability_results.length) {
      throw new Error("No carriers available");
    }

    const carrier_id = service.data.serviceability_results[0].carrier_id;

    console.log("🚚 Selected Carrier:", carrier_id);

    // ======================
    // CREATE ORDER PAYLOAD
    // ======================
    const payload = {
      order_id: `NXT_${Date.now()}`,
      order_date: new Date().toISOString().slice(0, 16).replace("T", " "),
      carrier_id,

      billing_customer_name: shipment.delivery.name,
      billing_address: shipment.delivery.address,
      billing_city: shipment.delivery.city,
      billing_pincode: shipment.delivery.pincode,
      billing_state: shipment.delivery.state,
      billing_country: "India",
      billing_phone: shipment.delivery.phone,

      shipping_is_billing: true,
      print_label: true,

      order_items: [
        {
          name: shipment.product.name,
          sku: "SKU001",
          units: shipment.product.quantity,
          selling_price: shipment.product.orderValue,
          discount: 0,
          tax: 0
        }
      ],

      payment_method: shipment.product.orderValue > 0 ? "COD" : "PREPAID",
      sub_total: shipment.product.orderValue,
      cod_collectible: shipment.product.orderValue,

      length: 10,
      breadth: 10,
      height: 10,
      weight: shipment.product.weight,

      pickup_location: "Primary",
      warehouse_id: process.env.SHIPFAST_WAREHOUSE_ID,

      vendor_details: {
        name: shipment.pickup.name,
        address: shipment.pickup.address,
        city: shipment.pickup.city,
        state: shipment.pickup.state,
        country: "India",
        pin_code: shipment.pickup.pincode,
        phone: shipment.pickup.phone
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
   3. TRACK SHIPMENT
===================================================== */
exports.trackShipment = async (awb) => {
  try {

    const token = await getToken();

    console.log("📍 Tracking AWB:", awb);

    const res = await axios.post(
      `${BASE_URL}/order-tracking`,
      { awbs: [awb] },
      {
        headers: { Authorization: token }
      }
    );

    console.log("✅ Tracking Response:", JSON.stringify(res.data, null, 2));

    return {
      success: true,
      data: res.data.result[awb]
    };

  } catch (err) {

    console.error("❌ Tracking Error:", err.response?.data || err.message);

    return {
      success: false,
      error: err.response?.data || err.message
    };
  }
};


/* =====================================================
   4. CANCEL SHIPMENT
===================================================== */
exports.cancelShipment = async (awb) => {
  try {

    const token = await getToken();

    console.log("❌ Cancelling AWB:", awb);

    const res = await axios.post(
      `${BASE_URL}/cancel-order`,
      { awbs: [awb] },
      {
        headers: { Authorization: token }
      }
    );

    console.log("✅ Cancel Response:", res.data);

    return {
      success: true,
      data: res.data
    };

  } catch (err) {

    console.error("❌ Cancel Error:", err.response?.data || err.message);

    return {
      success: false,
      error: err.response?.data || err.message
    };
  }
};