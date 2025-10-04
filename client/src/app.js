// main.js (ESM entry)
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { ImprovedNoise } from "three/examples/jsm/math/ImprovedNoise.js";

// Bridge globals for legacy modules that still expect window.THREE
window.THREE = THREE;
window.OrbitControls = OrbitControls;
window.RGBELoader = RGBELoader;
window.ImprovedNoise = ImprovedNoise;

import { CosmicScene } from "./controllers/cosmic-scene.js";
import { UIController } from "./controllers/ui-controller.js";

// Disable browser scroll restoration and ensure top-of-page start
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    window.scrollTo(0, 0);
  }
});

// Initialize the cosmic experience
window.addEventListener("DOMContentLoaded", () => {
  window.scrollTo(0, 0);
  const canvas = document.getElementById("cosmic-canvas");
  if (canvas) {
    console.log("Initializing Cosmic Gateway...");
    const scene = new CosmicScene(canvas);
    const uiController = new UIController(scene);

    scene
      .init()
      .then(() => {
        uiController.init();
        console.log("Cosmic Gateway ready!");
      })
      .catch((error) => {
        console.error("Failed to initialize Cosmic Gateway:", error);
      });
  } else {
    console.error("Canvas element not found!");
  }
});
