const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

// Ersetzen Sie 'YOUR_MONGODB_CONNECTION_STRING' durch Ihren tatsächlichen Verbindungsstring
const mongoUri = 'mongodb+srv://kev2block:8g03QtRl4grvaHy9@ideaboard.vdip7wi.mongodb.net/?retryWrites=true&w=majority&appName=IdeaBoard';

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

// Define Models if not already defined
const Idea = mongoose.models.Idea || mongoose.model('Idea', ideaSchema);
const Field = mongoose.models.Field || mongoose.model('Field', fieldSchema);

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
  res.status(201).json(newIdea);
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

app.delete('/fields/:id', async (req, res) => {
  await Field.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

// Serve the index.html file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
