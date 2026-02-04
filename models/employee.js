const mongoose = require('mongoose');
const Counter = require('./counter');
const { Schema } = mongoose;

const employeeSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    employeeId: {
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
    parent: {
        type: String,
        required: true
    },
    mobile: {
        type: Number,
        required: true,
        min: 1000000000,
        max: 9999999999
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    address: {
        type: String,
        required: true
    },
    educationQualification: {
        type: String,
        required: true
    },
    aadhaar: {
        type: Number,
        required: true
    },
    pan: {
        type: String,
        required: true
    },
    bank: {
        type: Number,
        required: true
    },
    ifsc: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: 'employee',
        requried: true,
        enum: ['employee']
    }
}, { timestamps: true });

employeeSchema.pre('save', async function (next) {
    if (this.employeeId) return next();

    const counter = await Counter.findByIdAndUpdate(
        { _id: 'employeeId' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );

    this.employeeId = counter.seq;
    next();
});

module.exports = mongoose.model('Employee', employeeSchema);