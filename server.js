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

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'src')));
app.use(express.json()); // For parsing JSON bodies

// ─── HTTP ENDPOINT TO CREATE A LOBBY ──────────────────────────────────────────
app.post('/createGame', async (req, res) => {
  const { gameCode, playerName } = req.body;
  if (!gameCode || !playerName) {
    return res.status(400).json({ success: false, message: "Missing parameters" });
  }

  const gameRef = db.collection('games').doc(gameCode);
  // Create the lobby with the operator – socketId remains null until they join via socket.
  await gameRef.set({
    players: [{ name: playerName, socketId: null, isOperator: true }],
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  res.json({ success: true });
});

// ─── SOCKET.IO HANDLING ─────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // When a client joins a game lobby, they call joinGame.
  socket.on('joinGame', async ({ gameCode, playerName }) => {
    const gameRef = db.collection('games').doc(gameCode);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      return socket.emit('errorMessage', 'Game not found.');
    }

    let gameData = gameDoc.data();

    // Check if a player with this name already exists
    const duplicate = gameData.players.find(p => p.name === playerName);

    if (duplicate) {
      // If the player exists but their socketId is null (i.e. operator who created lobby), update it now.
      if (!duplicate.socketId) {
        duplicate.socketId = socket.id;
      } else {
        // If the player already has a socketId, then reject duplicate names.
        return socket.emit('errorMessage', 'Name already taken! Choose a different one.');
      }
    } else {
      // Add the new player
      gameData.players.push({ name: playerName, socketId: socket.id, isOperator: false });
    }

    // Update the game in Firestore
    await gameRef.update({ players: gameData.players });

    // Let the socket join a room named with the gameCode
    socket.join(gameCode);

    // Save the player's game info for later (like disconnect)
    socket.data = { gameCode, playerName };

    // Fetch updated data to ensure consistency and emit updated player list
    const updatedGameDoc = await gameRef.get();
    const updatedPlayers = updatedGameDoc.data().players;
    io.to(gameCode).emit('updatePlayers', updatedPlayers);
  });

  // Handle disconnect event
  socket.on('disconnect', async () => {
    if (!socket.data) return; // The socket never joined a game

    const { gameCode } = socket.data;
    const gameRef = db.collection('games').doc(gameCode);
    const gameDoc = await gameRef.get();
    if (!gameDoc.exists) return;

    let gameData = gameDoc.data();

    // Remove this player based on socket id
    gameData.players = gameData.players.filter(p => p.socketId !== socket.id);

    if (gameData.players.length === 0) {
      // Delete the game if no players remain
      await gameRef.delete();
      console.log(`Game ${gameCode} deleted as no players remain.`);
    } else {
      await gameRef.update({ players: gameData.players });
      io.to(gameCode).emit('updatePlayers', gameData.players);
    }
  });
});

// ─── SERVE THE INDEX.HTML ──────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

// ─── START THE SERVER ───────────────────────────────────────────────────────────
const port = process.env.PORT || 10000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});