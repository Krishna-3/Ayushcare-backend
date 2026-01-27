const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Holder = require('../models/holder');
const Hospital = require('../models/hospital');
const Employee = require('../models/employee');
const Admin = require('../models/admin');
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});

const generateTempPasswordAndHash = async () => {
    const tempPassword = crypto.randomBytes(10)
        .toString('base64')
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 10);

    return [await bcrypt.hash(tempPassword, 10), tempPassword];
}

const handleCreateOrder = async (req, res, next) => {

    try {
        const order = await razorpay.orders.create({
            amount: 50 * 100,
            currency: "INR",
            receipt: "receipt_" + Date.now(),
        });

        if (!order) return res.status(500).json('Payment Error');

        res.json(order);
    }
    catch (err) {
        next(err);
    }
}

const handleHolderRegister = async (req, res, next) => {
    const { name, gender, age, mobile, email, occupation, address, village, mandal, district, pincode, aadhaar, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!name || !gender || !age || !mobile || !email || !occupation || !address || !village || !mandal || !district || !pincode || !aadhaar || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return res.status(400).json({ 'message': 'Bad request - all fields are required' });

    const employeeId = req.id;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest("hex");

    if (expectedSignature !== razorpay_signature) return res.status(400).json({ 'message': 'Payment is invalid' });

    const [holder, hospital, employee, admin] = await Promise.all([
        Holder.findOne({ email }).exec(),
        Hospital.findOne({ email }).exec(),
        Employee.findOne({ email }).exec(),
        Admin.findOne({ email }).exec(),
    ]);
    const duplicateUser = holder || hospital || employee || admin;
    if (duplicateUser) return res.status(409).json({ 'message': 'Conflict - user with the given email already exists!' });

    const [pwdhash, tempPassword] = await generateTempPasswordAndHash();

    try {
        const employee = await Employee.findById(employeeId).exec();

        const query = await Holder.create({
            name,
            password: pwdhash,
            gender,
            age,
            mobile,
            email,
            occupation,
            address,
            village,
            mandal,
            district,
            pincode,
            aadhaar,
            registeredBy: employee._id
        });

        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Temporary password',
            html: `<p>Your temporary password to login to Ayushcare is <b>${tempPassword}</b></p>`
        };
        await transporter.sendMail(mailOptions);

        res.status(201).json({ 'success': `Holder ${name} created`, holderId: query._id });
    }
    catch (err) {
        next(err);
    }
}

const handleHospitalRegister = async (req, res, next) => {
    const { name, password, area, location, mobile, email, village, mandal, district, about } = req.body;
    if (!name || !password || !area || !location || !mobile || !email || !village || !mandal || !district || !about) return res.status(400).json({ 'message': 'Bad request - all fields are required' });

    const [holder, hospital, employee, admin] = await Promise.all([
        Holder.findOne({ email }).exec(),
        Hospital.findOne({ email }).exec(),
        Employee.findOne({ email }).exec(),
        Admin.findOne({ email }).exec(),
    ]);
    const duplicateUser = holder || hospital || employee || admin;
    if (duplicateUser) return res.status(409).json({ 'message': 'Conflict - user with the given email already exists!' });

    const pwdhash = await bcrypt.hash(password, 10);

    try {
        const query = await Hospital.create({
            name,
            password: pwdhash,
            area,
            location,
            mobile,
            email,
            village: village.trim().toUpperCase(),
            mandal: mandal.trim().toUpperCase(),
            district: district.trim().toUpperCase(),
            about,
        });

        res.status(201).json({ 'success': `Hospital ${name} created` });
    }
    catch (err) {
        next(err);
    }
}

