const Hospital = require('../models/hospital');
const Holder = require('../models/holder');
const Employee = require('../models/employee');

const getUnapprovedHospitals = async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * 10;

    try {
        const [unapprovedHospitals, total] = await Promise.all([
            Hospital.find({ adminApproved: false })
                .select('-password')
                .skip(skip)
                .limit(10),
            Hospital.find({ adminApproved: false }).countDocuments()
        ]);

        res.json({ unapprovedHospitals, total });

    } catch (err) {
        next(err)
    }
}

const getHoldersByEmployees = async (req, res, next) => {
    const { employeeId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * 10;

    try {
        const employee = await Employee.findById(employeeId).exec();

        const [holdersByEmployees, total] = await Promise.all([
            Holder.find({ registeredBy: employee._id })
                .select('name mobile email members')
                .skip(skip)
                .limit(10)
                .sort({ createdAt: -1 }),
            Holder.find({ registeredBy: employee._id }).countDocuments()
        ]);

        res.json({ holdersByEmployees, total });

    } catch (err) {
        next(err)
    }
}

const getPatientsByHospitals = async (req, res, next) => {
    const { hospitalId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    try {

        const hospital = await Hospital.findById(hospitalId).exec();

        const [patients, patientsAggregate] = await Promise.all([
            Hospital.findById(hospitalId)
                .populate({
                    path: 'patients.patient',
                    select: 'name age gender mobile holder',
                    // @ts-ignore
                    refPath: 'patients.patientModel',
                })
                .select({
                    'patients': { $slice: [skip, limit] }
                }),

            Hospital.aggregate([
                { $match: { _id: hospital._id } },
                { $project: { count: { $size: "$patients" } } }
            ])
        ]);

        res.json({ patients: patients.patients, total: patientsAggregate[0]?.count || 0 });

    } catch (err) {
        next(err);
    }
}

const getDashboard = async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * 10;

    try {
        const [hospitals, totalHospitals, totalHospitalsWithDoctors] = await Promise.all([
            Hospital.find({ adminApproved: true })
                .select('name area email doctors')
                .skip(skip)
                .limit(10),
            Hospital.find({ adminApproved: true }).countDocuments(),
            Hospital.find({ adminApproved: true })
                .select('doctors')
        ]);

        const [holders, totalHolders, totalHoldersWithMembers] = await Promise.all([
            Holder.find({})
                .select('name mobile email members holderId')
                .skip(skip)
                .limit(10)
                .sort({ createdAt: -1 }),
            Holder.find({}).countDocuments(),
            Holder.find({})
                .select('members')
        ]);

        const [employees, totalEmployees] = await Promise.all([
            Employee.find({})
                .select('name gender mobile email employeeId')
                .skip(skip)
                .limit(10)
                .sort({ createdAt: -1 }),
            Employee.find({}).countDocuments()
        ]);

        res.json({
            hospitals,
            totalHospitals,
            totalDoctors: totalHospitalsWithDoctors.reduce((sum, hospital) => sum + hospital.doctors?.length, 0),
            holders,
            totalHolders,
            totalCustomers: totalHoldersWithMembers.reduce((sum, holder) => sum + holder.members?.length, 0) + totalHoldersWithMembers?.length,
            employees,
            totalEmployees
        });

    } catch (err) {
        next(err)
    }
}

const approveHospital = async (req, res, next) => {
    const { hospitalId } = req.params;

    try {
        const hospital = await Hospital.findById(hospitalId).exec();

        hospital.adminApproved = true;
        await hospital.save();

        res.json({ 'success': `Hospital ${hospital.name} approved` });

    } catch (err) {
        next(err)
    }
}

const getEmployeeCard = async (req, res, next) => {
    const { employeeId } = req.params;

    try {
        const employee = await Employee.findById(employeeId)
            .select('name employeeId mobile address photo')
            .exec();

        res.json(employee);

    } catch (err) {
        next(err)
    }
}

const deleteEmployee = async (req, res, next) => {
    const { employeeId } = req.params;

    try {
        const employee = await Employee.findByIdAndDelete(employeeId).exec();

        const holdersByEmployees = await Holder.find({ registeredBy: employee._id }).exec();

        const ids = holdersByEmployees.map(h => h._id)

        await Holder.updateMany(
            { _id: { $in: ids } },
            { $set: { registeredBy: null } }
        ).exec();

        res.json({ 'success': `Employee ${employee.name} delete` });

    } catch (err) {
        next(err)
    }
}

const deleteHospital = async (req, res, next) => {
    const { hospitalId } = req.params;

    try {
        const hospital = await Hospital.findByIdAndDelete(hospitalId).exec();

        res.json({ 'success': `Hospital ${hospital.name} delete` });

    } catch (err) {
        next(err)
    }
}

module.exports = {
    getUnapprovedHospitals,
    getHoldersByEmployees,
    getDashboard,
    approveHospital,
    getEmployeeCard,
    deleteEmployee,
    deleteHospital,
    getPatientsByHospitals
}