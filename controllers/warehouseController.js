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

        // 1. Safe ID extraction (?. lagane se crash nahi hoga agar req.admin ya req.user empty ho)
        const userId = req.admin?._id || req.user?.id;
        
        // 2. Admin check (Check karna ki token admin ka hai ya nahi)
        const isAdmin = (req.admin && req.admin.email) || (req.user && req.user.email === 'admin@nxtships.in');

        console.log("userO=Id is", userId);
        console.log("Is Admin Request?", !!isAdmin);

        // 3. Agar normal user hai aur ID nahi mili, tabhi block karein
        if (!isAdmin && !userId) {
            return res.status(500).json({
                success: false,
                message: "user not authenticated"
            });
        }

        let warehouses;

        // 4. SMART LOGIC: Admin hai toh sab dikhao, User hai toh uska filter lagao
        if (isAdmin) {
            // Admin ke liye bina kisi filter ke saare warehouses nikal lo
            warehouses = await Warehouse.find({}).sort({ createdAt: -1 });
        } else {
            // Normal user ke liye Puraana wala logic (sirf uske warehouses)
            warehouses = await Warehouse.find({ userId: userId });
        }

        console.log("Warehouses Found:", warehouses.length);

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

        console.log("Update warehouse error", err);
        res.status(500).json({
            success: false,
            message: err.message
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