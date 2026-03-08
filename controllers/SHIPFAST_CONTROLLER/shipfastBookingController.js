const axios = require("axios");
const Shipment = require("../models/shipment");
const Customer = require("../models/customer");
const Commission = require("../models/commission");

exports.bookShipfastShipment = async (req, res) => {

console.log("\n================ SHIPFAST CONTROLLER =================");

try {

const shipmentData = req.body;

console.log("📦 Request Body:", shipmentData);

req.user = req.customer;

if (!req.user || !req.user._id) {
return res.status(401).json({
success:false,
message:"Unauthorized"
});
}

shipmentData.customerId = req.user._id;

console.log("👤 Customer ID:", shipmentData.customerId);


// =====================================================
// STEP 1 — FETCH CUSTOMER
// =====================================================

const customer = await Customer.findById(shipmentData.customerId);

if (!customer) {
return res.status(404).json({
success:false,
message:"Customer not found"
});
}

console.log("💰 Wallet:", customer.walletBalance);


// =====================================================
// STEP 2 — SHIPPING CHARGE
// =====================================================

const shippingCharge = shipmentData.shippingCharge || 45;

console.log("🚚 Shipping Charge:", shippingCharge);


// =====================================================
// STEP 3 — COMMISSION
// =====================================================

let commission = await Commission.findOne();

if (!commission) {

commission = {
flatCommission:10,
percentageCommission:0
};

}

const adminCommission =
commission.flatCommission +
(shippingCharge * commission.percentageCommission)/100;

const finalCharge = shippingCharge + adminCommission;

console.log("💰 Final Charge:", finalCharge);


// =====================================================
// STEP 4 — WALLET CHECK
// =====================================================

if(customer.walletBalance < finalCharge){

return res.status(400).json({
success:false,
message:"Insufficient wallet balance"
});

}


// =====================================================
// STEP 5 — GET SHIPFAST TOKEN
// =====================================================

console.log("🔑 Fetching Shipfast Token...");

const tokenResponse = await axios.post(
"https://shazam.velocity.in/custom/api/v1/auth-token",
{
username:process.env.SHIPFAST_USERNAME,
password:process.env.SHIPFAST_PASSWORD
},
{
headers:{
"Content-Type":"application/json"
}
}
);

const token = tokenResponse.data.token;

console.log("✅ Shipfast Token:", token);


// =====================================================
// STEP 6 — SERVICEABILITY CHECK
// =====================================================

console.log("📍 Checking Serviceability...");

const serviceability = await axios.post(
"https://shazam.velocity.in/custom/api/v1/serviceability",
{
from:shipmentData.pickupPincode,
to:shipmentData.pincode,
payment_mode:shipmentData.paymentMode.toLowerCase(),
shipment_type:"forward"
},
{
headers:{
Authorization:token,
"Content-Type":"application/json"
}
}
);

console.log("🚚 Available Couriers:",serviceability.data);


// =====================================================
// STEP 7 — CREATE SHIPMENT
// =====================================================

console.log("📦 Creating Shipment via Shipfast...");

const orderPayload = {

order_id:shipmentData.orderId,
order_date:new Date().toISOString(),

channel_id:"CHANNEL_ID_HERE",

billing_customer_name:shipmentData.customerName,
billing_last_name:"",

billing_address:shipmentData.address,
billing_city:shipmentData.city,
billing_pincode:shipmentData.pincode,
billing_state:shipmentData.state,
billing_country:"India",

billing_email:shipmentData.email,
billing_phone:shipmentData.phone,

shipping_is_billing:true,
print_label:true,

order_items:[
{
name:shipmentData.productName || "General Item",
sku:shipmentData.sku || "SKU001",
units:shipmentData.quantity || 1,
selling_price:shipmentData.orderValue || 0,
discount:0,
tax:shipmentData.taxRate || 0
}
],

payment_method:shipmentData.paymentMode,

sub_total:shipmentData.orderValue || 0,

cod_collectible:
shipmentData.paymentMode === "COD"
? shipmentData.orderValue
:0,

length:shipmentData.length || 10,
breadth:shipmentData.width || 10,
height:shipmentData.height || 10,
weight:shipmentData.weight || 0.5,

pickup_location:"HomeNew",

warehouse_id:"WAREHOUSE_ID_HERE"

};


console.log("📤 Shipfast Payload:",orderPayload);


const createOrder = await axios.post(
"https://shazam.velocity.in/custom/api/v1/forward-order-orchestration",
orderPayload,
{
headers:{
Authorization:token,
"Content-Type":"application/json"
}
}
);


console.log("📡 Shipfast Response:",createOrder.data);


const awb = createOrder.data?.payload?.awb_code;

const labelUrl = createOrder.data?.payload?.label_url;

const courier = createOrder.data?.payload?.courier_name;

const shipmentId = createOrder.data?.payload?.shipment_id;


// =====================================================
// STEP 8 — WALLET DEDUCT
// =====================================================

customer.walletBalance -= finalCharge;

await customer.save();

console.log("💳 Wallet After Deduction:",customer.walletBalance);


// =====================================================
// STEP 9 — SAVE SHIPMENT
// =====================================================

const newShipment = await Shipment.create({

...shipmentData,

awb,
courier,
labelUrl,
shipmentId,

status:"Booked",

customerId:shipmentData.customerId

});


console.log("📦 Shipment Saved:",newShipment._id);


// =====================================================
// SUCCESS
// =====================================================

return res.status(201).json({

success:true,

message:"Shipment Created Successfully",

awb,

courier,

labelUrl,

shipment:newShipment,

walletBalance:customer.walletBalance

});


}catch(error){

console.log("\n❌❌ SHIPFAST CONTROLLER ERROR ❌❌");

console.log("Message:",error.message);

if(error.response){

console.log("API Error:",error.response.data);

}

return res.status(500).json({

success:false,

message:"Shipfast Shipment Booking Failed",

error:error.message

});

}

};