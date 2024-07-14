const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { Server } = require("socket.io");

// Express app setup
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://kev2block:8g03QtRl4grvaHy9@ideaboard.vdip7wi.mongodb.net/?retryWrites=true&w=majority&appName=IdeaBoard';
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Error connecting to MongoDB', err);
});

// Define Schemas
const ideaSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  list: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const fieldSchema = new mongoose.Schema({
  left: String,
  top: String,
  content: String,
  extendedText: String,
  fontSize: String,
  color: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Define Models
const Idea = mongoose.models.Idea || mongoose.model('Idea', ideaSchema);
const Field = mongoose.models.Field || mongoose.model('Field', fieldSchema);

// Routes for ideas
app.get('/ideas', async (req, res) => {
  const ideas = await Idea.find();
  res.json(ideas);
});

app.post('/ideas', async (req, res) => {
  const newIdea = new Idea(req.body);
  await newIdea.save();
  res.status(201).json(newIdea);
});

app.put('/ideas/:id', async (req, res) => {
  const updatedIdea = await Idea.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updatedIdea);
});

app.delete('/ideas/:id', async (req, res) => {
  await Idea.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

// Routes for fields
app.get('/fields', async (req, res) => {
  const fields = await Field.find();
  res.json(fields);
});

app.post('/fields', async (req, res) => {
  const newField = new Field(req.body);
  await newField.save();
  res.status(201).json(newField);
});

app.put('/fields/:id', async (req, res) => {
  const updatedField = await Field.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updatedField);
});

app.delete('/fields/:id', async (req, res) => {
  await Field.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

// Serve the index.html file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Create HTTP server
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Set up socket.io
const io = new Server(server);
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('new-idea', (idea) => {
    io.emit('new-idea', idea);
  });

  socket.on('update-idea', (idea) => {
    io.emit('update-idea', idea);
  });

  socket.on('delete-idea', (id) => {
    io.emit('delete-idea', id);
  });

  socket.on('new-field', (field) => {
    io.emit('new-field', field);
  });

  socket.on('update-field', (field) => {
    io.emit('update-field', field);
  });

  socket.on('delete-field', (id) => {
    io.emit('delete-field', id);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});
