const { bookShipment: bookDelhiveryShipment } = require("./shipmentController");
const { bookEkartShipment } = require("./courier/ekartController");
const { getEkartRate } = require("./courier/ekartController");
const { getDelhiveryRate } = require("./rateControllers");

const delhiveryLabel = require("../controllers/labels/delhiveryLabel");
const ekartLabel = require("../controllers/labels/ekart/Label");
const shipfastLabel = require("../controllers/labels/shipfastLabel");

/* =====================================================
   COURIER ENGINE
   - User chooses courier
   - System recommends best courier
===================================================== */

exports.bookShipment = async (req, res) => {

    try {

        console.log("🚚 COURIER ENGINE STARTED");

        const courier = req.body.courier;

        console.log("User Selected Courier:", courier);

        /* =====================================================
           IF NO COURIER SELECTED
        ===================================================== */

        if (!courier) {
            return res.status(400).json({
                success: false,
                message: "Courier Not Selected"
            })
        }

        /* =====================================================
           DELHIVERY COURIER
        ===================================================== */

        if (courier === "delhivery") {

            console.log("Using Delhivery");

            return bookDelhiveryShipment(req, res);
        }

        /* =====================================================
           EKART COURIER
        ===================================================== */

        if (courier === "ekart") {

            console.log("Using Ekart");

            return bookEkartShipment(req, res);

        }

        /* =====================================================
           UNKNOWN COURIER
        ===================================================== */

        return res.status(400).json({
            success: false,
            message: "Invalid courier selected"
        });

    } catch (error) {

        console.log("❌ Courier Engine Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Courier engine failed"
        });

    }

};



/* =====================================================
   GET COURIER RECOMMENDATIONS
   (Cheapest & Fastest)
===================================================== */

exports.getCourierRecommendations = async (req, res) => {

    try {

        console.log("🚚 Getting courier recommendations");
        console.log("request body in courier engine", req.body);

        const { fromPincode, toPincode, weight, paymentType } = req.body;

        console.log("fromPincode", fromPincode);
        console.log("topincode", toPincode);
        console.log("weight", weight);
        console.log("payment type", paymentType);

        let couriers = [];


        /* ---------------- DELHIVERY RATE ---------------- */

        try {

            const delhiveryRate = await getDelhiveryRate(fromPincode, toPincode, weight, paymentType);

            if (delhiveryRate) {
                couriers.push({
                    name: "Delhivery",
                    price: delhiveryRate.price,
                    deliveryDays: delhiveryRate.estimatedDays
                });
            }

        } catch (err) {

            console.log("❌ Delhivery rate error", err.message);

        }


        /* ---------------- EKART RATE ---------------- */

        try {

            const ekartRate = await getEkartRate(fromPincode, toPincode, weight, paymentType);

            couriers.push({
                name: "Ekart",
                price: ekartRate.price,
                deliveryDays: ekartRate.estimatedDays
            });

        } catch (err) {

            console.log("❌ Ekart rate error", err.message);

        }


        /* ---------------- RESPONSE ---------------- */

        return res.json({
            success: true,
            couriers
        });

    } catch (error) {

        console.log("❌ Courier recommendation error", error);

        return res.status(500).json({
            success: false
        });

    }

};

/*=====================================================
   TRACK SHIPMENT !!!
===================================================== */

exports.trackShipment = async (req, res) => {

    try {

        const waybill = req.params.waybill;

        console.log("Tracking Waybill:", waybill);

        const shipment = await Shipment.findOne({ waybill });

        if (!shipment) {

            return res.status(404).json({
                success: false,
                message: "Shipment not found"
            });

        }

        const courier = shipment.courier;

        console.log("Courier:", courier);

        if (courier === "Delhivery") {

            return await trackCustomerShipment(req, res);

        }

        if (courier === "Ekart") {

            return await trackEkartShipment(req, res);

        }

        return res.status(400).json({
            success: false,
            message: "Unsupported courier"
        });

    } catch (error) {

        console.log("TRACK ENGINE ERROR:", error.message);

        return res.status(500).json({
            success: false,
            message: "Tracking failed"
        });

    }

}

/*=====================================================
   LABEL & INVOICE DOWNLOAD !!!
===================================================== */

exports.getCourierLabel = async (courier, shipment) => {

    console.log("Generating label for:", courier);

    if (courier === "Delhivery") {

        return await delhiveryLabel(shipment);

    }

    if (courier === "Ekart") {

        return await ekartLabel(shipment);

    }

    if (courier === "Shipfast") {

        return await shipfastLabel(shipment);

    }

    return null;

}