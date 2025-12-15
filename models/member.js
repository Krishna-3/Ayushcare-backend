const mongoose = require('mongoose');
const { Schema } = mongoose;

const memberSchema = new Schema({
    name: {
        type: String,
        required: true
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
    holder: {
        type: Schema.Types.ObjectId,
        ref: 'Holder',
        required: true
    },
});

module.exports = mongoose.model('Member', memberSchema);