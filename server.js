const firebase = require("firebase/app")
const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
require("dotenv").config();

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

firebase.initializeApp(firebaseConfig);

let app = express();
app.use(cors());
app.use(express.json());

admin.initializeApp({
  credential: admin.credential.cert({
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY, // Idk if I need `.replace(/\\n/g, '\n')`
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
    universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
  }),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const serverRef = admin.database().ref("serverStatus");

async function runServerLogic() {
  // Ensure only one server instance runs
  const success = await serverRef.transaction((data) => {
    if (data && data.running) return; // If another instance is running, cancel
    return { running: true };
  });

  if (!success.committed) {
    console.log("Server logic already running elsewhere, skipping...");
    return;
  }

  console.log("Server logic started");

  // Deletes empty lobbies after 10 secs
  const emptyLobbies = {}; // Stores timers for lobbies with no players
  function watchLobbiesForEmptyPlayers() {
    console.log('Watching empty lobbies');

    admin.database().ref('lobbies').on('value', (snapshot) => {
      snapshot.forEach(lobbySnapshot => {
        const lobbyId = lobbySnapshot.key;
        const playersSnapshot = lobbySnapshot.child('players');

        if (!playersSnapshot.exists() || Object.keys(playersSnapshot.val() || {}).length === 0) {
          // If already scheduled for deletion, do nothing
          if (!emptyLobbies[lobbyId]) {
            console.log(`Lobby ${lobbyId} is empty. Deleting in 10 seconds if no players join.`);

            // Set a timeout to delete the lobby after 10 seconds
            emptyLobbies[lobbyId] = setTimeout(() => {
              admin.database().ref(`lobbies/${lobbyId}`).remove().then(() => {
                console.log(`Lobby ${lobbyId} deleted due to inactivity.`);
                delete emptyLobbies[lobbyId]; // Remove from tracking
              });
            }, 10000);
          }
        } else {
          // If players join back, cancel the deletion
          if (emptyLobbies[lobbyId]) {
            clearTimeout(emptyLobbies[lobbyId]);
            delete emptyLobbies[lobbyId];
            console.log(`Lobby ${lobbyId} is no longer empty. Deletion canceled.`);
          }
        }
      });
    });
  }
  watchLobbiesForEmptyPlayers();
}

// Reset server flag when shutting down
async function shutdown() {
  console.log("Server shutting down, resetting server flag...");
  try {
    await serverRef.set({ running: false });
    console.log("Server flag reset. Exiting...");
    process.exit(0); // Ensure a clean exit
  } catch (error) {
    console.error("Error resetting server flag:", error);
    process.exit(1); // Exit with failure if something went wrong
  }
}

process.on("SIGINT", shutdown);  // Handles Ctrl+C (manual stop)
process.on("SIGTERM", shutdown); // Handles process termination / Kill command (server stop)

app.listen(5500, async () => {
  console.log("Server running on http://127.0.0.1:5500");
  await runServerLogic();
});