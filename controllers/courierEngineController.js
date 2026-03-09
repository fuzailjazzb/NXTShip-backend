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

const courier = req.body.courier;

console.log("User Selected Courier:", courier);

/* =====================================================
   DEFAULT COURIER (DELHIVERY)
===================================================== */

if (!courier || courier === "delhivery") {

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