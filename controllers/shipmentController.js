const axios = require("axios");
const Shipment = require("../models/shipment");
const Warehouse = require("../models/warehouse");
const Customer = require("../models/customer");
const Commission = require("../models/commission");
const AdminEarning = require("../models/adminEarning");
const ReferralEarning = require("../models/referralEarning");

const { createCustomerFromShipment } = require("./customerController");
const { fetchWaybill } = require("../services/delhiveryService");

/**
 * ✅ BOOK SHIPMENT (DELHIVERY FINAL SIMPLE)
 * Frontend से direct fields आएंगे:
 * customerName, phone, address, city, state, pincode, orderId, paymentMode
 */


exports.bookShipment = async (req, res) => {
  console.log("\n================ CONTROLLER HIT =================");
  console.log("⏰ Time:", new Date().toISOString());
  console.log("➡️ Route Hit: /api/customer/shipment/book");

  try {

    /* =====================================================
       STEP 0 — REQUEST DEBUG
    ====================================================== */

    console.log("🔎 Middleware Customer:", req.user);
    console.log("🔎 Request Headers:", req.headers);
    console.log("🔎 Request Body:", req.body);

    const shipmentData = req.body;

    console.log("✅ Body Parsed Successfully");

    /* ==================== NAYA SMART CODE ==================== */
    let customerId = req.user?.id || req.user?._id;
    const isAdmin = (req.admin && req.admin.email) || (req.user && req.user.email === 'admin@nxtships.in');

    console.log("👤 Initial req.user:", req.user);
    console.log("Is Admin Booking?", !!isAdmin);

    // Agar Admin book kar raha hai, toh uske paas ID nahi hogi. 
    // Isliye hum selected warehouse se Customer/User ki ID nikalenge.
    if (isAdmin && !customerId) {
        console.log("🔎 Fetching Customer ID from selected Warehouse...");
        const warehouse = await Warehouse.findById(shipmentData.warehouseId);
        
        if (warehouse) {
            // Aapke DB schema me warehouse object ke andar user/customer ki id jis bhi key me save hoti hai, wo yahan likhein (mostly userId ya user hoti hai)
            customerId = warehouse.userId || warehouse.user || warehouse.customerId;
            console.log("✅ Extracted Customer ID from Warehouse:", customerId);
        } else {
            return res.status(404).json({ success: false, message: "Selected Warehouse not found in DB" });
        }
    }

    // Final Check: Agar kisi bhi tareeqe se ID nahi mili toh block kardo
    if (!customerId) {
      console.log("❌ USER INVALID OR MISSING (Cannot find customer to bill)");
      return res.status(401).json({
        success: false,
        message: "unauthorized usersss"
      });
    }

    shipmentData.customerId = customerId;
    console.log("✅ Final CustomerId attached to shipment:", shipmentData.customerId);
    /* ========================================================= */

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
       STEP 1.5 — fetch Warehouse
    ====================================================== */

    console.log("Fetching Warehouse...");
    console.log("Incoming Warehouse Id :", shipmentData.warehouseId);
    console.log("Type Of Warehouse : ", typeof shipmentData.warehouseId);

    if (!shipmentData.warehouseId) {
      console.log("~~~~~~~~~ Warehouse Not Recieved From Frontend ~~~~~~~~~");
    }

    const warehouse = await Warehouse.findById(shipmentData.warehouseId);

    console.log("Warehouse DB Result : ", warehouse);
    console.log("Warehouse DB Response");

    if (!warehouse) {
      console.log("Warehouse not found in db");

      return res.status(404).json({
        success: true,
        message: "Warehouse Not Found"
      });
    }

    console.log("Warehouse Found", warehouse.name);

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
        email: shipmentData.email || "",

        order: shipmentData.orderId,

        payment_mode: shipmentData.paymentMode,

        products_desc: shipmentData.productName || "General Item",
        hsn_code: shipmentData.hsnCode || "6109",
        cod_amount:
          shipmentData.paymentMode === "COD"
            ? shipmentData.orderValue
            : 0,

        total_amount: shipmentData.orderValue,

        quantity: shipmentData.quantity || "1",

        shipment_length: shipmentData.length || "10",
        shipment_width: shipmentData.width || "10",
        shipment_height: shipmentData.height || "10",

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

        sku: shipmentData.sku || "SKU001",
        order_channel: shipmentData.orderChannel || "Manual"
      }],
      pickup_location: { name: shipmentData.pickupLocation || "KING NXT" },
    };

    console.log("📤 Payload Ready");
    console.log(JSON.stringify(payload, null, 2));

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
    console.log("Packages : ", response.data?.packages);
    console.log("First Package : ", response.data?.packages?.[0]);


    if (response.data?.packages?.[0]?.serviceable === false) {
      return res.status(400).json({
        success: false,
        message: "Delhivery not serviceable for this pin code"
      });
    };

    const waybill =
      response.data?.packages?.[0]?.waybill ||
      response.data?.packages?.[0]?.waybill_number;



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
===================================================== */

    console.log("💾 Saving Shipment...");

    console.log("ShipmentData Received:", shipmentData);
    console.log("Warehouse Object:", warehouse);
    console.log("waybill : ", waybill);

    const newShipment = await Shipment.create({

      /* =========================
         BASIC ORDER INFO
      ========================== */

      orderId: shipmentData.orderId,
      orderNumber: shipmentData.orderNumber || null,
      courier: "delhivery",
      waybill: waybill,
      status: "Booked",
      paymentMode: shipmentData.paymentMode,
      createdAt: new Date(),
      customerId: shipmentData.customerId,
      warehouseId: warehouse.id,
      productName: shipmentData.productName || "General Item",

      /*=========================
        DELIVERY ADDRESS
        =========================*/

      delivery: {
        customerName: shipmentData.customerName,
        phone: shipmentData.phone,
        address: shipmentData.address,
        city: shipmentData.city,
        state: shipmentData.state,
        pincode: shipmentData.pincode
      },

      /* =========================
         PICKUP (WAREHOUSE)
      ========================= */

      pickup: {
        name: warehouse.name,
        phone: warehouse.phone,
        address: warehouse.address,
        city: warehouse.city,
        state: warehouse.state,
        pincode: warehouse.pincode
      },

      /* =========================
         PRODUCT DETAILS
      ========================= */

      product: {
        productName: shipmentData.productName || "General Item",
        quantity: shipmentData.quantity || 1,
        weight: shipmentData.weight || 0.5,
        orderValue: shipmentData.orderValue || 0
      },

      /* =========================
         SELLER DETAILS
      ========================= */

      seller: {
        sellerName: warehouse.name,
        gst: shipmentData.sellerGST || "NA"
      }

    });

    console.log("✅ Shipment Saved Successfully");
    console.log("Shipment ID:", newShipment.id);
    console.log("OrderId:", newShipment.orderId);
    console.log("Waybill:", newShipment.waybill);
    console.log("Pickup Warehouse:", newShipment.pickup);
    console.log("Delivery Address:", newShipment.delivery);

    /* =====================================================
       SUCCESS
    ====================================================== */

    console.log("🎉 BOOKING SUCCESS");

    return res.status(201).json({
      success: true,
      message: "Shipment Created Successfully",
      waybill,
      trackingId: shipmentData.orderId,
      orderId: shipmentData.orderId,
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

/**
 * ✅ GET ALL SHIPMENTS (Dashboard + View Shipments)
 */
exports.getAllShipments = async (req, res) => {
  try {
    const shipments = await Shipment.find().sort({ createdAt: -1 });

    return res.json({
      success: true,
      total: shipments.length,
      shipments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch shipments ❌",
      error: error.message,
    });
  }
};

/**
 * ✅ TRACK SHIPMENT (Waybill Tracking)
 */
exports.trackShipment = async (req, res) => {
  try {
    const { awb } = req.params;

    const shipment = await Shipment.findOne({ waybill: awb });

    if (!shipment) {
      return res.json({
        success: false,
        message: "Shipment not found for this Waybill ❌",
      });
    }

    return res.json({
      success: true,
      shipment,
      status: shipment.status || "Booked",
      log: shipment.city || "N/A",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Tracking Failed ❌",
      error: error.message,
    });
  }
};

/**
 * ✅ DELHIVERY TRACKING API CALL (External Tracking)
 */
exports.delhiveryTracking = async (req, res) => {
  try {
    const { waybill } = req.params;

    const url = `https://track.delhivery.com/api/v1/packages/json/?waybill=${waybill}`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Token ${process.env.ICC_TOKEN}`,
        Accept: "application/json",
      },
    });

    return res.json({
      success: true,
      waybill,
      tracking: response.data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Tracking Failed ❌",
      error: error.response?.data || error.message,
    });
  }
};

/**
 * ✅ CANCEL SHIPMENT (Local Cancel Only)
 */
exports.cancelShipment = async (req, res) => {
  try {
    const shipmentId = req.params.id;

    const shipment = await Shipment.findById(shipmentId);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found ❌",
      });
    }

    shipment.status = "Cancelled";
    await shipment.save();

    return res.json({
      success: true,
      message: "Shipment Cancelled Successfully ✅",
      shipment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Cancel Failed ❌",
      error: error.message,
    });
  }
};

exports.checkPinSrvice = async (req, res) => {
  try {
    const pincode = req.params.pincode || req.params.pin;

    if (!pincode || pincode.length !== 6) {
      return res.status(400).json({
        success: false,
        message: "Pincode is required ❌",
      });
    }

    const url = `https://track.delhivery.com/c/api/pin-codes/json/?filter_codes=${pincode}`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Token ${process.env.ICC_TOKEN}`,
      },
    });

    return res.json({
      success: true,
      pincode,
      data: response.data,
    });
  } catch (error) {

    console.log("❌ Pincode Check Error:", error.response?.data || error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to check pincode service ❌",
      error: error.message,
    });
  }
}; 

