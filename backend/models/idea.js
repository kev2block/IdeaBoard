const mongoose = require('mongoose');

const ideaSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    list: { type: [String], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('Idea', ideaSchema);