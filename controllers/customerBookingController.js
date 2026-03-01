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

    console.log("Controller Started.....")
    console.log("User From Middleware:", req.customer);
    console.log("Request Body:", req.body);

  try {
    console.log("🚀 Customer Shipment Booking Started");

    const shipmentData = req.body;

    req.user = req.customer;

    if (!req.user || !req.user._id){
        return res.status(401).json({
            success: false,
            message: "unauthorized usersss"
        });
    }

    shipmentData.customerId = req.user._id;

    console.log("USER:", req.user);
console.log("UserId:", req.user._id);

    /* =====================================================
       1️⃣ GET CUSTOMER + WALLET CHECK
    ====================================================== */

    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    /* =====================================================
       2️⃣ SHIPPING CHARGE (TEMP FIXED)
    ====================================================== */

    const shippingCharge = shipmentData.shippingCharge || 42.5;

    /* =====================================================
       3️⃣ COMMISSION CALCULATION
    ====================================================== */

    let commission = await Commission.findOne();

    if (!commission) {
      commission = {
        flatCommission: 10,
        percentageCommission: 0,
      };
    }

    const adminCommission =
      commission.flatCommission +
      (shippingCharge * commission.percentageCommission) / 100;

    const finalCharge = shippingCharge + adminCommission;

    console.log("💰 Final Charge:", finalCharge);

    /* =====================================================
       4️⃣ WALLET BALANCE CHECK (NO DEDUCTION YET)
    ====================================================== */

    if (customer.walletBalance < finalCharge) {
      return res.status(400).json({
        success: false,
        message: "Insufficient Wallet Balance. Please Recharge.",
      });
    }

    /* =====================================================
       5️⃣ DELHIVERY PAYLOAD
    ====================================================== */

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

    /* =====================================================
       6️⃣ CALL DELHIVERY API
    ====================================================== */

    console.log("Sending to Delhivery:", payload);

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

    console.log("📦 Delhivery Response:", response.data);

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

    /* =====================================================
       7️⃣ WALLET DEDUCTION (SAFE POINT)
    ====================================================== */

    console.log("Wallet Before:", customer.walletBalance);
    console.log("Charge:", finalCharge);

    customer.walletBalance -= finalCharge;

    customer.walletTransactions.unshift({
      amount: finalCharge,
      type: "debit",
      message: "Shipment Booking Charge Deducted",
      date: new Date(),
    });

    await customer.save();

    console.log("💳 Wallet Deducted. New Balance:", customer.walletBalance);

    /* =====================================================
       8️⃣ SAVE SHIPMENT
    ====================================================== */

    const newShipment = await Shipment.create({
      ...shipmentData,
      waybill,
      status: "Booked",
      customerId,
    });

    /* =====================================================
       9️⃣ ADMIN EARNING
    ====================================================== */

    await AdminEarning.create({
      customerId,
      shipmentId: newShipment._id,
      amount: adminCommission,
    });

    /* =====================================================
       🔟 REFERRAL LIFETIME INCOME
    ====================================================== */

    if (customer.referredBy) {
      const REFERRAL_PERCENT = 0.25;

      const referralAmount = (finalCharge * REFERRAL_PERCENT) / 100;

      const referrer = await Customer.findById(customer.referredBy);

      if (referrer) {
        referrer.walletBalance += referralAmount;
        referrer.referralEarnings += referralAmount;

        referrer.walletTransactions.unshift({
          amount: referralAmount,
          type: "credit",
          message: "Referral Lifetime Income",
          date: new Date(),
        });

        await referrer.save();

        await ReferralEarning.create({
          referrerId: referrer._id,
          customerId: customer._id,
          shipmentId: newShipment._id,
          earning: referralAmount,
        });

        console.log("🎁 Referral Income Added:", referralAmount);
      }
    }

    /* =====================================================
       ✅ SUCCESS RESPONSE
    ====================================================== */

    console.log("Shipment Created:", waybill);

    return res.status(201).json({
      success: true,
      message: "Shipment Created Successfully 🚀",
      waybill,
      trackingId: waybill,
      shipment: newShipment,
      walletBalance: customer.walletBalance,
    });
  } catch (error) {
    console.log(
      "❌ Customer Booking Error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      success: false,
      message: "Customer Shipment Booking Failed ❌",
      error: error.response?.data || error.message,
    });
  }
};