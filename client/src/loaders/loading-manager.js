export class LoadingManager {
  constructor() {
    this.loadingScreen = document.getElementById("loading-screen");
  }

  hideLoadingScreen() {
    if (this.loadingScreen) {
      this.loadingScreen.classList.add("hidden");

      // Remove from DOM after transition
      setTimeout(() => {
        this.loadingScreen.style.display = "none";
      }, 500);
    }
  }

  updateProgress(progress) {
    const progressBar = document.querySelector(".loading-progress");
    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }
  }
}
