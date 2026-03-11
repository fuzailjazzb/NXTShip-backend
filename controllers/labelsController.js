const Shipment = require("../models/shipment");

const getCourierLabel = require("./courierEngineController");

exports.generateLabel = async (req, res) => {

    try {

        const { id } = req.params;

        console.log("Label API Hit:", id);

        const shipment = await Shipment.findOne({

            $or: [
                { orderId: id },
                { waybill: id }
            ]

        });

        if (!shipment) {

            return res.status(404).json({
                success: false,
                message: "Shipment not found"
            });

        }

        const courier = shipment.courier;

        console.log("Courier:", courier);

        const label = await getCourierLabel(courier, shipment);

        res.json({
            success: true,
            label
        });

    } catch (err) {

        console.log("Label Error:", err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};