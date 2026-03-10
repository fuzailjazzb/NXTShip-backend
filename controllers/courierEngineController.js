const { bookShipment: bookDelhiveryShipment } = require("./shipmentController");
const { bookEkartShipment } = require("./courier/ekartController");
const { getEkartRate } = require("./courier/ekartController");
const { calculateDelhiveryRate } = require("./rateControllers");

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

        const { pickupPincode, deliveryPincode, weight } = req.body;

        let couriers = [];


        /* ---------------- DELHIVERY RATE ---------------- */

        try {

            const delhiveryRate = await calculateDelhiveryRate(pickupPincode, deliveryPincode, weight);

            couriers.push({
                name: "Delhivery",
                price: delhiveryRate.price,
                deliveryDays: delhiveryRate.estimatedDays
            });

        } catch (err) {

            console.log("❌ Delhivery rate error", err.message);

        }


        /* ---------------- EKART RATE ---------------- */

        try {

            const ekartRate = await getEkartRate(pickupPincode, deliveryPincode, weight);

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
   TRACK SHIPMENT
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