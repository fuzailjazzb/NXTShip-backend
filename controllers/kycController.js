const Kyc = require("../models/kyc");

// submit kyc

exports.submitKyc = async (req, res) => {

  try {

    const userId = req.user.id;

    console.log("📥 KYC BODY:", req.body);
    console.log("📸 FILE:", req.file);

    const { type, name, number } = req.body;

    if (!type || !name || !number || !req.file) {
      return res.status(400).json({
        success: false,
        message: "All fields required"
      });
    }

    const existing = await Kyc.findOne({ userId });

    const kycData = {
      userId,
      type,
      details: {
        name,
        number
      },
      documentUrl: `uploads/kyc/${req.file.filename}`,
      status: "pending"
    };

    /* =========================
       🔥 UPDATE OR CREATE
    ========================== */

    if (existing) {

      console.log("🔄 Updating existing KYC");

      await Kyc.updateOne({ userId }, kycData);

    } else {

      console.log("🆕 Creating new KYC");

      await Kyc.create(kycData);

    }

    return res.json({
      success: true,
      message: "KYC submitted"
    });

  } catch (err) {

    console.log("❌ KYC ERROR:", err.message);

    return res.status(500).json({
      success: false
    });

  }
};

// GET USER KYC

exports.getKyc = async (req, res) => {

    try {

        const userId = req.user.id;

        console.log("📥 Fetching KYC for user:", userId);

        const kyc = await Kyc.findOne({ userId });

        if (!kyc) {
            return res.json({
                success: true,
                data: null
            });
        }

        return res.json({
            success: true,
            data: kyc
        });

    } catch (err) {

        console.log("❌ KYC Fetch Error:", err.message);

        return res.status(500).json({
            success: false
        });

    }
};