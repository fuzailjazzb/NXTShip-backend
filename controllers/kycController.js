const Kyc = require("../models/kyc");

exports.submitKyc = async (req, res) => {

    try {

        console.log("📥 Incoming KYC Request");

        const { type, name, number } = req.body;
        const file = req.file;

        const userId = req.user.id;

        console.log("📦 Body:", req.body);
        console.log("📦 File:", file);

        if (!type || !name || !number || !file) {
            return res.status(400).json({
                success: false,
                message: "Missing fields"
            });
        }

        let details = {};

        /* =========================
           🔥 SWITCH VALIDATION
        ========================== */

        switch (type) {

            case "aadhaar":
                if (!number.match(/^\d{12}$/)) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid Aadhaar"
                    });
                }
                details = { name, number };
                break;

            case "pan":
                if (!number.match(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid PAN"
                    });
                }
                details = { name, number };
                break;

            case "gst":
                details = { name, number };
                break;

            case "bank":
                details = { name, number };
                break;

            default:
                return res.status(400).json({
                    success: false,
                    message: "Invalid KYC type"
                });
        }

        /* =========================
           💾 SAVE
        ========================== */

        const kyc = await Kyc.create({
            userId,
            type,
            details,
            documentUrl: file.path // 🔥 IMAGE SAVE
        });

        console.log("✅ KYC SAVED:", kyc._id);

        return res.json({
            success: true,
            message: "KYC Submitted",
            data: kyc
        });

    } catch (error) {

        console.log("❌ KYC ERROR:", error.message);

        return res.status(500).json({
            success: false,
            message: "KYC failed"
        });

    }
};