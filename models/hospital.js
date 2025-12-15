const mongoose = require('mongoose');
const { Schema } = mongoose;

const hospitalSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    photo: {
        type: Buffer,
    },
    area: {
        type: String,
        required: true,
    },
    location: {
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
    about: {
        type: String,
        required: true
    },
    adminApproved: {
        type: Boolean,
        default: false,
        required: true
    },
    doctors: [{
        name: {
            type: String,
            required: true
        },
        speciality: {
            type: String,
            required: true
        },
    }],
    patients: [{
        patient: {
            type: Schema.Types.ObjectId,
            refPath: 'patients.patientModel'
        },
        patientModel: {
            type: String,
            required: true,
            enum: ['Member', 'Holder']
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    role: {
        type: String,
        default: 'hospital',
        requried: true,
        enum: ['hospital']
    }
});

hospitalSchema.pre('save', function (next) {
    if (this.isModified('patients')) {
        this.patients.forEach(patient => {
            if (!patient.addedAt) {
                patient.addedAt = new Date();
            }
        });
    }
    next();
});

module.exports = mongoose.model('Hospital', hospitalSchema);