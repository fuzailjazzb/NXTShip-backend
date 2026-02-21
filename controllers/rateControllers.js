const axios = require("axios");

const calculateDelhiveryRate = async (req, res) => {
    console.log("🚚 Delhivery Rate API Hit");

    try {
        const { fromPincode, toPincode, weight, paymentType } = req.body;

        console.log("Incoming Data:", req.body);

        if (!fromPincode || !toPincode || !weight) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        const chargeWeight = weight * 1000; // KG to grams

        const url = `https://track.delhivery.com/api/kinko/v1/invoice/charges/.json`;

        const response = await axios.get(url, {
            params: {
                md: "E",
                ss: "Delivered",
                d_pin: toPincode,
                o_pin: fromPincode,
                cgm: chargeWeight,
                pt: paymentType || "Pre-paid"
            },
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${process.env.DELHIVERY_TOKEN}`
            }
        });

        console.log("✅ Delhivery Response:", response.data);

        return res.status(200).json({
            success: true,
            raw: response.data
        });

    } catch (error) {
        console.error("❌ Delhivery API Error:", error.response?.data || error.message);

        return res.status(500).json({
            success: false,
            message: "Rate fetch failed",
            error: error.response?.data || error.message
        });
    }
};

module.exports = { calculateDelhiveryRate };