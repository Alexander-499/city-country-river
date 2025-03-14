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

// {
//   "name": "Alexander499's Lobby",
//   "dateCreated": "",
//   "private": true,
//   "chatLog" : [...],
//   "rules": {
//     "categories": [
//       "City", "Country", "River"
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
//   "players": [...]
// }