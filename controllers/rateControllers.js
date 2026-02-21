const axios = require("axios");

const calculateDelhiveryRate = async (req, res) => {
    console.log("🚚 Delhivery Rate API Hit");

    try {
        const { fromPincode, toPincode, weight, paymentType } = req.body;

        console.log("Incoming Data:", req.body);

        if (!fromPincode || !toPincode || !weight) {
            console.log("❌ Missing Required Fields");
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        const chargeWeight = Number(weight) * 1000; // KG to grams

        console.log("Converted Weight (grams):", chargeWeight);

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

        console.log("Calculated Rate:", response.data.charge);

        const data = response.data || {};

        //safe extraction (Depends on Delhivery's response structure)

        const raw = Array.isArray(data) ? data[0] : data; // Handle both array and object responses
        if (!raw) {
            console.log("❌ No valid data found in response");
            return res.status(500).json({
                success: false,
                message: "No valid data found in response"
            });
        }

        const totalAmount = data?.totalAmount || data?.total || data?.invoice_amount || data.total_amount || 0;
        const freight = data?.freight_charge || data?.freight || data.charge_DL || 0;
        const fuelSurcharge = data?.fuel_surcharge || data?.fuel || data.charge_FS || 0;
        const codCharge = data?.cod_charges || data?.cod || data.charge_COD || data.charge_CCOD || 0;
        
        let gst = 0;
        if (data.tax_data) {
            gst = 
                (data.tax_data.SGST || 0) +
                (data.tax_data.CGST || 0) +
                (data.tax_data.IGST || 0);
        }

        console.log("Extracted Charges:", { freight, fuelSurcharge, codCharge, gst, totalAmount });

        return res.status(200).json({
            success: true,
            breakdown: {
                freight,
                codCharge,
                fuelSurcharge,
                gst,
                totalAmount
            },
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

