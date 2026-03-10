const { bookShipment: bookDelhiveryShipment } = require("./shipmentController");
const { bookEkartShipment } = require("./courier/ekartController");

/* =====================================================
   COURIER ENGINE
   - User chooses courier
   - System recommends best courier
===================================================== */

exports.bookShipment = async (req, res) => {

    try {

        console.log("🚚 COURIER ENGINE STARTED");
        console.log("USER DATA", req.user);

        const courier = req.body.courier;

        console.log("User Selected Courier:", courier);

        /* =====================================================
           IF NO COURIER SELECTED
        ===================================================== */

        if (!courier ) {
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

        console.log("📊 Getting courier recommendations");

        /*
        Future me yaha real APIs call hongi
        Abhi dummy example data use kar rahe hain
        */

        const couriers = [

            {
                name: "Delhivery",
                price: 42,
                deliveryDays: 4
            },

            {
                name: "Ekart",
                price: 55,
                deliveryDays: 2
            }

        ];

        /* =====================================================
           CHEAPEST COURIER
        ===================================================== */

        const cheapest = couriers.reduce((prev, curr) =>
            prev.price < curr.price ? prev : curr
        );

        /* =====================================================
           FASTEST COURIER
        ===================================================== */

        const fastest = couriers.reduce((prev, curr) =>
            prev.deliveryDays < curr.deliveryDays ? prev : curr
        );

        /* =====================================================
           RESPONSE
        ===================================================== */

        return res.json({

            success: true,

            recommended: {
                cheapest,
                fastest
            },

            couriers

        });

    } catch (error) {

        console.log("❌ Recommendation Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch courier recommendations"
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
                success:false,
                message:"Shipment not found"
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
            success:false,
            message:"Unsupported courier"
        });

    } catch (error) {

        console.log("TRACK ENGINE ERROR:", error.message);

        return res.status(500).json({
            success:false,
            message:"Tracking failed"
        });

    }

}