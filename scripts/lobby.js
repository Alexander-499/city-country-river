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

function createLobby() {
  window.location.hash = `#lobby/${'abcde'}`;
}