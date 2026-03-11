const axios = require("axios");

module.exports = async function shipfastLabel(shipment) {

    try {

        console.log("=======================================");
        console.log("📦 SHIPFAST LABEL GENERATOR");
        console.log("AWB:", shipment.waybill);
        console.log("=======================================");

        const awb = shipment.waybill;

        const labelUrl = `https://shipfast.com/api/label/${awb}`;

        console.log("Calling Delhivery API:", labelUrl);

        return {
            labelUrl: labelUrl,
            awb: awb
        };

    }

    catch (error) {

        console.log("❌ Shipfast Label Error");

        throw new Error("Shipfast label failed");

    }

};