const Holder = require('../models/holder');
const Employee = require('../models/employee');

const getDashboard = async (req, res, next) => {
    const employeeId = req.id;

    try {
        const employee = await Employee.findById(employeeId).exec();

        const holders = await Holder.find({ registeredBy: employee._id })
            .select('name mobile email members')
            .exec();

        res.json(holders);

    } catch (err) {
        next(err)
    }
}

module.exports = {
    getDashboard
}