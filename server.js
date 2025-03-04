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

const express = require('express');
const path = require('path');

// Serve static files (your frontend)
app.use(express.static(path.join(__dirname, 'src')));

// Catch-all route to serve your index.html for the root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

// Your other routes and Socket.IO setup here...

const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
