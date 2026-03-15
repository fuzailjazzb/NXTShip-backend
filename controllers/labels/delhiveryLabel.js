const axios = require("axios");

module.exports = async function delhiveryLabel(shipment) {

  try {

    console.log("========== DELHIVERY LABEL GENERATOR ==========");

    if (!shipment) {
      throw new Error("Shipment object missing");
    }

    console.log("Shipment ID:", shipment._id);
    console.log("Courier:", shipment.courier);
    console.log("Order ID:", shipment.orderId);


    // SAFE FIELD EXTRACTION
    const delivery = shipment.delivery || {};
    const pickup = shipment.pickup || {};
    const product = shipment.product || {};
    const seller = shipment.seller || {};


    // SAFE AWB DETECTION
    const awb = shipment.waybill || shipment.awb;

    if (!awb) {
      throw new Error("AWB missing in shipment");
    }

    console.log("AWB:", awb);


    // DELHIVERY LABEL API
    const url =
      `https://track.delhivery.com/api/p/packing_slip?wbns=${awb}&pdf=true`;

    console.log("Calling Delhivery API:", url);


    // CALL DELHIVERY
    const response = await axios.get(url, {

      headers: {
        Authorization: `Token ${process.env.DELHIVERY_TOKEN}`,
        "Content-Type": "application/json"
      },

      responseType: "arraybuffer"

    });

    console.log("Delhivery label generated successfully");


    // RETURN SAFE STRUCTURE
    return {

      awb: awb,

      labelUrl: url,

      labelData: response.data,

      shipmentData: {

        orderId: shipment.orderId || null,

        paymentMode: shipment.paymentMode || null,

        status: shipment.status || null,

        courier: shipment.courier || null,


        delivery: {

          name: delivery.customerName || null,

          phone: delivery.phone || null,

          address: delivery.address || null,

          city: delivery.city || null,

          state: delivery.state || null,

          pincode: delivery.pincode || null

        },

        pickup: {

          name: pickup.name || null,

          phone: pickup.phone || null,

          address: pickup.address || null,

          city: pickup.city || null,

          state: pickup.state || null,

          pincode: pickup.pincode || null

        },

        product: {

          name: product.productName || null,

          quantity: product.quantity || null,

          weight: product.weight || null,

          orderValue: product.orderValue || null

        },

        seller: {

          name: seller.sellerName || null,

          gst: seller.gst || null

        }

      }

    };

  }

  catch (error) {

    console.log("====== DELHIVERY LABEL ERROR ======");

    if (error.response) {

      console.log("Delhivery API Error:", error.response.data);

    } else {

      console.log("Internal Error:", error.message);

    }

    throw new Error("Delhivery label failed");

  }

};