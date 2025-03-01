function navigate(e, el) {
  if (e.inputType && el.value.length === 1) { el.nextElementSibling?.focus(); }
  if (e.key === "Backspace" && el.value === "") { el.previousElementSibling?.focus(); }
}

function combineValuesAndNavigate() {
  const inputs = document.querySelectorAll('#joinLobbyInputContainer > input');
  let combinedValue = '';
  
  inputs.forEach(input => { combinedValue += input.value; });
  
  if (combinedValue.length !== 5) {
    console.error(`Error: The combined value ('${combinedValue}') must be exactly 5 characters long.`);
    return;
  }

  window.location.hash = `#lobby/${combinedValue}`;
}



const textarea = document.querySelector('#chatTextarea');
textarea.addEventListener('input', autoResize);