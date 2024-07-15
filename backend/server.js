  const express = require('express');
  const mongoose = require('mongoose');
  const cors = require('cors');
  const http = require('http');
  const socketIo = require('socket.io');
  const fieldRoutes = require('./routes/fields');
  const ideaRoutes = require('./routes/ideas');
  
  const app = express();
  const server = http.createServer(app);
  const io = socketIo(server);
  
  app.use(cors());
  app.use(express.json());
  app.use('/fields', fieldRoutes);
  app.use('/ideas', ideaRoutes);
  
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://kev2block:8g03QtRl4grvaHy9@ideaboard.vdip7wi.mongodb.net/?retryWrites=true&w=majority&appName=IdeaBoard';
  const PORT = process.env.PORT || 3000;
  
  mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true
  }).then(() => {
      console.log('Connected to MongoDB');
  }).catch(err => {
      console.error('Error connecting to MongoDB', err);
  });
  
  io.on('connection', (socket) => {
      console.log('New client connected');
  
      socket.on('new-idea', (idea) => {
          io.emit('new-idea', idea);
      });
  
      socket.on('delete-idea', (id) => {
          io.emit('delete-idea', id);
      });
  
      socket.on('update-fields', (fields) => {
          io.emit('update-fields', fields);
      });
  
      socket.on('update-connections', (connections) => {
          io.emit('update-connections', connections);
      });
  
      socket.on('disconnect', () => {
          console.log('Client disconnected');
      });
  });
  
  server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
  });  