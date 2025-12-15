const Hospital = require('../models/hospital');
const Holder = require('../models/holder');
const Employee = require('../models/employee');

const getUnapprovedHospitals = async (req, res, next) => {
    try {
        const unapprovedHospitals = await Hospital.find({ adminApproved: false })
            .select('-password')
            .exec();

        res.json(unapprovedHospitals);

    } catch (err) {
        next(err)
    }
}

const getHoldersByEmployees = async (req, res, next) => {
    const { employeeId } = req.params;

    try {
        const employee = await Employee.findById(employeeId).exec();

        const holdersByEmployees = await Holder.find({ registeredBy: employee._id })
            .select('name mobile email members')
            .exec();

        res.json(holdersByEmployees);

    } catch (err) {
        next(err)
    }
}

const getPatientsByHospitals = async (req, res, next) => {
    const { hospitalId } = req.params;

    try {
        const patients = await Hospital.findById(hospitalId)
            .populate({
                path: 'patients.patient',
                select: 'name age gender mobile holder',
                // @ts-ignore
                refPath: 'patients.patientModel',
            })
            .select('patients')
            .exec();

        res.json(patients.patients);

    } catch (err) {
        next(err);
    }
}

const getDashboard = async (req, res, next) => {
    try {
        const hospitals = await Hospital.find({ adminApproved: true })
            .select('name area email doctors')
            .exec();
        const holders = await Holder.find({})
            .select('name mobile email members')
            .exec();
        const employees = await Employee.find({})
            .select('name gender mobile email')
            .exec();

        res.json({
            hospitals,
            holders,
            employees,
        });

    } catch (err) {
        next(err)
    }
}

const approveHospital = async (req, res, next) => {
    const { hospitalId } = req.params;

    try {
        const hospital = await Hospital.findById(hospitalId).exec();
        if (!hospital) return res.status(400).json({ 'message': 'Invalid hospital' });

        hospital.adminApproved = true;
        await hospital.save();

        res.json({ 'success': `Hospital ${hospital.name} approved` });

    } catch (err) {
        next(err)
    }
}

module.exports = {
    getUnapprovedHospitals,
    getHoldersByEmployees,
    getDashboard,
    approveHospital,
    getPatientsByHospitals
}