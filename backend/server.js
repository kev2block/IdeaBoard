  const express = require('express');
  const http = require('http');
  const socketIo = require('socket.io');
  const mongoose = require('mongoose');
  const path = require('path');
  require('dotenv').config();
  
  const app = express();
  const server = http.createServer(app);
  const io = socketIo(server);
  
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  
  const db = mongoose.connection;
  db.on('error', console.error.bind(console, 'MongoDB connection error:'));
  db.once('open', () => {
    console.log('MongoDB connected');
  });
  
  app.use(express.json());
  app.use('/api/fields', require('./routes/fields'));
  app.use('/api/ideas', require('./routes/ideas'));
  
  app.use(express.static(path.join(__dirname, '../frontend')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  });
  
  io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
      console.log('user disconnected');
    });
    socket.on('update-fields', (fields) => {
      socket.broadcast.emit('update-fields', fields);
    });
    socket.on('update-connections', (connections) => {
      socket.broadcast.emit('update-connections', connections);
    });
  });
  
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
  