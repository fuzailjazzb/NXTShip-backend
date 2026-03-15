const axios = require("axios");
const Shipment = require("../../models/shipment");
const Warehouse = require("../../models/warehouse");

module.exports = async function delhiveryLabel(req, res) {

  try {

    console.log("========== DELHIVERY LABEL GENERATOR ==========");

    const shipmentId = req.params.id;

    console.log("Fetching Shipment:", shipmentId);

    const shipment = await Shipment.findById(shipmentId)
      .populate("customerId");

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found"
      });
    }

    const awb = shipment.waybill || shipment.awb;

    if (!awb) {
      return res.status(400).json({
        success: false,
        message: "AWB missing in shipment"
      });
    }

    console.log("AWB Found:", awb);

    const delivery = shipment.delivery || {};
    const pickup = shipment.pickup || {};
    const product = shipment.product || {};
    const seller = shipment.seller || {};

    console.log("Receiver:", delivery.customerName);
    console.log("Receiver Address:", delivery.address);

    const url = `https://track.delhivery.com/api/p/packing_slip?wbns=${awb}&pdf=true`;

    console.log("Calling Delhivery API:", url);

    const response = await axios.get(url, {
      headers: {
        Authorization: `Token ${process.env.DELHIVERY_TOKEN}`,
        "Content-Type": "application/json"
      },
      responseType: "arraybuffer"
    });

    console.log("Delhivery API Success");

    return res.json({
      success: true,
      shipment: {
        id: shipment._id,
        orderId: shipment.orderId,
        productName: shipment.productName,
        paymentMode: shipment.paymentMode,
        status: shipment.status,
        courier: shipment.courier,
        waybill: shipment.waybill,

        delivery: {
          name: delivery.customerName,
          phone: delivery.phone,
          address: delivery.address,
          city: delivery.city,
          state: delivery.state,
          pincode: delivery.pincode
        },

        pickup: {
          name: pickup.name,
          phone: pickup.phone,
          address: pickup.address,
          city: pickup.city,
          state: pickup.state,
          pincode: pickup.pincode
        },

        product: {
          name: product.productName,
          quantity: product.quantity,
          weight: product.weight,
          orderValue: product.orderValue
        },

        seller: {
          name: seller.sellerName,
          gst: seller.gst
        }

      },

      label: {
        awb: awb,
        labelUrl: url,
        labelData: response.data
      }

    });

  }

  catch (error) {

    console.log("===== DELHIVERY LABEL ERROR =====");

    if (error.response) {
      console.log(error.response.data);
    } else {
      console.log(error.message);
    }

    return res.status(500).json({
      success: false,
      message: "Delhivery label generation failed"
    });

  }

};