const Hospital = require('../models/hospital');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});

// const normalize = arr =>
//     // @ts-ignore
//     [...new Set(arr.map(v => v.trim().toLowerCase()))]
//         .map(v => v.charAt(0).toUpperCase() + v.slice(1));

const compareTwo = (a, b) => {
    const aHasData = a.length > 0;
    const bHasData = b.length > 0;

    if (!aHasData && !bHasData) return [];

    if (!aHasData) return b;
    if (!bHasData) return a;

    return a.filter(item => b.includes(item));
};

const contact = async (req, res, next) => {
    const { name, email, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ 'message': 'All details required' });

    try {
        const mailOptions = {
            from: process.env.EMAIL,
            to: process.env.CONTACTEMAIL,
            subject: 'User query',
            html: `<p>
                             <p><b>name : </b>${name}</p>
                             <p><b>email : </b>${email}</p>
                             <p><b>message : </b>${message}</p>
                           </p>`
        };
        await transporter.sendMail(mailOptions);

        res.json({ 'success': "Successfully received message" });

    } catch (err) {
        next(err);
    }
};

const getLocations = async (req, res, next) => {
    try {
        const [villages, mandals, districts] = await Promise.all([
            Hospital.find({ adminApproved: true }).distinct('village'),
            Hospital.find({ adminApproved: true }).distinct('mandal'),
            Hospital.find({ adminApproved: true }).distinct('district')
        ]);

        res.json({
            villages,
            mandals,
            districts
        });

    } catch (err) {
        next(err);
    }
}

const getHospitals = async (req, res, next) => {
    const { village, mandal, district } = req.query;

    try {
        const filter = {};
        const districts = [];
        const mandals = [];
        const villages = [];

        const districtsRaw1 = [];
        const districtsRaw2 = [];
        const mandalsRaw1 = [];
        const mandalsRaw2 = [];
        const villagesRaw1 = [];
        const villagesRaw2 = [];

        filter.adminApproved = true;

        if (village && village.trim() !== '') {
            filter.village = { $regex: new RegExp(`^${village.trim()}$`, 'i') };
            const districtsRaw = await Hospital.find({ village, adminApproved: true }).distinct('district');
            const mandalsRaw = await Hospital.find({ village, adminApproved: true }).distinct('mandal');
            districtsRaw1.push(...districtsRaw);
            mandalsRaw1.push(...mandalsRaw);
        }

        if (mandal && mandal.trim() !== '') {
            filter.mandal = { $regex: new RegExp(`^${mandal.trim()}$`, 'i') };
            const districtsRaw = await Hospital.find({ mandal, adminApproved: true }).distinct('district');
            const villagesRaw = await Hospital.find({ mandal, adminApproved: true }).distinct('village');
            districtsRaw2.push(...districtsRaw);
            villagesRaw1.push(...villagesRaw);
        }

        if (district && district.trim() !== '') {
            filter.district = { $regex: new RegExp(`^${district.trim()}$`, 'i') };
            const mandalsRaw = await Hospital.find({ district, adminApproved: true }).distinct('mandal');
            const villagesRaw = await Hospital.find({ district, adminApproved: true }).distinct('village');
            mandalsRaw2.push(...mandalsRaw);
            villagesRaw2.push(...villagesRaw);
        }

        districts.push(...compareTwo(districtsRaw1, districtsRaw2))
        mandals.push(...compareTwo(mandalsRaw1, mandalsRaw2))
        villages.push(...compareTwo(villagesRaw1, villagesRaw2))

        const filteredHospitals = await Hospital.find(filter)
            .select('name photo village mandal district')
            .exec();

        res.json({
            filteredHospitals,
            districts,
            mandals,
            villages
        });

    } catch (err) {
        next(err);
    }
}

const getAllHospitals = async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * 12;

    try {
        const [hospitals, total] = await Promise.all([
            Hospital.find({ adminApproved: true })
                .select('name photo')
                .skip(skip)
                .limit(12),
            Hospital.find({ adminApproved: true }).countDocuments()
        ]);

        res.json({ hospitals, total });

    } catch (err) {
        next(err);
    }
}

const getHospitalDetails = async (req, res, next) => {
    const { hospitalId } = req.params;

    try {
        const hospital = await Hospital.findById(hospitalId)
            .select('-password -patients -__v -role')
            .exec();

        hospital.adminApproved
            ?
            res.json(hospital)
            :
            res.status(400).json({ 'message': 'Invalid request' });

    } catch (err) {
        next(err);
    }
}


module.exports = {
    contact,
    getLocations,
    getHospitals,
    getAllHospitals,
    getHospitalDetails
}