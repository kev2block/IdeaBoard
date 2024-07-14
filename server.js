const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const https = require('https');
const socketIo = require('socket.io');

const app = express();
const port = process.env.PORT || 8080;

// MongoDB connection
mongoose.connect(process.env.MONGODB_CONNECTION_STRING, {
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

// Define Models
const Idea = mongoose.model('Idea', ideaSchema);
const Field = mongoose.model('Field', fieldSchema);

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Routes for ideas
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
  io.emit('ideaCreated', newIdea);
  res.status(201).json(newIdea);
});

app.delete('/ideas/:id', async (req, res) => {
  const deletedIdea = await Idea.findByIdAndDelete(req.params.id);
  io.emit('ideaDeleted', deletedIdea._id);
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
  io.emit('fieldCreated', newField);
  res.status(201).json(newField);
});

app.delete('/fields/:id', async (req, res) => {
  const deletedField = await Field.findByIdAndDelete(req.params.id);
  io.emit('fieldDeleted', deletedField._id);
  res.status(204).send();
});

// Serve the index.html file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// HTTPS options
const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

// Start the server with HTTPS and Socket.IO
const server = https.createServer(options, app);
const io = socketIo(server);

io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

server.listen(port, () => {
  console.log(`Server is running at https://localhost:${port}`);
});
