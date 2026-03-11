const axios = require("axios");

module.exports = async function ekartLabel(shipment) {

    try {

        console.log("=======================================");
        console.log("📦 EKART LABEL GENERATOR");
        console.log("AWB:", shipment.waybill);
        console.log("=======================================");

        const awb = shipment.waybill;

        const labelUrl = `https://ekartlogistics.com/label/${awb}`;

        console.log("Calling Delhivery API:", labelUrl);
        
        return {
            labelUrl: labelUrl,
            awb: awb
        };

    }

    catch (error) {

        console.log("❌ Ekart Label Error");

        throw new Error("Ekart label failed");

    }

};