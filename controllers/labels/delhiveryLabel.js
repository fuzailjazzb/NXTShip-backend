const axios = require("axios");

module.exports = async function delhiveryLabel(shipment) {

  try {

    console.log("DELHIVERY LABEL GENERATOR");

    const awb = shipment.waybill;

    const url =
      `https://track.delhivery.com/api/p/packing_slip?wbns=${awb}&pdf=true`;

    console.log("Calling Delhivery API:", url);

    const res = await axios.get(url, {
      headers: {
        Authorization: `Token ${process.env.DELHIVERY_TOKEN}`,
        "Content-Type": "application/json"
      }
    });

    console.log("Delhivery Response:", res.data);

    return {
      awb: awb,
      labelUrl: url,
      data: res.data
    };

  } catch (error) {

    console.log("Delhivery Label Error");
    console.log(error.response?.data || error.message);

    throw new Error("Delhivery label failed");

  }

};