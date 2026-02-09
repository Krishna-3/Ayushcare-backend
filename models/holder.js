const mongoose = require('mongoose');
const Counter = require('./counter');
const { Schema } = mongoose;

const holderSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    holderId: {
        type: Number,
        unique: true
    },
    photo: {
        type: Buffer,
    },
    gender: {
        type: String,
        required: true,
        enum: ['male', 'female']
    },
    age: {
        type: Number,
        required: true
    },
    mobile: {
        type: Number,
        required: true,
        min: 1000000000,
        max: 9999999999
    },
    occupation: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    village: {
        type: String,
        required: true
    },
    mandal: {
        type: String,
        required: true
    },
    district: {
        type: String,
        required: true
    },
    pincode: {
        type: Number,
        required: true
    },
    aadhaar: {
        type: Number,
        required: true
    },
    members: [{
        type: Schema.Types.ObjectId,
        ref: 'Member'
    }],
    registeredBy: {
        type: Schema.Types.ObjectId,
        ref: 'Employee'
    },
    role: {
        type: String,
        default: 'holder',
        requried: true,
        enum: ['holder']
    }
}, { timestamps: true });

holderSchema.path('members').validate(value => value.length <= 4, 'A holder can have a maximum of 4 members.');

holderSchema.pre('save', async function (next) {
    if (this.holderId) return next();

    const counter = await Counter.findByIdAndUpdate(
        { _id: 'holderId' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );

    this.holderId = counter.seq;
    next();
});

module.exports = mongoose.model('Holder', holderSchema);