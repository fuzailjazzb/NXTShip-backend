const axios = require("axios");

const calculateDelhiveryRate = async (req, res) => {
    console.log("🚀 Delhivery Rate API Hit");

    try {
        const { fromPincode, toPincode, weight, paymentType } = req.body;

        console.log("📥 Incoming Data:", req.body);

        if (!fromPincode || !toPincode || !weight) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        const chargeWeight = Number(weight) * 1000;
        console.log("⚖ Converted Weight (grams):", chargeWeight);

        const response = await axios.get(
            "https://track.delhivery.com/api/kinko/v1/invoice/charges/.json",
            {
                params: {
                    md: "E",
                    ss: "Delivered",
                    d_pin: toPincode,
                    o_pin: fromPincode,
                    cgm: chargeWeight,
                    pt: paymentType || "Pre-paid"
                },
                headers: {
                    Authorization: `Token ${process.env.DELHIVERY_TOKEN}`
                }
            }
        );

        console.log("✅ Delhivery Response:", response.data);

        // 🔥 Proper safe handling
        let raw = null;

        if (Array.isArray(response.data) && response.data.length > 0) {
            raw = response.data[0];
        } else if (typeof response.data === "object") {
            raw = response.data;
        }

        if (!raw) {
            console.log("⚠ Empty rate response from Delhivery");
            return res.status(200).json({
                success: false,
                message: "No rate available for this shipment"
            });
        }

        // 🔥 Extraction
        const freight = raw.charge_DL || 0;
        const fuelSurcharge = raw.charge_FS || 0;
        const codCharge =
            raw.charge_COD || raw.charge_CCOD || 0;
        const totalAmount = raw.total_amount || 0;

        let gst = 0;
        if (raw.tax_data) {
            gst =
                (raw.tax_data.SGST || 0) +
                (raw.tax_data.CGST || 0) +
                (raw.tax_data.IGST || 0);
        }

        console.log("💰 Final Breakdown:", {
            freight,
            fuelSurcharge,
            codCharge,
            gst,
            totalAmount
        });

        return res.status(200).json({
            success: true,
            breakdown: {
                freight,
                fuelSurcharge,
                codCharge,
                gst,
                totalAmount
            }
        });

    } catch (error) {
        console.error(
            "❌ Delhivery API Error:",
            error.response?.data || error.message
        );

        return res.status(500).json({
            success: false,
            message: "Rate fetch failed",
            error: error.response?.data || error.message
        });
    }
};

const getDelhiveryRate = async (fromPincode, toPincode, weight, paymentType) => {
    try {

        if (!fromPincode || !toPincode || !weight) {
            throw new Error("Missing required fields for Delhivery rate");
        }

        // kg → grams
        const chargeWeight = Math.ceil(Number(weight) * 1000);

        console.log("📦 Delhivery Rate API Hit");
        console.log("From:", fromPincode);
        console.log("To:", toPincode);
        console.log("Weight (grams):", chargeWeight);

        const response = await axios.get(
            "https://track.delhivery.com/api/kinko/v1/invoice/charges/.json",
            {
                params: {
                    md: "E",
                    ss: "Delivered",
                    d_pin: toPincode,
                    o_pin: fromPincode,
                    cgm: chargeWeight,
                    pt: paymentType || "Pre-paid"
                },
                headers: {
                    Authorization: `Token ${process.env.DELHIVERY_TOKEN}`
                }
            }
        );

        console.log("📦 Delhivery API Response:", response.data);

        const data = response.data?.[0];

        if (!data) {
            return null;
        }

        return {
            price: data.total_amount || 0,
            estimatedDays: data.estimated_days || 4
        };

    } catch (error) {

        console.log("❌ Delhivery Rate Error:", error.message);

        return null;

    }
}

module.exports = { calculateDelhiveryRate, getDelhiveryRate };