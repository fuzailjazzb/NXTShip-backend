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
    const warehouses = await Warehouse.find({
        userId: req.admin._id
    });

    res.json({
        success: true,
        warehouses
    });
}catch(err){
    res.status(500).json({
        success: false,
        message: err.message
    });
}

};