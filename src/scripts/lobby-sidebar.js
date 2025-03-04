function switchSidebarTab(tabId, clickedButton) {
  document.querySelectorAll(".tabs button").forEach(button => button.classList.remove("active"));
  document.querySelectorAll(".chat, .lobby, .settings").forEach(section => section.classList.remove("active"));
  clickedButton.classList.add("active");
  document.getElementById(tabId).classList.add("active");
}