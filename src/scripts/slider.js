const observer = new MutationObserver(() => {
  document.querySelectorAll("input[type='range']").forEach((sliderEl) => {
    const sliderValue = sliderEl.previousElementSibling; // Assuming .value is right before the input

    if (sliderEl && !sliderEl.dataset.listenerAttached) {
      sliderEl.dataset.listenerAttached = "true"; // Prevents multiple listeners

      sliderEl.addEventListener("input", (event) => {
        const tempSliderValue = event.target.value;
        if (sliderValue) sliderValue.textContent = tempSliderValue;

        const progress = (tempSliderValue / sliderEl.max) * 100;
        sliderEl.style.background = `linear-gradient(to right, #949cf7 ${progress}%, #4e5058 ${progress}%)`;
      });
    }
  });
});

observer.observe(document.body, { childList: true, subtree: true });