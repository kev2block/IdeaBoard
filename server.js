const fs = require('fs');
const http = require('http');
const express = require('express');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const mongoUri = 'mongodb+srv://kev2block:8g03QtRl4grvaHy9@ideaboard.vdip7wi.mongodb.net/?retryWrites=true&w=majority&appName=IdeaBoard';

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Error connecting to MongoDB', err);
});

// Define Schemas and Models
const ideaSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  list: [String],
  createdAt: Date,
  updatedAt: Date
});

const fieldSchema = new mongoose.Schema({
  left: String,
  top: String,
  content: String,
  extendedText: String,
  fontSize: String,
  color: String
});

const Idea = mongoose.model('Idea', ideaSchema);
const Field = mongoose.model('Field', fieldSchema);

app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/ideas', async (req, res) => {
  const ideas = await Idea.find();
  res.json(ideas);
});

app.post('/ideas', async (req, res) => {
  const newIdea = new Idea({
    ...req.body,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  await newIdea.save();
  io.emit('idea-added', newIdea);
  res.status(201).json(newIdea);
});

app.delete('/ideas/:id', async (req, res) => {
  await Idea.findByIdAndDelete(req.params.id);
  io.emit('idea-deleted', req.params.id);
  res.status(204).send();
});

app.get('/fields-and-connections', async (req, res) => {
  const fields = await Field.find();
  res.json({ fields });
});

app.post('/fields', async (req, res) => {
  const newField = new Field(req.body);
  await newField.save();
  io.emit('field-added', newField);
  res.status(201).json(newField);
});

app.delete('/fields/:id', async (req, res) => {
  await Field.findByIdAndDelete(req.params.id);
  io.emit('field-deleted', req.params.id);
  res.status(204).send();
});

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('update-fields', async (updatedFields) => {
    await Field.deleteMany({});
    await Field.insertMany(updatedFields);
    socket.broadcast.emit('update-fields', updatedFields);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

server.listen(3000, () => {
  console.log(`Server is running on port 3000`);
});