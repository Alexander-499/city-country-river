const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve your frontend (HTML, CSS, JS) from this server
app.use(express.static('public'));

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

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});