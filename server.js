const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const https = require('https');

const app = express();
const port = process.env.PORT || 8080;

// Ersetzen Sie 'YOUR_MONGODB_CONNECTION_STRING' durch Ihren tatsächlichen Verbindungsstring
const mongoUri = process.env.MONGODB_CONNECTION_STRING;

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Error connecting to MongoDB', err);
  process.exit(1);
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
  try {
    const ideas = await Idea.find();
    res.json(ideas);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/ideas', async (req, res) => {
  try {
    const newIdea = new Idea({
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await newIdea.save();
    res.status(201).json(newIdea);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/ideas/:id', async (req, res) => {
  try {
    await Idea.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Routes for fields
app.get('/fields', async (req, res) => {
  try {
    const fields = await Field.find();
    res.json(fields);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/fields', async (req, res) => {
  try {
    const newField = new Field(req.body);
    await newField.save();
    res.status(201).json(newField);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/fields/:id', async (req, res) => {
  try {
    await Field.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
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

// Start the server
https.createServer(options, app).listen(port, () => {
  console.log(`Server is running at https://localhost:${port}`);
});
