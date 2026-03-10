const Warehouse = require("../models/warehouse");

exports.createWarehouse = async (req, res) => {

    try {

        const warehouse = await Warehouse.create({
            userId: req.user.id,
            name: req.body.name,
            address: req.body.address,
            city: req.body.city,
            state: req.body.state,
            pincode: req.body.pincode,
            phone: req.body.phone
        });

        res.json({
            success: true,
            warehouse
        });

    } catch (err) {

        console.log("warehouse create error", err);
        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};



exports.getWarehouses = async (req, res) => {

    try {

        console.log("Warehouse Api Hiteds");
        console.log("req.admin =>", req.admin);
        console.log("req.user =>", req.user);

        const userId = req.admin._id || req.user.id;

        console.log("userO=Id is", userId);

        if (!userId) {
            return res.status(500).json({
                success: false,
                message: "user not authenticated"
            });
        }

        const warehouses = await Warehouse.find({ userId: userId });

        console.log("warehouses", warehouses);

        res.json({
            success: true,
            message: "get warehouse success",
            warehouses
        });
    } catch (err) {

        console.log("warehouse error", err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }

};


exports.deleteWarehouse = async (req, res) => {

    try {

        await Warehouse.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: "Warehouse deleted"
        });

    } catch (err) {

        res.status(500).json({
            success: false
        });

    }

};


exports.updateWarehouse = async (req, res) => {

    try {

        const warehouse = await Warehouse.findByIdAndUpdate(

            req.params.id,
            req.body,
            { new: true }

        );

        res.json({
            success: true,
            warehouse
        });

    } catch (err) {

        res.status(500).json({
            success: false
        });

    }

};


exports.setDefaultWarehouse = async (req, res) => {

    try {

        await Warehouse.updateMany(
            { userId: req.user.id },
            { isDefault: false }
        );

        await Warehouse.findByIdAndUpdate(
            req.params.id,
            { isDefault: true }
        );

        res.json({
            success: true,
            message: "Default warehouse set"
        });

    } catch (err) {

        res.status(500).json({
            success: false
        });

    }

};