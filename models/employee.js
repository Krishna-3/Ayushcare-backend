const mongoose = require('mongoose');
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
        required: true
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

module.exports = mongoose.model('Employee', employeeSchema);