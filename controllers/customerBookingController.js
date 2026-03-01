const axios = require("axios");
const Shipment = require("../models/shipment");
const Customer = require("../models/customer");
const Commission = require("../models/commission");
const AdminEarning = require("../models/adminEarning");
const ReferralEarning = require("../models/referralEarning");

/**
 * 📦 CUSTOMER BOOK SHIPMENT
 * Customer creates shipment using wallet balance
 */




exports.bookCustomerShipment = async (req, res) => {

  console.log("\n================ CONTROLLER HIT =================");
  console.log("⏰ Time:", new Date().toISOString());
  console.log("➡️ Route Hit: /api/customer/shipment/book");

  try {

    /* =====================================================
       STEP 0 — REQUEST DEBUG
    ====================================================== */

    console.log("🔎 Middleware Customer:", req.customer);
    console.log("🔎 Request Headers:", req.headers);
    console.log("🔎 Request Body:", req.body);

    const shipmentData = req.body;

    console.log("✅ Body Parsed Successfully");

    req.user = req.customer;

    console.log("👤 req.user assigned:", req.user);

    if (!req.user || !req.user._id) {
      console.log("❌ USER INVALID OR MISSING");
      return res.status(401).json({
        success: false,
        message: "unauthorized usersss"
      });
    }

    shipmentData.customerId = req.user._id;

    console.log("✅ CustomerId attached:", shipmentData.customerId);

    /* =====================================================
       STEP 1 — CUSTOMER FETCH
    ====================================================== */

    console.log("🔎 Fetching customer from DB...");
    console.log("CustomerId used:", shipmentData.customerId);

    const customer = await Customer.findById(shipmentData.customerId);

    console.log("DB Response Customer:", customer);

    if (!customer) {
      console.log("❌ Customer NOT FOUND");
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    console.log("✅ Customer Found:", customer.email);
    console.log("💰 Wallet Balance:", customer.walletBalance);

    /* =====================================================
       STEP 2 — SHIPPING CHARGE
    ====================================================== */

    const shippingCharge = shipmentData.shippingCharge || 42.5;
    console.log("🚚 Shipping Charge:", shippingCharge);

    /* =====================================================
       STEP 3 — COMMISSION
    ====================================================== */

    console.log("🔎 Fetching Commission...");
    let commission = await Commission.findOne();

    console.log("Commission From DB:", commission);

    if (!commission) {
      console.log("⚠️ Using Default Commission");
      commission = {
        flatCommission: 10,
        percentageCommission: 0,
      };
    }

    const adminCommission =
      commission.flatCommission +
      (shippingCharge * commission.percentageCommission) / 100;

    const finalCharge = shippingCharge + adminCommission;

    console.log("💰 Admin Commission:", adminCommission);
    console.log("💰 Final Charge:", finalCharge);

    /* =====================================================
       STEP 4 — WALLET CHECK
    ====================================================== */

    console.log("🔎 Wallet Check...");
    console.log("Wallet:", customer.walletBalance, "| Needed:", finalCharge);

    if (customer.walletBalance < finalCharge) {
      console.log("❌ Insufficient Wallet");
      return res.status(400).json({
        success: false,
        message: "Insufficient Wallet Balance",
      });
    }

    console.log("✅ Wallet OK");

    /* =====================================================
       STEP 5 — DELHIVERY PAYLOAD
    ====================================================== */

    console.log("📦 Preparing Delhivery Payload");

    const payload = {
      shipments: [{
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
      }],
      pickup_location: { name: "KING NXT" },
    };

    console.log("📤 Payload Ready");

    const formData =
      "format=json&data=" + encodeURIComponent(JSON.stringify(payload));

    /* =====================================================
       STEP 6 — DELHIVERY API CALL
    ====================================================== */

    console.log("🌐 Calling Delhivery API...");

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

    console.log("✅ Delhivery Response:", response.data);

    const waybill =
      response.data?.packages?.[0]?.waybill ||
      response.data?.packages?.[0]?.waybill_number;

      if (response.data?.packages?.[0]?.serviceable === false) {
        return res.status(400).json({
            success: false,
            message: "Delhivery not serviceable for this pin code"
        });
      };

    console.log("📦 Waybill Extracted:", waybill);


    if (!waybill) {
      console.log("❌ No Waybill Received");
      return res.status(400).json({
        success: false,
        message: "No waybill received",
      });
    }

    /* =====================================================
       STEP 7 — WALLET DEDUCTION
    ====================================================== */

    console.log("💳 Deducting Wallet...");
    console.log("Before:", customer.walletBalance);

    customer.walletBalance -= finalCharge;

    await customer.save();

    console.log("After:", customer.walletBalance);

    /* =====================================================
       STEP 8 — SAVE SHIPMENT
    ====================================================== */

    console.log("💾 Saving Shipment...");

    const newShipment = await Shipment.create({
      ...shipmentData,
      waybill,
      status: "Booked",
      customerId: shipmentData.customerId,
    });

    console.log("✅ Shipment Saved:", newShipment._id);

    /* =====================================================
       SUCCESS
    ====================================================== */

    console.log("🎉 BOOKING SUCCESS");

    return res.status(201).json({
      success: true,
      waybill,
      shipment: newShipment,
      walletBalance: customer.walletBalance,
    });

  } catch (error) {

    console.log("\n❌❌❌ CONTROLLER ERROR ❌❌❌");
    console.log("Message:", error.message);
    console.log("Stack:", error.stack);
    console.log("Axios Error:", error.response?.data);
    console.log("================================\n");

    return res.status(500).json({
      success: false,
      message: "Customer Shipment Booking Failed",
      error: error.message,
    });
  }
};