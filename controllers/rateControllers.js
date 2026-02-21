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

        //handle array response
        const responseData = response.data;
        const raw = Array.isArray(responseData) ? responseData[0] : responseData;

        if (!raw || !raw.data) {
            console.log("❌ No valid data in Delhivery response");
            return res.status(500).json({
                success: false,
                message: "No valid data in Delhivery response"
            });
        }


        const totalAmount = raw.totalAmount || raw.total || raw.invoice_amount || raw.total_amount || 0;
        const freight = raw.freight_charge || raw.freight || raw.charge_DL || 0;
        const fuelSurcharge = raw.fuel_surcharge || raw.fuel || raw.charge_FS || 0;
        const codCharge = raw.cod_charges || raw.cod || raw.charge_COD || raw.charge_CCOD || 0;
        
        let gst = 0;
        if (raw.tax_data) {
            gst = 
                (raw.tax_data.SGST || 0) +
                (raw.tax_data.CGST || 0) +
                (raw.tax_data.IGST || 0);
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

