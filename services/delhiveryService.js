const axios = require("axios");

const DELHIVERY_URL = "https://track.delhivery.com/api/cmu/create.json";

exports.CreateShipmentOnDelhivery = async (shipmentData) => {
    const payload = `format=json&data=${JSON.stringify({
        shipments: [
            {
                name: shipmentData.customerName,
                add: shipmentData.address,
                pin: shipmentData.pincode,
                city: shipmentData.city,
                state: shipmentData.state,
                country: "India",
                phone: shipmentData.phone,

                order: shipmentData.orderId,
                payment_mode: shipmentData.paymentMode,

                shipment_width: "10",
                shipment_height: "10",
                weight: "1",
                shipping_mode: "Surface"
            }
        ],
        pickup_location: {
            name: process.env.PICKUP_LOCATION || "KING NXT"
        }
    })}`;   

    const response = await axios.post(DELHIVERY_URL, payload, {
        headers: {
            Authorization: `Token ${process.env.ICC_TOKEN}`,
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded"
        },
        timeout: 20000
    });

    return response.data;
};