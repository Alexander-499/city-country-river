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
    const { gameCode, playerName } = req.body;
    if (!gameCode || !playerName) {
        return res.status(400).json({ success: false, message: "Invalid data." });
    }

    const gameRef = db.collection("games").doc(gameCode);
    await gameRef.set({
        players: [{ name: playerName, isOperator: true }],
        createdAt: new Date()
    });

    res.json({ success: true, gameCode });
});

// Handle WebSocket connections
io.on("connection", (socket) => {
    socket.on("joinGame", async ({ gameCode, playerName }) => {
        const gameRef = db.collection("games").doc(gameCode);
        const gameDoc = await gameRef.get();

        if (!gameDoc.exists) {
            return socket.emit("error", "Game not found.");
        }

        const gameData = gameDoc.data();
        if (!gameData.players.some(p => p.name === playerName)) {
            gameData.players.push({ name: playerName, isOperator: false });
            await gameRef.update({ players: gameData.players });
        }

        socket.join(gameCode);
        io.to(gameCode).emit("updatePlayers", gameData.players);
    });

    socket.on("disconnect", async () => {
        // Find the game the player was in
        const gamesSnapshot = await db.collection("games").get();
        let updatedPlayers = [];
        let gameCodeToDelete = null;

        gamesSnapshot.forEach(async (doc) => {
            const gameData = doc.data();
            updatedPlayers = gameData.players.filter(p => p.socketId !== socket.id);

            if (updatedPlayers.length === 0) {
                gameCodeToDelete = doc.id;
            } else {
                await db.collection("games").doc(doc.id).update({ players: updatedPlayers });
            }
        });

        if (gameCodeToDelete) {
            await db.collection("games").doc(gameCodeToDelete).delete();
        }
    });
});
