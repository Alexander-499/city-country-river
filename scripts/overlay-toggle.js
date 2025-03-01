function createLobbyOverlay(state) {
  const overlay = document.getElementById("createLobbyOverlay");
  const innerDiv = overlay.querySelector("#createLobbyOverlay > div");

  if (state) {
    overlay.style.display = "flex";
    overlay.classList.remove("animation-fade-out");
    innerDiv.classList.remove("animation-zoom-out");
  } else {
    overlay.classList.add("animation-fade-out");
    innerDiv.classList.add("animation-zoom-out");

    setTimeout(() => {
      overlay.style.display = "none";
    }, 300);
  }
}