const Hospital = require('../models/hospital');
const Holder = require('../models/holder');
const Employee = require('../models/employee');
const Member = require('../models/member');

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

const getUnpaidHolders = async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * 10;

    try {
        const [holders, total] = await Promise.all([
            Holder.find({ paymentStatus: 'pending' })
                .select('name mobile email members holderId')
                .skip(skip)
                .limit(10)
                .sort({ createdAt: -1 }),
            Holder.find({ paymentStatus: 'pending' }).countDocuments()
        ]);

        res.json({ holders, total })
    } catch (err) {
        next(err);
    }
}

const getFilteredDetails = async (req, res, next) => {
    const filter = (req.query.filter || "").trim();
    const entity = (req.query.entity || "").trim();
    if (!filter) return res.status(400).json({ 'message': 'filter is required' });

    try {
        const isNumber = /^\d+$/.test(filter);

        let query = {
            $or: [
                { name: { $regex: `.*${filter}.*`, $options: "i" } },
                ...(isNumber ? [{ mobile: Number(filter) }] : [])
            ]
        };

        let filteredDetails;

        if (entity === 'holder') {
            filteredDetails = await Holder.find({ ...query, paymentStatus: 'completed' })
                .select('name mobile members holderId')
                .exec();
        } else if (entity === 'hospital') {
            filteredDetails = await Hospital.find({ ...query, adminApproved: true })
                .select('name area email doctors')
                .exec();
        } else if (entity === 'employee') {
            filteredDetails = await Employee.find(query)
                .select('name gender mobile email employeeId')
                .exec();
        } else {
            return res.status(400).json({ 'message': 'Invalid search parameter' })
        }

        filteredDetails.length === 0
            ?
            res.status(400).json({ 'message': 'No details found' })
            :
            res.json(filteredDetails);

    } catch (err) {
        next(err)
    }
}

const getEmployeeDetails = async (req, res, next) => {
    const { employeeId } = req.params;

    try {
        const employee = await Employee.findById(employeeId)
            .select('-password -photo -role -__v -createdAt -updatedAt')
            .exec();

        res.json(employee);

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
            Holder.find({ registeredBy: employee._id, paymentStatus: 'completed' })
                .select('name mobile email members')
                .skip(skip)
                .limit(10)
                .sort({ createdAt: -1 }),
            Holder.find({ registeredBy: employee._id, paymentStatus: 'completed' }).countDocuments()
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
            Holder.find({ paymentStatus: 'completed' })
                .select('name mobile members holderId')
                .skip(skip)
                .limit(10)
                .sort({ createdAt: -1 }),
            Holder.find({ paymentStatus: 'completed' }).countDocuments(),
            Holder.find({ paymentStatus: 'completed' })
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

const deleteUnpaidHolder = async (req, res, next) => {
    const { holderId } = req.params;

    try {
        const holder = await Holder.findByIdAndDelete(holderId).exec();

        await Member.deleteMany({
            _id: { $in: holder.members }
        });

        res.json({ 'success': `Holder ${holder.name} deleted` })

    } catch (err) {
        next(err);
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
    getFilteredDetails,
    getEmployeeDetails,
    getUnapprovedHospitals,
    getUnpaidHolders,
    getHoldersByEmployees,
    getDashboard,
    approveHospital,
    getEmployeeCard,
    deleteUnpaidHolder,
    deleteEmployee,
    deleteHospital,
    getPatientsByHospitals
}