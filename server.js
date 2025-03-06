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
const players = {}; // Stores player data in memory

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'src')));
app.use(express.json()); // Middleware for JSON parsing

// 🔥 **Create a Game Lobby**
app.post('/createGame', async (req, res) => {
  const { gameCode, playerName } = req.body;
  if (!gameCode || !playerName) return res.status(400).json({ success: false, message: "Missing parameters" });

  const gameRef = db.collection('games').doc(gameCode);
  await gameRef.set({
    players: [{ name: playerName, socketId: null, isOperator: true }],
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  res.json({ success: true });
});

// 🔥 **Socket.IO Game Logic**
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // 📌 **Player Joins a Lobby**
  socket.on('joinGame', async ({ gameCode, playerName }) => {
    const gameRef = db.collection('games').doc(gameCode);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      return socket.emit('errorMessage', "Game not found!");
    }

    let gameData = gameDoc.data();

    // 🔥 **Check if player already exists**
    let existingPlayer = gameData.players.find(p => p.name === playerName);
    if (existingPlayer) {
      return socket.emit('errorMessage', "Name already taken! Choose a different one.");
    }

    // Add player to the game
    let newPlayer = { name: playerName, socketId: socket.id, isOperator: gameData.players.length === 0 };
    gameData.players.push(newPlayer);
    await gameRef.update({ players: gameData.players });

    players[socket.id] = { gameCode, playerName };
    socket.join(gameCode);

    console.log(`${playerName} joined game ${gameCode}`);
    io.to(gameCode).emit('updatePlayers', gameData.players);
  });

  // 📌 **Player Disconnects**
  socket.on('disconnect', async () => {
    if (!players[socket.id]) return;

    const { gameCode, playerName } = players[socket.id];
    delete players[socket.id];

    const gameRef = db.collection('games').doc(gameCode);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) return;

    let gameData = gameDoc.data();
    gameData.players = gameData.players.filter(player => player.socketId !== socket.id);

    // 🔥 **Delete game if no players are left**
    if (gameData.players.length === 0) {
      await gameRef.delete();
      console.log(`Game ${gameCode} deleted`);
    } else {
      await gameRef.update({ players: gameData.players });
      io.to(gameCode).emit('updatePlayers', gameData.players);
    }
  });

  // 📌 **Player Leaves a Game (optional)**
  socket.on('leaveGame', async ({ gameCode, playerName }) => {
    const gameRef = db.collection('games').doc(gameCode);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) return;

    let gameData = gameDoc.data();
    gameData.players = gameData.players.filter(player => player.name !== playerName);

    // 🔥 **Delete game if empty**
    if (gameData.players.length === 0) {
      await gameRef.delete();
      console.log(`Game ${gameCode} deleted`);
    } else {
      await gameRef.update({ players: gameData.players });
      io.to(gameCode).emit('updatePlayers', gameData.players);
    }

    socket.leave(gameCode);
  });
});

// Serve index.html for the root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

// Start server
const port = process.env.PORT || 10000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});