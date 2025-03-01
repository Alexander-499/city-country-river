function includeHTML() {
  var z, i, element, file, xmlHttp;
  z = document.getElementsByTagName("*");
  for (i = 0; i < z.length; i++) {
    element = z[i];
    file = element.getAttribute("data-include");
    if (file) {
      xmlHttp = new XMLHttpRequest();
      xmlHttp.onreadystatechange = function() {
        if (this.readyState == 4) {
          if (this.status == 200) { element.innerHTML = this.responseText; }
          if (this.status == 404) { element.innerHTML = "Page not found."; }
          element.removeAttribute("data-include");
          includeHTML();
          document.dispatchEvent(new Event('html-included'));
        }
      }
      xmlHttp.open("GET", file, true);
      xmlHttp.send();
      return;
    }
  }
}

function router() {
  const hash = window.location.hash;
  const app = document.getElementById('app');
  let file = '';

  // Match the route to the corresponding file
  if (!hash) {
    file = 'pages/home.html';
  } else if (hash.startsWith('#about')) {
    file = 'pages/about.html';
  } else if (hash.startsWith('#lobby')) {
    file = 'pages/lobby.html';
  } else {
    file = 'pages/404.html';
  }

  // Load the HTML file into the #app container
  app.setAttribute('data-include', file);
  includeHTML();

  // Handle game code in the URL hash for the lobby
  if (hash.startsWith('#lobby/')) {
    const gameCode = hash.split('/')[1];
    document.addEventListener('html-included', () => {
      document.getElementById('gameCode').textContent = gameCode;
    });
  }
}

// Handle navigation without page reload
window.addEventListener('hashchange', router);

// Initial load
includeHTML();
router();
