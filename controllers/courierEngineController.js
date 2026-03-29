const { bookShipment: bookDelhiveryShipment } = require("./shipmentController");
const { bookEkartShipment } = require("./courier/ekartController");
const { getEkartRate } = require("./courier/ekartController");
const { getDelhiveryRate } = require("./rateControllers");

const Shipment = require("../models/shipment");

const delhiveryLabel = require("./labels/delhiveryLabel");
const ekartLabel = require("./labels/ekartLabel");
const shipfastLabel = require("./labels/shipfastLabel");


const { trackShipment } = require("./shipmentController");

// shipfast import
const { createShipment: bookShipfastShipment } = require("./courier/shipfadtControllerAll");
const { trackShipment: trackShipfastShipment } = require("./courier/shipfadtControllerAll");
const { checkServiceability: checkServiceability } = require("./courier/shipfadtControllerAll");
const { cancelShipment: cancelShipment } = require("./courier/shipfadtControllerAll");

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
            SHIPFAST COURIER
        ===================================================== */

        if (courier === "shipfast") {

            console.log("⚡ Using Shipfast");

            const response = await bookShipfastShipment(req.body);

            if (!response.success) {
                return res.status(500).json({
                    success: false,
                    message: "Shipfast booking failed",
                    error: response.error
                });
            }

            console.log("✅ Shipfast Booking Success:", response.data);

            return res.json({
                success: true,
                awb: response.data.awb,
                labelUrl: response.data.labelUrl,
                courier: "shipfast"
            });
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


        /* ---------------- SHIPFAST ---------------- */

        couriers.push({
            name: "Shipfast",
            price: "Dynamic",
            deliveryDays: "Auto"
        });


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

        if (courier === "delhivery") {

            return await trackShipment(req, res);

        }

        if (courier === "ekart") {

            return await trackEkartShipment(req, res);

        }

        if (courier === "shipfast") {

            console.log("📍 Tracking via Shipfast");

            const response = await trackShipfastShipment(waybill);

            if (!response.success) {
                return res.status(500).json({
                    success: false,
                    message: "Shipfast tracking failed",
                    error: response.error
                });
            }

            return res.json({
                success: true,
                tracking: response.data
            });
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

// ===============================
// GENERATE LABEL !!!
// ===============================

exports.generateLabel = async (req, res) => {

    try {

        console.log("=======================================");
        console.log("🚀 LABEL GENERATION API HIT");
        console.log("Time:", new Date());
        console.log("Params:", req.params);
        console.log("=======================================");

        const { awb } = req.params;

        if (!awb) {
            return res.status(400).json({
                success: false,
                message: "AWB required"
            });
        }

        console.log("🔍 Searching shipment for AWB:", awb);

        const shipment = await Shipment.findOne({
            $or: [
                { waybill: awb },
                { awb: awb }
            ]
        });

        console.log("Shipment DB Result:", shipment);

        if (!shipment) {

            console.log("❌ Shipment not found");

            return res.status(404).json({
                success: false,
                message: "Shipment not found"
            });
        }

        console.log("✅ Shipment Found");
        console.log("Courier:", shipment.courier);
        console.log("OrderId:", shipment.orderId);

        const courier = shipment.courier;

        let labelResponse;

        // ===============================
        // COURIER ENGINE SWITCH
        // ===============================

        if (courier === "delhivery") {

            console.log("📦 Routing to DELHIVERY LABEL");

            labelResponse = await delhiveryLabel(shipment);

        }

        else if (courier === "ekart") {

            console.log("📦 Routing to EKART LABEL");

            labelResponse = await ekartLabel(shipment);

        }

        else if (courier === "shipfast") {

            console.log("📦 Routing to SHIPFAST LABEL");

            labelResponse = await shipfastLabel(shipment);

        }

        else {

            console.log("❌ Unsupported courier:", courier);

            return res.status(400).json({
                success: false,
                message: "Unsupported Courier"
            });
        }

        console.log("✅ Label generated successfully");

        return res.json({
            success: true,
            shipment: shipment,
            courier: courier,
            label: labelResponse
        });

    }

    catch (error) {

        console.log("❌ LABEL ENGINE ERROR");
        console.log(error);

        res.status(500).json({
            success: false,
            message: "Label generation failed",
            error: error.message
        });

    }

};