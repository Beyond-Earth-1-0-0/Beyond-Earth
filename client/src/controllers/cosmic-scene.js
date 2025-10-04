import * as THREE from "three";
import { LoadingManager } from "../loaders/loading-manager.js";
import { StarField } from "../utilities/star-field.js";
import { EarthSystem } from "./earth-system.js";
import { CameraController } from "./camera-controller.js";
import { DesertSceneController } from "./desert-scene-controller.js";
import { AudioController } from "./audio-controller.js";
import { TransitionController } from "./transition-controller.js";

export class CosmicScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.animationId = 0;
    this.scrollProgress = 0;
    this.userLocation = null;

    // Initialize Three.js components
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      10000
    );
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
    });

    this.loadingManager = new LoadingManager();
    this.starField = new StarField(this.scene);
    this.earthSystem = new EarthSystem(this.scene);
    this.cameraController = new CameraController(this.camera);
    this.desertSceneController = new DesertSceneController();
    this.audioController = new AudioController();
    this.transitionController = new TransitionController(this.audioController);

    this.setupRenderer();
    this.setupEventListeners();
  }

  setupRenderer() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.8;
    this.scene.background = new THREE.Color(0x000011);
  }

  setupEventListeners() {
    window.addEventListener("resize", this.onWindowResize.bind(this));
    window.addEventListener("scroll", this.onScroll.bind(this));

    // Bridge map visibility to audio controller
    window.addEventListener("map-immersive", (e) => {
      const visible = !!e.detail?.visible;
      this.audioController?.setMapImmersive(visible);
    });

    // Start cinematic transition from map to exoplanets
    window.addEventListener("start-exoplanet-transition", () => {
      this.transitionController.start();
    });

    // When complete, hide overlay and notify app (you can navigate here)
    window.addEventListener("exoplanets-transition-complete", () => {
      this.transitionController.hide();
      // Hook: navigate or emit event for router
      try {
        history.pushState({}, "", "/exoplanets");
      } catch (e) {
        window.location.hash = "#exoplanets";
      }
      window.dispatchEvent(new CustomEvent("exoplanets-navigated"));
    });
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  onScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    this.scrollProgress = Math.min(scrollTop / scrollHeight, 1);

    this.cameraController.updateFromScroll(this.scrollProgress);
  }

  async init() {
    console.log("Initializing Cosmic Scene...");

    try {
      // Initialize Three.js systems
      await this.starField.init();
      await this.earthSystem.init();

      // Initialize Desert Scene
      await this.desertSceneController.init();

      // Prepare audio (will start on first user gesture)
      await this.audioController.init();

      // Hook desert scene into camera controller
      this.cameraController.setDesertSceneController(
        this.desertSceneController
      );

      // Set default location for desert scene
      this.userLocation = { lat: 30.0444, lng: 31.2357 }; // Cairo, Egypt

      // Place camera at starting point
      this.cameraController.setInitialPosition();

      // Start animation loop
      this.animate();

      // Hide loading screen
      setTimeout(() => {
        this.loadingManager.hideLoadingScreen();
      }, 2000);

      console.log("Cosmic Scene initialized successfully");
    } catch (error) {
      console.error("Error initializing Cosmic Scene:", error);
      this.loadingManager.hideLoadingScreen();
    }
  }

  animate() {
    this.animationId = requestAnimationFrame(this.animate.bind(this));

    try {
      this.starField.update();
      this.earthSystem.update(this.camera.position);
      this.cameraController.update();
      // Drive audio based on descent intensity and speed
      this.audioController.update({
        inDescent: this.cameraController.inDescent,
        intensity: this.cameraController.descentIntensity,
        speed: this.cameraController.descentSpeed || 0,
      });
      this.renderer.render(this.scene, this.camera);
    } catch (error) {
      console.error("Animation error:", error);
    }
  }

  destroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);

    this.starField.dispose();
    this.earthSystem.dispose();
    this.renderer.dispose();
  }

  getCameraController() {
    return this.cameraController;
  }
}
