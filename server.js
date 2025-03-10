// const express = require('express');
// const http = require('http');
// const socketIo = require('socket.io');
// const path = require('path');
// require('dotenv').config();
// const admin = require('firebase-admin');

// if (!process.env.FIREBASE_CONFIG) {
//   throw new Error("Missing FIREBASE_CONFIG environment variable");
// }

// // Decode Base64 JSON and initialize Firebase Admin
// const firebaseConfigJson = Buffer.from(process.env.FIREBASE_CONFIG, 'base64').toString('utf8');
// const firebaseConfig = JSON.parse(firebaseConfigJson);

// admin.initializeApp({
//   credential: admin.credential.cert(firebaseConfig)
// });

// const db = admin.firestore();
// const players = {}; // Stores player data in memory

// const app = express();
// const server = http.createServer(app);
// const io = socketIo(server);

// app.use(express.static(path.join(__dirname, 'src')));
// app.use(express.json()); // Middleware for JSON parsing

// // 🔥 **Create a Game Lobby**
// app.post('/createGame', async (req, res) => {
//   const { gameCode, playerName } = req.body;
//   if (!gameCode || !playerName) return res.status(400).json({ success: false, message: "Missing parameters" });

//   const gameRef = db.collection('games').doc(gameCode);
//   await gameRef.set({
//     players: [{ name: playerName, socketId: null, isOperator: true }],
//     createdAt: admin.firestore.FieldValue.serverTimestamp()
//   });

//   res.json({ success: true });
// });

// // 🔥 **Socket.IO Game Logic**
// io.on('connection', (socket) => {
//   console.log(`User connected: ${socket.id}`);

//   // 📌 **Player Joins a Lobby**
//   socket.on('joinGame', async ({ gameCode, playerName }) => {
//     const gameRef = db.collection('games').doc(gameCode);
//     const gameDoc = await gameRef.get();

//     if (!gameDoc.exists) {
//       return socket.emit('errorMessage', "Game not found!");
//     }

//     let gameData = gameDoc.data();

//     // 🔥 **Check if player already exists**
//     let existingPlayer = gameData.players.find(p => p.name === playerName);
//     if (existingPlayer) {
//       return socket.emit('errorMessage', "Name already taken! Choose a different one.");
//     }

//     // Add player to the game
//     let newPlayer = { name: playerName, socketId: socket.id, isOperator: gameData.players.length === 0 };
//     gameData.players.push(newPlayer);
//     await gameRef.update({ players: gameData.players });

//     players[socket.id] = { gameCode, playerName };
//     socket.join(gameCode);

//     console.log(`${playerName} joined game ${gameCode}`);
//     io.to(gameCode).emit('updatePlayers', gameData.players);
//   });

//   // 📌 **Player Disconnects**
//   socket.on('disconnect', async () => {
//     if (!players[socket.id]) return;

//     const { gameCode, playerName } = players[socket.id];
//     delete players[socket.id];

//     const gameRef = db.collection('games').doc(gameCode);
//     const gameDoc = await gameRef.get();

//     if (!gameDoc.exists) return;

//     let gameData = gameDoc.data();
//     gameData.players = gameData.players.filter(player => player.socketId !== socket.id);

//     // 🔥 **Delete game if no players are left**
//     if (gameData.players.length === 0) {
//       await gameRef.delete();
//       console.log(`Game ${gameCode} deleted`);
//     } else {
//       await gameRef.update({ players: gameData.players });
//       io.to(gameCode).emit('updatePlayers', gameData.players);
//     }
//   });

//   // 📌 **Player Leaves a Game (optional)**
//   socket.on('leaveGame', async ({ gameCode, playerName }) => {
//     const gameRef = db.collection('games').doc(gameCode);
//     const gameDoc = await gameRef.get();

//     if (!gameDoc.exists) return;

//     let gameData = gameDoc.data();
//     gameData.players = gameData.players.filter(player => player.name !== playerName);

