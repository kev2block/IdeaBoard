const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 8080;

mongoose.connect('YOUR_MONGODB_CONNECTION_STRING', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const ideaSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  list: [String]
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

// Get all ideas
app.get('/ideas', async (req, res) => {
  const ideas = await Idea.find();
  res.json(ideas);
});

// Create a new idea
app.post('/ideas', async (req, res) => {
  const newIdea = new Idea(req.body);
  await newIdea.save();
  res.status(201).json(newIdea);
});

// Delete an idea
app.delete('/ideas/:id', async (req, res) => {
  await Idea.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

// Get all fields
app.get('/fields', async (req, res) => {
  const fields = await Field.find();
  res.json(fields);
});

// Create a new field
app.post('/fields', async (req, res) => {
  const newField = new Field(req.body);
  await newField.save();
  res.status(201).json(newField);
});

// Delete a field
app.delete('/fields/:id', async (req, res) => {
  await Field.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
