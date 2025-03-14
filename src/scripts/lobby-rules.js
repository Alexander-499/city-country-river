function generateRules() {
  const categoriesContainer = document.getElementById('selectedCategories');
  const categories = categoriesContainer ? Array.from(categoriesContainer.querySelectorAll('span')).map(span => span.textContent) : [];

  const everybodyCanEditCategories = document.getElementById('everybodyCanEditCategories')?.checked || false;
  const roundsInput = document.getElementById('rounds range');
  const rounds = roundsInput ? parseInt(roundsInput.value, 10) : 1;

  const roundEndForm = document.getElementById('roundEnd');
  const roundEnd = roundEndForm ? (roundEndForm.querySelector('input:checked')?.parentElement.textContent.trim() || "") : "";

  const timeLimitInput = document.getElementById('timeLimit range');
  const timeLimit = timeLimitInput ? parseInt(timeLimitInput.value, 10) : 1;

  const showScoresForm = document.getElementById('showScores');
  const showScores = showScoresForm ? (showScoresForm.querySelector('input:checked')?.parentElement.textContent.trim() || "") : "";

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
    categories,
    everybodyCanEditCategories,
    rounds,
    roundEnd,
    timeLimit,
    showScores,
    anonymousVoting,
    teams: {
      enabled: teamsEnabled,
      everybodyCanChooseTeams,
      teamList: teams
    }
  };

  // console.log(JSON.stringify(jsonData, null, 2));
}

// Select a parent element that exists when the page loads
document.body.addEventListener('input', function (event) {
  // Check if the target element is one of the elements you want to listen to
  if (event.target.matches('input, #selectedCategories, .team')) {
    generateRules(event); // Call your function here
  }
});

document.body.addEventListener('change', function (event) {
  if (event.target.matches('input, #selectedCategories, .team')) {
    generateRules(event);
  }
});