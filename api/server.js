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
    const ideas = await Idea.find();
    res.json(ideas);
});

app.post('/ideas', async (req, res) => {
    const idea = new Idea(req.body);
    await idea.save();
    res.json(idea);
});

app.put('/ideas/:id', async (req, res) => {
    const idea = await Idea.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(idea);
});

app.delete('/ideas/:id', async (req, res) => {
    await Idea.findByIdAndDelete(req.params.id);
    res.sendStatus(204);
});

app.get('/fields-and-connections', async (req, res) => {
    const fields = await Field.find();
    const connections = await Connection.find();
    res.json({ fields, connections });
});

io.on('connection', (socket) => {
    socket.on('new-idea', (idea) => {
        socket.broadcast.emit('new-idea', idea);
    });

    socket.on('delete-idea', (id) => {
        socket.broadcast.emit('delete-idea', id);
    });

    socket.on('update-fields', (fields) => {
        socket.broadcast.emit('update-fields', fields);
    });

    socket.on('update-connections', (connections) => {
        socket.broadcast.emit('update-connections', connections);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
