const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
    left: { type: String, required: true },
    top: { type: String, required: true },
    content: { type: String, required: true },
    extendedText: { type: String, default: '' },
    fontSize: { type: String, default: '16px' },
    color: { type: String, default: '#000000' }
}, { timestamps: true });

module.exports = mongoose.model('Field', fieldSchema);