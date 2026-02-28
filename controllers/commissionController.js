const Commission = require("../models/commission");

// Get Commissions 

exports.getCommission = async (req, res) => {
    let commission = await Commission.findOne();

    if (!commission) {
        commission = await Commission.create({});
    }

    res.json(commission);
};

//Update Commission (Admin)

exports.updateCommission = async (req, res) => {
    const { flatCommission, percentageCommission } = req.body;

    let commission = await Commission.findOne();

    if (!commission) {
        commission = new Commission();
    }

    commission.flatCommission = flatCommission;
    commission.percentageCommission = percentageCommission;

    await commission.save();

    req.json({
        success: true,
        message: "Commission Updated"
    });
};