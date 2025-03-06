const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
require('dotenv').config();
const admin = require('firebase-admin');

if (!process.env.FIREBASE_CONFIG) {
  throw new Error("Missing FIREBASE_CONFIG environment variable");
}

// Decode Base64 JSON and initialize Firebase Admin
const firebaseConfigJson = Buffer.from(process.env.FIREBASE_CONFIG, 'base64').toString('utf8');
const firebaseConfig = JSON.parse(firebaseConfigJson);

admin.initializeApp({
  credential: admin.credential.cert(firebaseConfig)
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

// ! Lobby stuff
app.use(express.json()); // Middleware for JSON parsing

// Create a new game
app.post("/createGame", async (req, res) => {
  const { gameCode } = req.body;

  if (!gameCode || gameCode.length !== 5) {
    return res.status(400).json({ success: false, message: "Invalid game code." });
  }

  const gameRef = db.collection("games").doc(gameCode);
  await gameRef.set({ players: [], createdAt: new Date() });

  res.json({ success: true, gameCode });
});

// When a player joins a game
io.on("connection", (socket) => {
  socket.on("joinGame", async ({ gameCode, playerName }) => {
    const gameRef = db.collection("games").doc(gameCode);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      return socket.emit("error", "Game not found.");
    }

    const gameData = gameDoc.data();
    gameData.players.push(playerName);
    await gameRef.update({ players: gameData.players });

    socket.join(gameCode);
    io.to(gameCode).emit("updatePlayers", gameData.players);
  });
});