exports.refundShipment = async (req, res) => {
  try {
    console.log("=======================================");
    console.log("✅ REFUND API HIT");
    
    const shipmentId = req.params.id;
    const { refundAmount } = req.body;

    console.log(`➡️ Shipment ID: ${shipmentId}, Refund Amount: ₹${refundAmount}`);

    // 1. Check if Amount is valid
    if (!refundAmount || isNaN(refundAmount) || refundAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid refund amount provided",
      });
    }

    // 2. Find the Shipment
    const shipment = await Shipment.findById(shipmentId);
    
    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    // 3. Check if already refunded to prevent double refund
    if (shipment.refundStatus === "Refunded") {
      return res.status(400).json({
        success: false,
        message: "This shipment has already been refunded.",
      });
    }

    // 4. Update Shipment Data
    shipment.refundStatus = "Refunded";
    shipment.refundedAmount = parseFloat(refundAmount);
    // Agar refund ke baad status change karna ho toh uncomment karein:
    shipment.status = "Cancelled"; 
    
    await shipment.save();

    // 5. Update Customer's Wallet Balance (Optional but recommended)
    
    // Step 5 Update
if (shipment.customerId) {
  const customer = await Customer.findById(shipment.customerId);
  if (customer) {
    customer.walletBalance = (customer.walletBalance || 0) + parseFloat(refundAmount);
    await customer.save();
    console.log(`💰 Added ₹${refundAmount} to customer's wallet.`);
  }
}

    console.log("🎉 REFUND PROCESSED SUCCESSFULLY");
    console.log("=======================================");

    return res.status(200).json({
      success: true,
      message: `Refund of ₹${refundAmount} processed successfully`,
      shipment
    });

  } catch (err) {
    console.log("=======================================");
    console.error("🔥 REFUND ERROR OCCURRED");
    console.error(err);
    console.log("=======================================");

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};