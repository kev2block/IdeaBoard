const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const port = process.env.PORT || 8080;

const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://kev2block:8g03QtRl4grvaHy9@ideaboard.vdip7wi.mongodb.net/?retryWrites=true&w=majority&appName=IdeaBoard';

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Error connecting to MongoDB', err);
});

const ideaSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  list: [String],
  createdAt: Date,
  updatedAt: Date,
});

const fieldSchema = new mongoose.Schema({
  left: String,
  top: String,
  content: String,
  extendedText: String,
  fontSize: String,
  color: String,
});

const Idea = mongoose.model('Idea', ideaSchema);
const Field = mongoose.model('Field', fieldSchema);

app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const io = new Server(server);

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('addIdea', async (idea) => {
    const newIdea = new Idea(idea);
    await newIdea.save();
    io.emit('ideaAdded', newIdea);
  });

  socket.on('deleteIdea', async (id) => {
    await Idea.findByIdAndDelete(id);
    io.emit('ideaDeleted', id);
  });

  socket.on('addField', async (field) => {
    const newField = new Field(field);
    await newField.save();
    io.emit('fieldAdded', newField);
  });

  socket.on('deleteField', async (id) => {
    await Field.findByIdAndDelete(id);
    io.emit('fieldDeleted', id);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

app.get('/ideas', async (req, res) => {
  const ideas = await Idea.find();
  res.json(ideas);
});

app.post('/ideas', async (req, res) => {
  const newIdea = new Idea(req.body);
  await newIdea.save();
  res.status(201).json(newIdea);
});

app.delete('/ideas/:id', async (req, res) => {
  await Idea.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

app.get('/fields', async (req, res) => {
  const fields = await Field.find();
  res.json(fields);
});

app.post('/fields', async (req, res) => {
  const newField = new Field(req.body);
  await newField.save();
  res.status(201).json(newField);
});

app.delete('/fields/:id', async (req, res) => {
  await Field.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});