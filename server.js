const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

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
  io.emit('new-idea', newIdea); // Emit new idea event
});

app.put('/ideas/:id', async (req, res) => {
  const updatedIdea = await Idea.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updatedIdea);
  io.emit('update-idea', updatedIdea); // Emit update idea event
});

app.delete('/ideas/:id', async (req, res) => {
  await Idea.findByIdAndDelete(req.params.id);
  res.status(204).send();
  io.emit('delete-idea', req.params.id); // Emit delete idea event
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
  io.emit('new-field', newField); // Emit new field event
});

app.put('/fields/:id', async (req, res) => {
  const updatedField = await Field.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updatedField);
  io.emit('update-field', updatedField); // Emit update field event
});

app.delete('/fields/:id', async (req, res) => {
  await Field.findByIdAndDelete(req.params.id);
  res.status(204).send();
  io.emit('delete-field', req.params.id); // Emit delete field event
});

// Serve the index.html file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Create HTTP server
const server = http.createServer(app);

// Set up socket.io
const io = new Server(server);
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
