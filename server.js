const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
require('dotenv').config();
const admin = require('firebase-admin');

if (!process.env.FIREBASE_CREDENTIALS) {
  throw new Error("Missing FIREBASE_CREDENTIALS environment variable");
}

// Decode Base64 JSON and initialize Firebase Admin
const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_CREDENTIALS, 'base64').toString('utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const players = {};

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the 'src' folder
app.use(express.static(path.join(__dirname, 'src')));

// Handle WebSocket connections
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('joinGame', async (playerName) => {
    players[socket.id] = playerName;
    console.log(`${playerName} joined the game`);

    // Store player in Firebase
    const gameRef = db.collection('games').doc('currentGame');
    await gameRef.set({ players: Object.values(players) });

    io.emit('updatePlayers', Object.values(players));
  });

  socket.on('requestGameState', async () => {
    const gameRef = db.collection('games').doc('currentGame');
    const gameDoc = await gameRef.get();

    if (gameDoc.exists) {
      socket.emit('loadGameState', gameDoc.data());
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
    delete players[socket.id]; // Remove player on disconnect
  });
});

// Serve index.html for the root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

// Start server
const port = process.env.PORT || 10000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const admin = require("firebase-admin");

const firebaseConfigBase64 = process.env.FIREBASE_CONFIG;
if (!firebaseConfigBase64) {
    throw new Error("FIREBASE_CONFIG environment variable is missing.");
}

const firebaseConfigJson = Buffer.from(firebaseConfigBase64, "base64").toString("utf8");
const firebaseConfig = JSON.parse(firebaseConfigJson);

admin.initializeApp({
    credential: admin.credential.cert(firebaseConfig),
});
