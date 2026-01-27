const Hospital = require('../models/hospital');
const Member = require('../models/member');
const Holder = require('../models/holder');

const getPatients = async (req, res, next) => {
    const hospitalId = req.id;
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
                    // populate: {
                    //     path: 'holder',
                    //     select: 'name'
                    // }
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

const getHolderMembers = async (req, res, next) => {
    const { holderId } = req.params;

    try {
        const holderandMembers = await Holder.findById(holderId)
            .populate('members', '-holder -__v')
            .select('name gender age mobile members')
            .exec();

        if (!holderandMembers) return res.status(400).json({ 'message': 'invalid holder' });

        res.json(holderandMembers);

    } catch (err) {
        next(err);
    }
}

const getDoctors = async (req, res, next) => {
    const hospitalId = req.id;

    try {
        const doctors = await Hospital.findById(hospitalId)
            .select('doctors')
            .exec();

        res.json(doctors.doctors);

    } catch (err) {
        next(err);
    }
}

const addPatient = async (req, res, next) => {
    const hospitalId = req.id;
    const { patientId } = req.params;

    try {
        const hospital = await Hospital.findById(hospitalId).exec();
        const [holder, member] = await Promise.all([
            Holder.findById(patientId).exec(),
            Member.findById(patientId).exec()
        ]);
        const patient = holder || member;

        if (!patient) return res.status(400).json({ 'message': 'invalid patient info' });

        // @ts-ignore
        hospital.patients = [...hospital.patients, { patient: patient._id, patientModel: patient?.holder ? 'Member' : 'Holder' }];
        await hospital.save();

        res.json({ 'success': `Patient ${patient.name} added` });

    } catch (err) {
        next(err);
    }
}

const addDoctor = async (req, res, next) => {
    const hospitalId = req.id;
    const { name, speciality } = req.body;
    if (!name || !speciality) return res.status(400).json({ 'message': 'All fields required' });

    try {
        const hospital = await Hospital.findById(hospitalId).exec();

        // @ts-ignore
        hospital.doctors = [...hospital.doctors, { name, speciality }];
        await hospital.save();

        res.json({ 'success': `New doctor ${name} added` });

    } catch (err) {
        next(err);
    }
}

const getPhoto = async (req, res, next) => {
    const hospitalId = req.id;

    try {
        const photo = await Hospital.findById(hospitalId)
            .select('photo')
            .exec();

        res.json(photo);

    } catch (err) {
        next(err);
    }
}

const uploadPhoto = async (req, res, next) => {
    const hospitalId = req.id;

    try {
        const hospital = await Hospital.findById(hospitalId).exec();

        if (!req.file) return res.status(400).json({ 'message': 'Only jpg, jpeg and png are allowed and should be less than 50 kb' });

        hospital.photo = req.file.buffer;
        await hospital.save();

        res.status(201).json({ 'success': 'Profile uploaded successfully' });

    }
    catch (err) {
        next(err);
    }
}

const getHospital = async (req, res, next) => {
    const hospitalId = req.id;

    try {
        const hospital = await Hospital.findById(hospitalId).select('-password -role -adminApproved -doctors -patients -photo -__v').exec();

        res.json(hospital);

    } catch (err) {
        next(err)
    }
}

const putHospital = async (req, res, next) => {
    const hospitalId = req.id;
    const { name, area, location, mobile, email, village, mandal, district, about } = req.body;
    if (!name || !area || !location || !mobile || !email || !village || !mandal || !district || !about) return res.status(400).json({ 'message': 'Bad request - all fields are required' });

    try {
        const hospital = await Hospital.findById(hospitalId).exec();

        hospital.name = name;
        hospital.area = area;
        hospital.location = location;
        hospital.mobile = mobile;
        hospital.email = email;
        hospital.village = village.trim().toUpperCase();
        hospital.mandal = mandal.trim().toUpperCase();
        hospital.district = district.trim().toUpperCase();
        hospital.about = about;

        await hospital.save();

        res.status(200).json({ 'success': `Hospital ${name} updated` });
    }
    catch (err) {
        next(err);
    }
}


const deleteDoctor = async (req, res, next) => {
    const hospitalId = req.id;
    const { doctorId } = req.params;
    if (!doctorId) return res.status(400).json({ 'message': 'Doctor required' });

    try {
        const hospital = await Hospital.findById(hospitalId).exec();

        // @ts-ignore
        hospital.doctors = hospital.doctors.filter(doc => !doc._id.equals(doctorId));
        await hospital.save();

        res.json({ 'success': `Doctor deleted` });

    } catch (err) {
        next(err);
    }
}

const deletePatient = async (req, res, next) => {
    const hospitalId = req.id;
    const { patientId } = req.params;
    if (!patientId) return res.status(400).json({ 'message': 'Patient required' });

    try {
        const hospital = await Hospital.findById(hospitalId).exec();

        // @ts-ignore
        hospital.patients = hospital.patients.filter(pat => !pat._id.equals(patientId));
        await hospital.save();

        res.json({ 'success': `Patient deleted` });

    } catch (err) {
        next(err);
    }
}

module.exports = {
    getPatients,
    getHolderMembers,
    getDoctors,
    addPatient,
    addDoctor,
    getPhoto,
    uploadPhoto,
    getHospital,
    putHospital,
    deleteDoctor,
    deletePatient
}