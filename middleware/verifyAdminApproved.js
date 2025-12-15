const Hospital = require('../models/hospital');

const verifyAdminApproved = async (req, res, next) => {
    const hospitalId = req.id;

    try {
        const hospital = await Hospital.findById(hospitalId).exec();
        if (!hospital) return res.status(400).json({ 'message': 'Invalid request' });
        if (!hospital.adminApproved) return res.status(401).json({ 'message': 'Admin approval requried' });

        next();
    } catch (err) {
        next(err);
    }
}

module.exports = verifyAdminApproved;