const Field = require('../models/field');

// Create a new field
exports.createField = async (req, res) => {
    try {
        const field = new Field(req.body);
        await field.save();
        res.status(201).json(field);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Get all fields
exports.getFields = async (req, res) => {
    try {
        const fields = await Field.find();
        res.status(200).json(fields);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update a field
exports.updateField = async (req, res) => {
    try {
        const field = await Field.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(field);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Delete a field
exports.deleteField = async (req, res) => {
    try {
        await Field.findByIdAndDelete(req.params.id);
        res.status(204).end();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};