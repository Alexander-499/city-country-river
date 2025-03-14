// How to play slideshow
let howToPlaySlideshowSlideIndex = 1;
function howToPlaySlideshowPlusSlides(n) { howToPlaySlideshowShowSlides(howToPlaySlideshowSlideIndex += n); }
function howToPlaySlideshowCurrentSlide(n) { howToPlaySlideshowShowSlides(howToPlaySlideshowSlideIndex = n); }

function howToPlaySlideshowShowSlides(n) {
  let slides = document.querySelectorAll(".slideshow > div");
  let dots = document.querySelectorAll(".slideshow-navigation > div");
  if (!slides.length) return;

  howToPlaySlideshowSlideIndex = ((n - 1 + slides.length) % slides.length) + 1;

  slides.forEach((slide, i) => slide.style.display = i === howToPlaySlideshowSlideIndex - 1 ? "flex" : "none");
  dots.forEach((dot, i) => dot.classList.toggle("active", i === howToPlaySlideshowSlideIndex - 1));
}

// Navigate inputs back and forward
function navigate(e, el) {
  if (e.inputType && el.value.length === 1) { el.nextElementSibling?.focus(); }
  if (e.key === "Backspace" && el.value === "") { el.previousElementSibling?.focus(); }
}