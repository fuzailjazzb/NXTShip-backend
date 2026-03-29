const axios = require("axios");

let cachedToken = null;
let tokenExpiry = null;

exports.getToken = async () => {
  try {

    if (cachedToken && tokenExpiry && new Date() < tokenExpiry) {
      console.log("🔑 Using cached Shipfast token");
      return cachedToken;
    }

    console.log("🔑 Generating new Shipfast token...");

    const res = await axios.post(
      "https://shazam.velocity.in/custom/api/v1/auth-token",
      {
        username: process.env.SHIPFAST_USERNAME,
        password: process.env.SHIPFAST_PASSWORD
      }
    );

    cachedToken = res.data.token;
    tokenExpiry = new Date(res.data.expires_at);

    console.log("✅ Token Generated:", cachedToken);

    return cachedToken;

  } catch (err) {
    console.error("❌ Shipfast Auth Error:", err.response?.data || err.message);
    throw new Error("Shipfast Auth Failed");
  }
};