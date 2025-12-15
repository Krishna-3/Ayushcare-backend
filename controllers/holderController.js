const Holder = require('../models/holder');
const Member = require('../models/member');
const Hospital = require('../models/hospital');

const getMembers = async (req, res, next) => {
    const holderId = req.id;

    try {
        const holder = await Holder.findById(holderId).populate('members', '-holder -__v').exec();

        const holderMembers = holder.members;

        res.json(holderMembers);
    }
    catch (err) {
        next(err);
    }
}

const addMember = async (req, res, next) => {
    const holderId = req.id;
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

const deleteMember = async (req, res, next) => {
    const holderId = req.id;
    const { memberId } = req.params;
    if (!memberId) return res.status(400).json({ 'message': 'Member required' });

    try {
        const holder = await Holder.findById(holderId).exec();
        const member = await Member.findById(memberId).exec();
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
    getMembers,
    addMember,
    deleteMember
}