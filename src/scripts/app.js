// Generates a random name
function createName() {
  const prefix = [
    "Cool", "Super", "Hip", "Smug", "Silky", "Good", "Safe", "Dear", "Damp", "Warm", "Rich", "Long", "Dark", "Soft", "Buff", "Dope"
  ][Math.floor(Math.random() * 16)];
  const animal = [
    "Bear", "Dog", "Cat", "Fox", "Lamb", "Lion", "Boar", "Goat", "Vole", "Seal", "Puma", "Mule", "Bull", "Bird", "Bug", "Deer"
  ][Math.floor(Math.random() * 16)];
  return `${prefix} ${animal}`;
}

// Generates a random code
function generateRandomCode(length, onlyLowercaseLetters) {
  let chars = onlyLowercaseLetters ? "abcdefghijklmnopqrstuvwxyz" : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// Generates the current timestamp in HH:MM format
function getTimestamp() {
  const now = new Date();
  return now.getHours().toString().padStart(2, "0") + ":" + now.getMinutes().toString().padStart(2, "0");
}

document.addEventListener("html-included", () => {(function () {
  let playerId;
  let playersRef;
  let playerRef;
  let chatLogRef;
  let rulesRef;
  let lobbyCode = window.location.hash.split('/')[1];
  if (window.location.hash.startsWith('#lobby') && /\/\w{5}$/.test(window.location.hash)) {
    console.log("Lobby code: " + lobbyCode);
  }

  const chatContainer = document.getElementById("chatLog");
  const gameContainer = document.querySelector(".game-container");
  const playerNameInput = document.getElementById("username");
  const lobbyName = document.getElementById("lobbyName");
  const lobbyPrivateIcon = document.getElementById("lobbyPrivateIcon");
  const lobbyPublicIcon = document.getElementById("lobbyPublicIcon");
  const remainingPlayersToStartGame = document.getElementById("remainingPlayersToStartGame");

  playerNameInput.value = localStorage.getItem("name");

  playerNameInput.addEventListener("change", (e) => {
    const newName = e.target.value || createName();
    localStorage.setItem("name", newName)
    e.target.value = newName;
  });

  function initGame() {
    const playerNames = {};

    // Updates player name with text input
    playerNameInput.addEventListener("change", (e) => {
      const newName = e.target.value || createName();
      playerNameInput.value = newName;
      playerRef.update({ name: newName })
      localStorage.setItem("name", newName);
      console.log("Your new name: " + newName);
    })

    function getPlayerName(playerId) {
      return firebase.database().ref(`lobbies/${lobbyCode}/players/${playerId}/name`).once("value").then(snapshot => {
        return snapshot.val() || playerId; // Default name if not found
      });
    }

    function getPlayerOperator(playerId) {
      return firebase.database().ref(`lobbies/${lobbyCode}/players/${playerId}/operator`).once("value").then(snapshot => {
        return snapshot.val() || false; // Default name if not found
      });
    }

    playersRef.on("value", async (snapshot) => {
      const players = snapshot.val();

      if (players && Object.keys(players).length === 1) {
        playerRef.update({ operator: true })
          .catch((error) => console.error("Error setting operator:", error));
      }
    });

    playersRef.on("value", async (snapshot) => {
      if (remainingPlayersToStartGame) {
        remainingPlayersToStartGame.innerHTML = Math.max(0, 2 - Object.keys(snapshot.val()).length);
      }
    });

    // Reference to the players in Firebase
    const playerListContainer = document.getElementById("playerList");

    // Template for a player entry
    function createPlayerHTML(playerId) {
      return `
        <div class="player-item" data-id="${playerId}">
          <div class="main">
            <img class="player-img" src="https://picsum.photos/id/1025/600" alt="Player Avatar">
            <div>
              <span class="nickname">Loading...</span>
              <span class="auth-name">${playerId}</span>
            </div>
          </div>
          <div class="badges"></div>
        </div>
      `;
    }

    // Function to update the player list dynamically
    function updatePlayerList(snapshot) {
      const players = snapshot.val() || {}; // Get all players or empty object if none
      const existingPlayers = {};

      // Mark all existing players in the DOM
      document.querySelectorAll(".player-item").forEach(playerEl => {
        existingPlayers[playerEl.dataset.id] = playerEl;
      });

      if (!playerListContainer) { return; }

      Object.entries(players).forEach(([playerId, player]) => {
        let playerElement = existingPlayers[playerId];

        if (!playerElement) {
          // Create a new player entry if it doesn't exist
          playerListContainer.insertAdjacentHTML("beforeend", createPlayerHTML(playerId));
          playerElement = document.querySelector(`.player-item[data-id="${playerId}"]`);
        }

        // Update existing player info
        if (playerElement.querySelector(".player-img")) {
          playerElement.querySelector(".player-img").src = player.avatar || "https://picsum.photos/600/600?random";
        }
        playerElement.querySelector(".nickname").textContent = player.name || `${playerId}`;
        playerElement.querySelector(".auth-name").textContent = `${playerId}`;

        // Update badges
        const badgesDiv = playerElement.querySelector(".badges");
        badgesDiv.innerHTML = player.operator
          ? '<div class="lobby-leader" title="Lobby leader">👑</div>' : '';
      });

      // Remove players that are no longer in Firebase
      Object.keys(existingPlayers).forEach(playerId => {
        if (!players[playerId]) { existingPlayers[playerId].remove(); }
      });
    }

    firebase.database().ref(`lobbies/${lobbyCode}/name`).once("value").then(snapshot => {
      lobbyName.innerHTML = snapshot.val() || "Unnamed Lobby";
    });

    firebase.database().ref(`lobbies/${lobbyCode}/public`).once("value").then(snapshot => {
      lobbyPrivateIcon.classList.toggle('active', !snapshot.val());
      lobbyPublicIcon.classList.toggle('active', snapshot.val());
    });

    playersRef.on("child_added", playersRef.on("child_changed", async (snapshot) => {
      playerNames[snapshot.key] = await getPlayerName(snapshot.key);
    }));

    // Sends a player join message
    playersRef.on("child_added", async (snapshot) => {
      const playerId = snapshot.key;
      const playerName = await getPlayerName(playerId);

      // Check if a join message was already sent for this player
      chatLogRef
        .orderByChild("contents")
        .equalTo(`${playerName} has joined the game`)
        .once("value", (snapshot) => {
          if (snapshot.exists()) return; // If message exists, don't send again

          const joinMessage = {
            timestamp: getTimestamp(),
            sender: null,
            type: "join",
            contents: `${playerName} has joined the game`,
          };

          chatLogRef.push(joinMessage);
        });
    });

    // Sends a player leave message
    playersRef.on("child_removed", async (snapshot) => {
      const playerId = snapshot.key;
      const playerName = await playerNames[playerId] || "Unknown Player";
      delete playerNames[playerId];

      // Check if a leave message was already sent for this player
      chatLogRef
        .orderByChild("contents")
        .equalTo(`${playerName} has left the game`)
        .once("value", (snapshot) => {
          if (snapshot.exists()) return; // If message exists, don't send again

          const leaveMessage = {
            timestamp: getTimestamp(),
            sender: null,
            type: "leave",
            contents: `${playerName} has left the game`,
          };

          chatLogRef.push(leaveMessage);
        });
    });

    // Sends a chat message
    async function sendMessage(event) {
      event.preventDefault(); // Prevent form submission

      const messageInput = document.getElementById("chatTextarea");
      const messageText = messageInput.value.trim();
      if (!messageText) return;

      const user = firebase.auth().currentUser;
      if (!user) return; // Ensure user is authenticated

      const senderName = await getPlayerName(playerId); // Get player's name
      const senderOperator = await getPlayerOperator(playerId); // Get player's name

      const newMessage = {
        timestamp: getTimestamp(),
        sender: senderName,
        badges: senderOperator ? ["operator"] : [], // Add "operator" badge if needed
        contents: messageText
      };

      chatLogRef.push(newMessage); // Add message to Firebase
      messageInput.value = ""; // Clear input
    }

    // Listens for chat updates
    function listenForMessages() {
      let lastMessageKey = null; // Store the last message key

      chatLogRef.on("child_added", (snapshot) => {
        const message = snapshot.val();
        if (!message) return;

        // Prevent duplicate messages
        const messageKey = snapshot.key; // Unique key for each message
        if (lastMessageKey && messageKey <= lastMessageKey) return;
        lastMessageKey = messageKey;

        // Create chat message element
        const messageDiv = document.createElement("div");

        // Time
        const timeSpan = document.createElement("span");
        timeSpan.classList.add("time");
        timeSpan.innerText = message.timestamp;
        messageDiv.appendChild(timeSpan);

        // Badges (if any)
        if (message.badges && message.badges.includes("operator")) {
          const badgeSpan = document.createElement("span");
          badgeSpan.classList.add("badge", "lobby-leader");
          badgeSpan.title = "Lobby leader";
          badgeSpan.innerText = "👑";
          messageDiv.appendChild(badgeSpan);
        }

        if (message.type === "join" || message.type === "leave" || message.type === "operator") {
          // Handle join/leave messages
          const systemMessageSpan = document.createElement("span");
          systemMessageSpan.classList.add("game-message", message.type);
          systemMessageSpan.innerText = message.contents;
          messageDiv.appendChild(systemMessageSpan);
        } else {
          // Normal chat messages
          if (message.sender) {
            const nameSpan = document.createElement("span");
            nameSpan.classList.add("name");
            nameSpan.textContent = message.sender;
            messageDiv.appendChild(nameSpan);

            messageDiv.innerHTML += ":&nbsp;";

            const contentSpan = document.createElement("span");
            contentSpan.textContent = message.contents;
            messageDiv.appendChild(contentSpan);
          }
        }

        if (chatContainer) {
          chatContainer.appendChild(messageDiv);
          chatContainer.scrollTop = chatContainer.scrollHeight; // Auto-scroll
        }
      });
    }

    function generateRules() {
      const categoriesContainer = document.getElementById('selectedCategories');
      const categories = categoriesContainer ? Array.from(categoriesContainer.querySelectorAll('span')).map(span => span.textContent) : [];
      const everybodyCanEditCategories = document.getElementById('everybodyCanEditCategories')?.checked || false;
      const roundsInput = document.getElementById('rounds range');
      const rounds = roundsInput ? parseInt(roundsInput.value, 10) : 1;
      const roundEndForm = document.getElementById('roundEnd');
      const roundEnd = roundEndForm ? (roundEndForm.querySelector('input:checked')?.getAttribute("id") || "") : "";
      const timeLimitInput = document.getElementById('timeLimit range');
      const timeLimit = timeLimitInput ? parseInt(timeLimitInput.value, 10) : 1;
      const showScoresForm = document.getElementById('showScores');
      const showScores = showScoresForm ? (showScoresForm.querySelector('input:checked')?.getAttribute("id") || "") : "";
      const anonymousVoting = document.getElementById('anonymousVoting')?.checked || false;
      const teamsEnabled = document.getElementById('teams')?.checked || false;
      const everybodyCanChooseTeams = document.getElementById('everybodyCanChooseTeams')?.checked || false;
      const teamElements = document.querySelectorAll('.team');
      const teams = teamElements ? Array.from(teamElements).map(team => {
        const nameInput = team.querySelector('input[type=text]');
        const name = nameInput ? nameInput.value : "Unnamed Team";
        const players = Array.from(team.querySelectorAll('.team-players div')).map(div => div.textContent);
        return { name, players };
      }) : [];

      const jsonData = {
        categories, everybodyCanEditCategories, rounds, roundEnd, timeLimit, showScores, anonymousVoting,
        teams: { enabled: teamsEnabled, everybodyCanChooseTeams, teamList: teams }
      };

      rulesRef.set(jsonData);
    }

    if (document.getElementById("chatForm")) {
      document.getElementById("chatForm").addEventListener("submit", sendMessage);
    }

    ['input', 'change'].forEach(eventType =>
      document.body.addEventListener(eventType, event => {
        if (event.target.matches('.game fieldset input, .game fieldset .game fieldset #selectedCategories, .game fieldset .team')) {
          generateRules(event);
        }
      })
    );

    playersRef.on("value", updatePlayerList);
    listenForMessages();
    generateRules()
  }
  
  // Create a new lobby in Firebase with a random code
  function createLobby() {
    const lobbyNameInput = document.getElementById("lobbyNameInput");
    const lobbyPrivacyPublic = document.getElementById("lobbyPrivacyPublic");
    const randomCode = generateRandomCode(5, true);
    const date = new Date();

    if (gameContainer) { gameContainer.innerHTML = ''; }
    
    // Create a new lobby with the generated randomCode and add a null value
    firebase.database().ref(`lobbies/${randomCode}`).set({
      name: lobbyNameInput.value || "Unnamed Lobby",
      dateCreated: date.toDateString(), // Initialize with an empty players object
      public: lobbyPrivacyPublic.checked || false // Initialize with an empty players object
    }).then(() => {
      console.log(`Lobby created with code: ${randomCode}`);
      window.location.hash = `#lobby/${randomCode}`;
      authGame()
    }).catch((error) => {
      console.error("Error creating lobby:", error);
    });
  }
  document.getElementById('createLobbyButton').addEventListener('click', createLobby);

  function authGame() {
    lobbyCode = window.location.hash.split('/')[1];

    firebase.auth().onAuthStateChanged((user) => {
      if (user && /^[a-zA-Z]{5}$/.test(lobbyCode)) {
        firebase.database().ref(`lobbies/${lobbyCode}`).once('value', (snapshot) => {
          if (snapshot.exists()) {
            playerId = user.uid;
            playersRef =  firebase.database().ref(`lobbies/${lobbyCode}/players`);
            playerRef = firebase.database().ref(`lobbies/${lobbyCode}/players/${playerId}`);
            chatLogRef = firebase.database().ref(`lobbies/${lobbyCode}/chatLog`);
            rulesRef = firebase.database().ref(`lobbies/${lobbyCode}/rules`);

            const name = localStorage.getItem("name") || (playerNameInput?.value.trim() || createName());
            playerNameInput.value = name;
            localStorage.setItem("name", name);

            playerRef.set({
              id: playerId,
              name,
              operator: false
            })

            playerRef.onDisconnect().remove();
            initGame();
          } else {
            console.log(`Lobby ${lobbyCode} does not exist.`);
            app.innerHTML = `Lobby ${lobbyCode} does not exist.`;
          }
        });
      } else if (window.location.hash.startsWith('#lobby') && /\/\w{5}$/.test(window.location.hash)) {
        console.log('You are logged out')
      }
    })
  }

  authGame();

  firebase.auth().signInAnonymously().catch((error) => {
    console.log(error.code, error.message);
  });
})()});