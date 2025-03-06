const observer = new MutationObserver(() => {
  document.querySelectorAll("input[type='range']").forEach((sliderEl) => {
    if (!sliderEl.dataset.listenerAttached) {
      sliderEl.dataset.listenerAttached = "true"; // Prevent multiple listeners

      const sliderValue = sliderEl.previousElementSibling; // Assuming .value is right before the input

      sliderEl.addEventListener("input", (event) => {
        const tempSliderValue = event.target.value;
        if (sliderValue) sliderValue.textContent = tempSliderValue;

        const max = parseFloat(sliderEl.max) || 100; // Ensure max is a valid number
        const progress = (tempSliderValue / max) * 100;

        sliderEl.style.background = `linear-gradient(to right, #949cf7 ${progress}%, #4e5058 ${progress}%)`;
      });
    }
  });
});

observer.observe(document.body, { childList: true, subtree: true });