const Holder = require('../models/holder');
const Employee = require('../models/employee');

const getDashboard = async (req, res, next) => {
    const employeeId = req.id;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * 10;

    try {
        const employee = await Employee.findById(employeeId).exec();

        const [holders, total] = await Promise.all([
            Holder.find({ registeredBy: employee._id })
                .select('name mobile email members')
                .skip(skip)
                .limit(10)
                .sort({ createdAt: -1 }),
            Holder.find({ registeredBy: employee._id }).countDocuments()
        ]);

        res.json({ holders, total });

    } catch (err) {
        next(err)
    }
}

const uploadHolderPhoto = async (req, res, next) => {
    const { holderId } = req.params;
    const employeeId = req.id;

    try {
        const holder = await Holder.findById(holderId).exec();

        if (req.role === 'employee' && employeeId !== holder.registeredBy.toString()) return res.status(401), res.json({ 'message': 'Unauthorized' });

        if (!req.file) return res.status(400).json({ 'message': 'Only jpg, jpeg and png are allowed and should be less than 50 kb' });

        holder.photo = req.file.buffer;
        await holder.save();

        res.status(201).json({ 'success': 'Photo uploaded successfully' });

    }
    catch (err) {
        next(err);
    }
}

const uploadEmployeePhoto = async (req, res, next) => {
    const { employeeId } = req.params;

    try {
        const employee = await Employee.findById(employeeId).exec();

        if (!req.file) return res.status(400).json({ 'message': 'Only jpg, jpeg and png are allowed and should be less than 50 kb' });

        employee.photo = req.file.buffer;
        await employee.save();

        res.status(201).json({ 'success': 'Photo uploaded successfully' });

    }
    catch (err) {
        next(err);
    }
}

const getHolderCard = async (req, res, next) => {
    const { holderId } = req.params;

    try {
        const holder = await Holder.findById(holderId)
            .select('name holderId gender mobile village mandal district pincode photo createdAt')
            .exec();

        res.json(holder);

    } catch (err) {
        next(err)
    }
}

const getEmployee = async (req, res, next) => {
    const employeeId = req.id;

    try {
        const employee = await Employee.findById(employeeId).select('-password -role -createdAt -updatedAt -__v').exec();

        res.json(employee);

    } catch (err) {
        next(err)
    }
}

const putEmployee = async (req, res, next) => {
    const employeeId = req.id;
    const { name, gender, parent, mobile, email, address, educationQualification, aadhaar, pan, bank, ifsc } = req.body;
    if (!name || !gender || !parent || !mobile || !email || !address || !educationQualification || !aadhaar || !pan || !bank || !ifsc) return res.status(400).json({ 'message': 'Bad request - all fields are required' });

    try {
        const employee = await Employee.findById(employeeId).exec();

        employee.name = name;
        employee.gender = gender;
        employee.parent = parent;
        employee.mobile = mobile;
        employee.email = email;
        employee.address = address;
        employee.educationQualification = educationQualification;
        employee.aadhaar = aadhaar;
        employee.pan = pan;
        employee.bank = bank;
        employee.ifsc = ifsc;

        await employee.save();

        res.status(200).json({ 'success': `Employee ${name} updated` });
    }
    catch (err) {
        next(err);
    }
}

module.exports = {
    getDashboard,
    uploadHolderPhoto,
    uploadEmployeePhoto,
    getHolderCard,
    getEmployee,
    putEmployee,
}