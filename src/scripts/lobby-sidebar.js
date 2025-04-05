function switchSidebarTab(tabId, clickedButton) {
  document.querySelectorAll(".tabs button").forEach(button => button.classList.remove("active"));
  document.querySelectorAll(".chat, .lobby, .settings").forEach(section => section.classList.remove("active"));
  clickedButton.classList.add("active");
  document.getElementById(tabId).classList.add("active");
}

document.addEventListener("html-included", () => {
  const sidebarLobbySearch = document.getElementById("sidebarLobbySearch");
  if (!sidebarLobbySearch) return;
  const playerItem = document.getElementById("playerList").children;

  sidebarLobbySearch.addEventListener("input", e => {
    const value = e.target.value.toLowerCase();

    for (const player of playerItem) {
      const nickname = player.querySelector(".nickname")?.innerText.toLowerCase() || "";
      const authName = player.querySelector(".auth-name")?.innerText.toLowerCase() || "";

      player.classList.toggle("hidden", !(nickname.includes(value) || authName.includes(value)));
    }
  })
});