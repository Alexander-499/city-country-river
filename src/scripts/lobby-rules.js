document.addEventListener("html-included", () => {
  const selectedCategories = document.getElementById('selectedCategories');
  if (selectedCategories) new MutationObserver(() => {
    updateSelectedCategoriesQuantity();
  }).observe(selectedCategories, { childList: true, characterData: true, subtree: true });

  function updateSelectedCategoriesQuantity() {
    const selectedCategoriesQuantity = document.getElementById('selectedCategoriesQuantity');
    if (selectedCategories) selectedCategoriesQuantity.innerText = selectedCategories.childElementCount;
  }

  updateSelectedCategoriesQuantity();

  function animateLetterSelectionLetter() {
    const allLetters = "abcdefghijklmnopqrstuvwxyzඞ";
    const letterSelectionLetter = document.getElementById('letterSelectionLetter');
    if (!letterSelectionLetter) return;
    const initialLetter = letterSelectionLetter.innerHTML;
    const randomLetter = () => allLetters[Math.floor(Math.random() * allLetters.length)];
    const randomString = (length) => Array.from({ length }, randomLetter).join("");
  
    (function animate(speed = 10) {
      if (speed > 150) return (letterSelectionLetter.innerHTML = initialLetter);
      letterSelectionLetter.innerHTML = randomString(1);
      setTimeout(() => animate(speed * 1.08), speed);
    })();
  }

  animateLetterSelectionLetter();
});