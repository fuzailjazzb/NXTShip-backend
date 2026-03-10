const Warehouse = require("../models/warehouse");

exports.createWarehouse = async (req, res) => {

    try {

        const warehouse = new Warehouse({
            userId: req.user._id,
            name: req.body.name,
            address: req.body.address,
            city: req.body.city,
            state: req.body.state,
            pincode: req.body.pincode,
            phone: req.body.phone
        });

        await warehouse.save();

        res.json({
            success: true,
            warehouse
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};



exports.getWarehouses = async (req, res) => {

    try{

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
}catch(err){

    console.log("warehouse error", err);
    res.status(500).json({
        success: false,
        message: err.message
    });
}

};