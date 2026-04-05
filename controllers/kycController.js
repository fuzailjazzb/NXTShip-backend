const cloudinary = require("../config/cloudinary");
const KycModel = require("../models/kyc");

/* =====================================================
   🚀 SUBMIT KYC
===================================================== */

exports.submitKyc = async (req, res) => {

  console.log("\n========== 🚀 KYC SUBMIT START ==========");

  try {

    /* =========================
       🧾 USER INFO
    ========================== */

    console.log("👤 req.user:", req.user);

    const userId = req.user?.id;

    if (!userId) {
      console.log("❌ No userId found");
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    console.log("✅ userId:", userId);

    /* =========================
       📥 BODY + FILE
    ========================== */

    console.log("📦 req.body:", req.body);
    console.log("📂 req.file:", req.file);

    const { type, name, number } = req.body;
    const file = req.file;

    console.log("📥 Extracted:", { type, name, number });

    /* =========================
       ❌ VALIDATION
    ========================== */

    if (!type || !name || !number || !file) {
      console.log("❌ Validation Failed:", {
        typeMissing: !type,
        nameMissing: !name,
        numberMissing: !number,
        fileMissing: !file
      });

      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    console.log("✅ Validation Passed");

    /* =========================
       ☁️ CLOUDINARY UPLOAD
    ========================== */

    console.log("☁️ Starting Cloudinary upload...");
    console.log("📏 File size:", file.size);
    console.log("📄 File mimetype:", file.mimetype);

    let uploadResult;

    try {

      uploadResult = await new Promise((resolve, reject) => {

        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "kyc_documents",
            resource_type: "image"
          },
          (error, result) => {

            if (error) {
              console.log("❌ Cloudinary Upload Error:", error);
              reject(error);
            } else {
              console.log("✅ Cloudinary Raw Result:", result);
              resolve(result);
            }

          }
        );

        console.log("📤 Sending buffer to Cloudinary...");
        stream.end(file.buffer);

      });

    } catch (uploadError) {

      console.log("🔥 Upload Failed:", uploadError);

      return res.status(500).json({
        success: false,
        message: "Cloudinary upload failed"
      });
    }

    console.log("🌐 Cloudinary URL:", uploadResult.secure_url);

    /* =========================
       🔍 CHECK EXISTING KYC
    ========================== */

    console.log("🔍 Checking existing KYC...");

    let existingKyc;

    try {
      existingKyc = await KycModel.findOne({ user: userId });
      console.log("📦 Existing KYC:", existingKyc);
    } catch (dbError) {
      console.log("❌ DB Find Error:", dbError);
    }

    if (existingKyc) {
      console.log("🔄 Updating existing KYC...");
    } else {
      console.log("🆕 Creating new KYC...");
    }

    /* =========================
       💾 SAVE / UPDATE DB
    ========================== */

    const kycData = {
      user: userId,
      type,
      details: {
        name,
        number
      },
      documentUrl: uploadResult.secure_url,
      status: "pending"
    };

    console.log("💾 Saving KYC Data:", kycData);

    let savedKyc;

    try {

      savedKyc = await KycModel.findOneAndUpdate(
        { user: userId },
        kycData,
        { upsert: true, new: true }
      );

      console.log("✅ DB Save Success:", savedKyc);

    } catch (saveError) {

      console.log("❌ DB Save Error:", saveError);

      return res.status(500).json({
        success: false,
        message: "Database save failed"
      });
    }

    /* =========================
       ✅ FINAL RESPONSE
    ========================== */

    console.log("🎉 KYC SUBMIT SUCCESS");
    console.log("========== 🚀 KYC SUBMIT END ==========\n");

    return res.json({
      success: true,
      message: "KYC submitted successfully",
      data: savedKyc
    });

  } catch (error) {

    console.log("💥 UNKNOWN ERROR:", error);
    console.log("========== ❌ KYC SUBMIT FAILED ==========\n");

    return res.status(500).json({
      success: false,
      message: "KYC submission failed"
    });
  }
};


/* =====================================================
   📥 GET KYC
===================================================== */

exports.getKyc = async (req, res) => {

  console.log("\n========== 📥 GET KYC START ==========");

  try {

    console.log("👤 req.user:", req.user);

    const userId = req.user?.id;

    if (!userId) {
      console.log("❌ No userId found");
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    console.log("🔍 Fetching KYC for user:", userId);

    let kyc;

    try {
      kyc = await KycModel.findOne({ user: userId });
      console.log("📦 DB Result:", kyc);
    } catch (dbError) {
      console.log("❌ DB Fetch Error:", dbError);
    }

    if (!kyc) {
      console.log("⚠️ No KYC found");
      console.log("========== 📥 GET KYC END ==========\n");

      return res.json({
        success: true,
        data: null
      });
    }

    console.log("✅ KYC Found");
    console.log("========== 📥 GET KYC END ==========\n");

    return res.json({
      success: true,
      data: kyc
    });

  } catch (error) {

    console.log("💥 GET KYC ERROR:", error);
    console.log("========== ❌ GET KYC FAILED ==========\n");

    return res.status(500).json({
      success: false,
      message: "Failed to fetch KYC"
    });
  }
};
