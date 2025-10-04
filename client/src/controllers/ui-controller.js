export class UIController {
  constructor(scene) {
    this.scene = scene;
    this.progressBar = document.querySelector(".progress-fill");
    this.progressText = document.querySelector(".progress-text");
  }

  init() {
    this.setupScrollListener();
    this.injectMicroInteractions();
  }

  setupScrollListener() {
    window.addEventListener("scroll", () => {
      const scrollProgress = this.scene.scrollProgress;

      // Update progress bar
      if (this.progressBar) {
        this.progressBar.style.width = `${scrollProgress * 100}%`;
      }

      // Update progress text
      if (this.progressText) {
        const cameraController = this.scene.getCameraController();
        const phase = cameraController
          ? cameraController.getCurrentPhase(scrollProgress)
          : "Deep Space";
        this.progressText.textContent = phase;
      }
    });
  }

  injectMicroInteractions() {
    // Animate progress indicator subtly on hover
    const indicator = document.querySelector(".progress-indicator");
    if (indicator) {
      indicator.addEventListener("mouseenter", () => {
        indicator.style.transform = "translateY(-2px)";
      });
      indicator.addEventListener("mouseleave", () => {
        indicator.style.transform = "translateY(0)";
      });
    }

    // Parallax drift for UI cards
    const parallaxTargets = [
      document.querySelector(".progress-indicator"),
    ].filter(Boolean);
    if (parallaxTargets.length) {
      window.addEventListener("mousemove", (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        parallaxTargets.forEach((el, i) => {
          const intensity = 2 + i;
          el.style.transform = `translate(${(-x * intensity).toFixed(2)}px, ${(
            -y * intensity
          ).toFixed(2)}px)`;
        });
      });
    }
  }
}
