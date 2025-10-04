const audio = document.getElementById("bgAudio");
const toggleBtn = document.getElementById("toggleBtn");
const controlBar = document.getElementById("ambientControl");
const uiOverlay = document.getElementById("ui-overlay"); // starting point
const lastCard = document.querySelector("section .card:last-of-type");
const loadingScreen = document.getElementById("loading-screen");

let isPlaying = true;
let currentNarration = null;
let loadingDone = false;

// Autoplay attempt
window.addEventListener("DOMContentLoaded", () => {
  audio.muted = false;
  audio
    .play()
    .then(() => {
      toggleBtn.textContent = "Disable";
      toggleBtn.classList.remove("off");
    })
    .catch(() => {
      isPlaying = false;
      toggleBtn.textContent = "Enable";
      toggleBtn.classList.add("off");
    });
});

// Finish loading
window.addEventListener("load", () => {
  setTimeout(() => {
    loadingScreen.style.display = "none";
    loadingDone = true;

    // ✅ start observing only after loading
    startControlBarObserver();
  }, 3000);
});

// Toggle button
toggleBtn.addEventListener("click", () => {
  if (!isPlaying) {
    audio.muted = false;
    audio.play().then(() => {
      isPlaying = true;
      toggleBtn.textContent = "Disable";
      toggleBtn.classList.remove("off");
    });
  } else {
    audio.pause();
    if (currentNarration) {
      currentNarration.pause();
      currentNarration = null;
    }
    isPlaying = false;
    toggleBtn.textContent = "Enable";
    toggleBtn.classList.add("off");
  }
});

// Narration per card
const cards = document.querySelectorAll(".card");
const cardObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && isPlaying) {
        const src = entry.target.getAttribute("data-audio");
        if (src) {
          if (currentNarration) {
            currentNarration.pause();
            currentNarration = null;
          }
          currentNarration = new Audio(src);
          currentNarration.play().catch(() => {});
        }
      }
    });
  },
  { threshold: 0.6 }
);
cards.forEach((card) => cardObserver.observe(card));

// ✅ control bar observer (start after loading)
function startControlBarObserver() {
  const uiObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          controlBar.style.display = "flex"; // show
        } else {
          controlBar.style.display = "none"; // hide
        }
      });
    },
    { threshold: 0.3 }
  );

  uiObserver.observe(uiOverlay);

  // 👇 extra safety: if already visible when loading ends, show immediately
  const rect = uiOverlay.getBoundingClientRect();
  if (rect.top < window.innerHeight && rect.bottom > 0) {
    controlBar.style.display = "flex";
  }
}

// Stop audio after last card
const lastCardObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        audio.pause();
        if (currentNarration) currentNarration.pause();
        isPlaying = false;
        controlBar.style.display = "none";
        toggleBtn.textContent = "Enable";
        toggleBtn.classList.add("off");
      }
    });
  },
  { threshold: 0.5 }
);
lastCardObserver.observe(lastCard);