const handleEmployeeRegister = async (req, res, next) => {
    const { name, gender, parent, mobile, email, address, educationQualification, aadhaar, pan, bank, ifsc } = req.body;
    if (!name || !gender || !parent || !mobile || !email || !address || !educationQualification || !aadhaar || !pan || !bank || !ifsc) return res.status(400).json({ 'message': 'Bad request - all fields are required' });

    const [holder, hospital, employee, admin] = await Promise.all([
        Holder.findOne({ email }).exec(),
        Hospital.findOne({ email }).exec(),
        Employee.findOne({ email }).exec(),
        Admin.findOne({ email }).exec(),
    ]);
    const duplicateUser = holder || hospital || employee || admin;
    if (duplicateUser) return res.status(409).json({ 'message': 'Conflict - user with the given email already exists!' });

    const [pwdhash, tempPassword] = await generateTempPasswordAndHash();

    try {
        const query = await Employee.create({
            name,
            password: pwdhash,
            gender,
            parent,
            mobile,
            email,
            address,
            educationQualification,
            aadhaar,
            pan,
            bank,
            ifsc
        });

        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Temporary password',
            html: `<p>Your temporary password to login to Ayushcare is <b>${tempPassword}</b></p>`
        };
        await transporter.sendMail(mailOptions);

        res.status(201).json({ 'success': `Employee ${name} created`, employeeId: query._id });
    }
    catch (err) {
        next(err);
    }
}

const handleLogin = async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ 'message': 'Bad request - all fields are required' });

    try {
        const [holder, hospital, employee, admin] = await Promise.all([
            Holder.findOne({ email }).exec(),
            Hospital.findOne({ email }).exec(),
            Employee.findOne({ email }).exec(),
            Admin.findOne({ email }).exec(),
        ]);
        const user = holder || hospital || employee || admin;

        if (!user) return res.status(401).json({ 'message': 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ 'message': "Invalid credentials" });

        const accessToken = jwt.sign(
            {
                'userInfo': {
                    'id': user._id,
                    'email': user.email,
                    'name': user.name,
                    'role': user.role
                }
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '1d' }
        );

        const firstLogin =
            // @ts-ignore
            user.createdAt && user.updatedAt && user.createdAt.getTime() === user.updatedAt.getTime();

        ((user.role === 'holder' || user.role === 'employee') && firstLogin) ?
            res.json({
                'success': `${user.name} is logged in first time!`,
                'firstLogin': true,
                'token': accessToken
            })
            :
            res.json({
                'success': `${user.name} is logged in!`,
                'token': accessToken
            })
    }
    catch (err) {
        next(err);
    }
}

const forgotPassword = async (req, res, next) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ 'message': 'Bad request - all fields are required' });

    try {
        const [holder, hospital, employee, admin] = await Promise.all([
            Holder.findOne({ email }).exec(),
            Hospital.findOne({ email }).exec(),
            Employee.findOne({ email }).exec(),
            Admin.findOne({ email }).exec(),
        ]);
        const user = holder || hospital || employee || admin;

        if (!user) return res.status(401).json({ 'message': 'Invalid credentials' });

        const [pwdhash, tempPassword] = await generateTempPasswordAndHash();

        user.password = pwdhash;
        await user.save();

        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Temporary password',
            html: `<p>Your temporary password to login to Ayushcare is <b>${tempPassword}</b></p>`
        };
        await transporter.sendMail(mailOptions);

        res.json({
            'success': `Temporary password sent to ${email}`,
        })

    } catch (err) {
        next(err);
    }
}

const putPassword = async (req, res, next) => {
    const { email, tempPassword, newPassword } = req.body;
    if (!newPassword || !tempPassword) return res.status(400).json({ 'message': 'All fields required' });

    try {
        const [holder, hospital, employee, admin] = await Promise.all([
            Holder.findOne({ email }).exec(),
            Hospital.findOne({ email }).exec(),
            Employee.findOne({ email }).exec(),
            Admin.findOne({ email }).exec(),
        ]);
        const user = holder || hospital || employee || admin;

        if (!user) return res.status(401).json({ 'message': 'Invalid credentials' });

        const match = await bcrypt.compare(tempPassword, user.password);
        if (match) {
            const pwdhash = await bcrypt.hash(newPassword, 10);

            user.password = pwdhash;
            await user.save();
        }
        else {
            return res.status(401).json({ 'message': 'unauthorized' });
        }

        res.json({ 'success': 'Password updated' });
    }
    catch (err) {
        next(err);
    }
}

module.exports = {
    handleCreateOrder,
    handleLogin,
    handleHolderRegister,
    handleHospitalRegister,
    handleEmployeeRegister,
    forgotPassword,
    putPassword,
};