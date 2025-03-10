function navigate(e, el) {
  if (e.inputType && el.value.length === 1) { el.nextElementSibling?.focus(); }
  if (e.key === "Backspace" && el.value === "") { el.previousElementSibling?.focus(); }
}

function joinLobby() {
  const inputs = document.querySelectorAll('#joinLobbyInputContainer > input');
  let combinedValue = '';

  inputs.forEach(input => { combinedValue += input.value; });

  if (!/^[a-zA-Z]{5}$/.test(combinedValue)) {
    console.error(`Error: The combined value ('${combinedValue}') must be exactly 5 letters (A-Z, a-z) long.`);
    return;
  }

  window.location.hash = `#lobby/${combinedValue}`;
}

// function createLobby() { window.location.hash = `#lobby/${'abcde'}`; }

const socket = io();

document.getElementById("createLobbyButton").addEventListener("click", async () => {
  const playerName = prompt("Enter your name:");
  if (!playerName) return alert("You need to enter a name!");

  const gameCode = Array.from({ length: 5 }, () =>
    String.fromCharCode(97 + Math.floor(Math.random() * 26))
  ).join("");

  const response = await fetch("/createGame", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gameCode, playerName })
  });

  const result = await response.json();
  if (result.success) {
    window.location.hash = `#lobby/${gameCode}`;
  } else {
    alert("Failed to create game.");
  }
});

// Join Game from URL
async function joinGameFromURL() {
  const hash = window.location.hash;
  if (!hash.startsWith("#lobby/")) return;

  const gameCode = hash.split("/")[1];
  const playerName = prompt("Enter your name:");
  if (!playerName) return alert("You need to enter a name!");

  socket.emit("joinGame", { gameCode, playerName });
}

socket.on("updatePlayers", (players) => {
  updatePlayerList(players);
});

socket.on("errorMessage", (message) => {
  alert(message);
});

function updatePlayerList(players) {
  const playerList = document.getElementById("playerList");
  if (!playerList) return;

  playerList.innerHTML = players
    .map(({ name, isOperator }) =>
      `<li>${name} ${isOperator ? "(Operator)" : ""}</li>`
    )
    .join("");
}

// Fixes dynamically injected elements
document.body.addEventListener("DOMNodeInserted", function () {
  const playerList = document.getElementById("playerList");
  if (playerList) updatePlayerList([]);
});

// Make sure to handle game join on page load
window.addEventListener("load", joinGameFromURL);

// let game = {
//   "name": "Alexander499's Lobby",
//   "dateCreated": "",
//   "private": true,
//   "rules": {
//     "categories": [
//       "City",
//       "Country",
//       "River"
//     ],
//     "everybodyCanEditCategories": false,
//     "rounds": 1,
//     "roundEnd": "Press stop & time limit",
//     "timeLimit": 1,
//     "showScores": "After each round",
//     "anonymousVoting": false,
//     "teams": {
//       "enabled": false,
//       "everybodyCanChooseTeams": false,
//       "teamList": [
//         {
//           "name": "",
//           "players": [
//             "Alexander499",
//             "Guest #1"
//           ]
//         }
//       ]
//     }
//   },
//   "players": [
//     {
//       "id": 0,
//       "name": "Alexander499",
//       "operator": true,
//     }
//   ]
// }