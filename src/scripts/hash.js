function router() {
  const app = document.getElementById('app');
  let file = '';

  if (!window.location.hash) {
    file = 'pages/home.html';
  } else if (window.location.hash.startsWith('#about')) {
    file = 'pages/about.html';
  } else if (window.location.hash.startsWith('#lobby') && /\/\w{5}$/.test(window.location.hash)) {
    file = 'pages/lobby.html';
  } else if (window.location.hash.startsWith('#lobby')) {
    app.innerHTML = "Lobby code must be exactly 5 letters. Valid example URL: 'index.html#lobby/abcde'";
    return;
  } else {
    file = 'pages/404.html';
  }

  const xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if (this.readyState === 4) {
      if (this.status === 200) {
        app.innerHTML = this.responseText;
        if (window.location.hash.startsWith('#lobby/')) {
          document.getElementById('gameCode').textContent = window.location.hash.split('/')[1];
          document.getElementById('headerGame').classList.add('active');
        }
      } else if (this.status === 404) { app.innerHTML = "Page not found."; }
      document.dispatchEvent(new Event('html-included'));
    }
  };
  xhr.open("GET", file, true);
  xhr.send();
}

// Handle navigation without page reload and initial load
window.addEventListener('hashchange', router);
router();