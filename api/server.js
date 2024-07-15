const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Connect to MongoDB
mongoose.connect('mongodb+srv://kev2block:8g03QtRl4grvaHy9@ideaboard.vdip7wi.mongodb.net/?retryWrites=true&w=majority&appName=IdeaBoard', { useNewUrlParser: true, useUnifiedTopology: true });

const IdeaSchema = new mongoose.Schema({
    title: String,
    description: String,
    category: String,
    createdAt: String,
    updatedAt: String,
    list: [String]
});

const FieldSchema = new mongoose.Schema({
    id: String,
    left: String,
    top: String,
    content: String,
    extendedText: String,
    fontSize: String,
    color: String
});

const ConnectionSchema = new mongoose.Schema({
    sourceId: String,
    targetId: String
});

const Idea = mongoose.model('Idea', IdeaSchema);
const Field = mongoose.model('Field', FieldSchema);
const Connection = mongoose.model('Connection', ConnectionSchema);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/ideas', async (req, res) => {
    try {
        const ideas = await Idea.find();
        res.json(ideas);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching ideas.' });
    }
});

app.post('/ideas', async (req, res) => {
    try {
        const idea = new Idea(req.body);
        await idea.save();
        io.emit('new-idea', idea);
        res.json(idea);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while saving the idea.' });
    }
});

app.delete('/ideas/:id', async (req, res) => {
    try {
        await Idea.findByIdAndDelete(req.params.id);
        io.emit('delete-idea', req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while deleting the idea.' });
    }
});

app.get('/fields-and-connections', async (req, res) => {
    try {
        const fields = await Field.find();
        const connections = await Connection.find();
        res.json({ fields, connections });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching fields and connections.' });
    }
});

io.on('connection', (socket) => {
    console.log('New client connected');
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));