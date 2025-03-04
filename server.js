const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the 'src' folder
app.use(express.static(path.join(__dirname, 'src')));

// Handle real-time communication with Socket.IO
io.on('connection', (socket) => {
  console.log('a user connected');
  
  // Listen for messages
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg); // Broadcast message to all clients
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

// Serve index.html for the root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

const port = process.env.PORT || 10000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});