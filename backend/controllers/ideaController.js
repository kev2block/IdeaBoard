const Idea = require('../models/idea');

// Create a new idea
exports.createIdea = async (req, res) => {
    try {
        const idea = new Idea(req.body);
        await idea.save();
        res.status(201).json(idea);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Get all ideas
exports.getIdeas = async (req, res) => {
    try {
        const ideas = await Idea.find();
        res.status(200).json(ideas);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update an idea
exports.updateIdea = async (req, res) => {
    try {
        const idea = await Idea.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(idea);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Delete an idea
exports.deleteIdea = async (req, res) => {
    try {
        await Idea.findByIdAndDelete(req.params.id);
        res.status(204).end();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};