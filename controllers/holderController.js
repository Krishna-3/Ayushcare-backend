const Holder = require('../models/holder');
const Member = require('../models/member');
const Hospital = require('../models/hospital');

const addMember = async (req, res, next) => {
    const { holderId } = req.params;
    const { name, gender, age, mobile } = req.body;
    if (!name || !gender || !age || !mobile) return res.status(400).json({ 'message': 'All fields required' });

    try {
        const holder = await Holder.findById(holderId).exec();

        if (holder.members.length < 4) {
            const query = await Member.create({
                name,
                gender,
                age,
                mobile,
                holder: holder._id
            });

            holder.members = [...holder.members, query._id];
            await holder.save();

            return res.status(201).json({ 'success': `Member ${name} added` });
        }

        res.status(400).json({ 'message': 'Member addition limit reached' });
    }
    catch (err) {
        next(err);
    }
}

const getHolder = async (req, res, next) => {
    const { holderId } = req.params;

    try {
        const holder = await Holder.findById(holderId).populate('members').select('-password -role -createdAt -updatedAt -__v -registeredBy').exec();

        res.json(holder);
    }
    catch (err) {
        next(err);
    }
}

const putHolder = async (req, res, next) => {
    const { holderId } = req.params;
    const { name, gender, age, mobile, occupation, address, village, mandal, district, pincode, aadhaar } = req.body;
    if (!name || !gender || !age || !mobile || !occupation || !address || !village || !mandal || !district || !pincode || !aadhaar) return res.status(400).json({ 'message': 'Bad request - all fields are required' });

    try {
        const holder = await Holder.findById(holderId).exec();

        holder.name = name;
        holder.gender = gender;
        holder.age = age;
        holder.mobile = mobile;
        holder.occupation = occupation;
        holder.address = address;
        holder.village = village;
        holder.mandal = mandal;
        holder.district = district;
        holder.pincode = pincode;
        holder.aadhaar = aadhaar;

        await holder.save();

        res.status(200).json({ 'success': `Holder ${name} updated` });
    }
    catch (err) {
        next(err);
    }
}

const deleteMember = async (req, res, next) => {
    const { memberId } = req.params;
    if (!memberId) return res.status(400).json({ 'message': 'Member required' });

    try {
        const member = await Member.findById(memberId).exec();
        const holder = await Holder.findById(member.holder).exec();
        if (!member) return res.status(401).json({ 'message': 'invalid member' });

        const patientExists = await Hospital.exists({ "patients.patient": member._id }).exec();
        if (patientExists) return res.status(400).json({ 'message': 'can not delete member ' + member.name });

        const query = await Member.findByIdAndDelete(memberId).exec();

        const holderMembers = holder.members;
        holder.members = holderMembers.filter(mem => !mem.equals(member._id));
        await holder.save();

        res.status(201).json({ 'success': `Member ${member.name} deleted` });
    }
    catch (err) {
        next(err);
    }
}

module.exports = {
    addMember,
    getHolder,
    putHolder,
    deleteMember
}