//     // 🔥 **Delete game if empty**
//     if (gameData.players.length === 0) {
//       await gameRef.delete();
//       console.log(`Game ${gameCode} deleted`);
//     } else {
//       await gameRef.update({ players: gameData.players });
//       io.to(gameCode).emit('updatePlayers', gameData.players);
//     }

//     socket.leave(gameCode);
//   });
// });

// // Serve index.html for the root path
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'src', 'index.html'));
// });

// // Start server
// const port = process.env.PORT || 10000;
// server.listen(port, () => {
//   console.log(`Server running on port ${port}`);
// });

// server.js

require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const admin = require('firebase-admin');

// Initialize Firebase Admin with your service account
const serviceAccount = require('./city-country-river-76537-firebase-adminsdk-fbsvc-6241ec8d12.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DB_URL // set this in your .env file
});

const db = admin.database();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files (adjust the folder as needed)
app.use(express.static('src'));

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('New connection:', socket.id);

  // When a player joins a lobby
  socket.on('joinLobby', async (data) => {
    // Expected data: { lobbyCode, username, lobbyName, private, categories, operator }
    try {
      const lobbyRef = db.ref(`games/${data.lobbyCode}`);

      // Create lobby if it doesn't exist
      const lobbySnap = await lobbyRef.once('value');
      if (!lobbySnap.exists()) {
        await lobbyRef.set({
          name: data.lobbyName || "Lobby",
          dateCreated: new Date().toISOString(),
          private: data.private || false,
          rules: {
            categories: data.categories || ["City", "Country", "River"],
            everybodyCanEditCategories: false,
            rounds: 1,
            roundEnd: "Press stop & time limit",
            timeLimit: 1,
            showScores: "After each round",
            anonymousVoting: false,
            teams: {
              enabled: false,
              everybodyCanChooseTeams: false,
              teamList: [
                // You can structure teams as needed
              ]
            }
          },
          players: {}
        });
      }

      // Add the player to the lobby
      const playersRef = lobbyRef.child('players');
      // Using push() creates a unique key for the player
      const newPlayerRef = playersRef.push();
      await newPlayerRef.set({
        id: newPlayerRef.key,
        name: data.username,
        operator: data.operator || false
      });

      // Save lobby and player info on the socket for later cleanup
      socket.lobbyCode = data.lobbyCode;
      socket.playerKey = newPlayerRef.key;

      // Retrieve and log the complete players list in the console
      const playersSnap = await playersRef.once('value');
      console.log(`Players in lobby ${data.lobbyCode}:`, playersSnap.val());

      // Optionally, notify clients that a new player joined (broadcast to the room)
      io.to(data.lobbyCode).emit('playersUpdated', playersSnap.val());

      // Join the socket to a room corresponding to the lobby code
      socket.join(data.lobbyCode);
    } catch (err) {
      console.error("Error in joinLobby:", err);
    }
  });

  // When a player disconnects
  socket.on('disconnect', async () => {
    if (socket.lobbyCode && socket.playerKey) {
      try {
        const lobbyRef = db.ref(`games/${socket.lobbyCode}`);
        const playerRef = lobbyRef.child(`players/${socket.playerKey}`);
        await playerRef.remove();

        // After removing, check if there are any players left
        const playersSnap = await lobbyRef.child('players').once('value');
        if (!playersSnap.exists()) {
          // No players remain; delete the lobby
          await lobbyRef.remove();
          console.log(`Lobby ${socket.lobbyCode} deleted as there are no players left.`);
        } else {
          // Log updated players list in the console
          console.log(`Updated players in lobby ${socket.lobbyCode}:`, playersSnap.val());
          // Notify remaining clients about the updated players list
          io.to(socket.lobbyCode).emit('playersUpdated', playersSnap.val());
        }
      } catch (err) {
        console.error("Error during disconnect cleanup:", err);
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
