const axios = require("axios");

module.exports = async function delhiveryLabel(shipment) {

    try {

        console.log("=======================================");
        console.log("📦 DELHIVERY LABEL GENERATOR");
        console.log("AWB:", shipment.waybill);
        console.log("=======================================");

        const awb = shipment.waybill;

        const labelUrl = `https://track.delhivery.com/api/p/packing_slip?wbns=${awb}`;

        console.log("Calling Delhivery API:", labelUrl);

        return res.json({
            success: true,
            labelUrl: labelUrl,
            awb: labelResponse.awb
        });

    }

    catch (error) {

        console.log("❌ Delhivery Label Error");
        console.log(error);

        throw new Error("Delhivery label failed");

    }

};