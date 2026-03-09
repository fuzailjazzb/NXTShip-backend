const {createEkartShipment} = require("./courier/ekartController");
const {bookCustomerShipment} = require("./customerBookingController");


exports.bookShipment = async (req, res)=> {
    const courier = req.body.customer;

    console.log("courier selected", courier);

    if (courier === "delhivery") {
        return bookCustomerShipment(req,res);
    }

    if (courier === "ekart") {
        return createEkartShipment(req, res);
    }

    if (courier === "shipfast") {
        return createShipfastShipment(req, res);
    }

    return res.status(400).json({
        success: false,
        message: "Invalid Courier"
    });
};