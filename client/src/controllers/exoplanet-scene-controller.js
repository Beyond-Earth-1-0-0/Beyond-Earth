// src/controllers/exoplanet-scene-controller.js
import * as THREE from "three";
import { StarField } from "../utilities/star-field.js";

let spaceScene = null;
let cockpitScene = null;
let camera = null;
let renderer = null;
let starField = null;

// Disable mouse camera controls when in cockpit mode
let cameraControlEnabled = false;

/**
 * Initializes the exoplanet scene with starfield, lights, and camera.
 */
export async function initExoplanetScene() {
  console.log("Initializing exoplanet scene...");
  spaceScene = new THREE.Scene();
  cockpitScene = new THREE.Scene();

  // Add cockpit lighting so materials are visible
  const cockpitAmbient = new THREE.AmbientLight(0xffffff, 0.7);
  cockpitScene.add(cockpitAmbient);

  const cockpitFill = new THREE.DirectionalLight(0xffffff, 0.3);
  cockpitFill.position.set(0, 5, 5);
  cockpitScene.add(cockpitFill);

  const cockpitRim = new THREE.PointLight(0x00ffff, 0.05, 50);
  cockpitRim.position.set(-2, 2, -2);
  cockpitScene.add(cockpitRim);

  // Enhanced lighting setup for better cockpit experience
  const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
  sunLight.position.set(100, 50, 100);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  spaceScene.add(sunLight);

  const hemiLight = new THREE.HemisphereLight(0x4040ff, 0x202020, 0.3);
  spaceScene.add(hemiLight);

  const ambient = new THREE.AmbientLight(0xffffff, 0.2);
  spaceScene.add(ambient);

  // Add some subtle colored lights for atmosphere
  const blueLight = new THREE.PointLight(0x0080ff, 0.5, 200);
  blueLight.position.set(-50, 30, 50);
  spaceScene.add(blueLight);

  const orangeLight = new THREE.PointLight(0xff8000, 0.3, 150);
  orangeLight.position.set(70, -20, -60);
  spaceScene.add(orangeLight);

  // Camera setup optimized for cockpit view
  camera = new THREE.PerspectiveCamera(
    75, // Wider FOV for immersive cockpit experience
    window.innerWidth / window.innerHeight,
    0.5, // Close near plane for cockpit details
    10000 // Far plane for galaxy-scale viewing
  );

  // Start camera at origin (will be moved into cockpit)
  camera.position.set(0, 0, 0);

  // Enhanced renderer setup
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance"
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  // Set background to deep space black
  renderer.setClearColor(0x000000, 1);

  console.log("Renderer created successfully");

  // Initialize enhanced starfield
  try {
    starField = new StarField(spaceScene);
    await starField.init();
    console.log("Starfield initialized");
  } catch (error) {
    console.warn("Starfield failed to load:", error);
  }

  // Event listeners
  window.addEventListener("resize", onWindowResize);

  console.log("Scene initialized with enhanced graphics settings");
}

function onWindowResize() {
  if (!camera || !renderer) return;

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);

  console.log(`Viewport resized to ${window.innerWidth}x${window.innerHeight}`);
}

/**
 * Per-frame update and render loop.
 */
export function animate() {
  if (!renderer) return;

  // Update starfield animation
  if (starField) {
    starField.update();
  }

  // No automatic camera rotation - this is handled by cockpit controls
}

/**
 * Enables or disables external camera controls.
 * @param {boolean} enabled
 */
export function setCameraControlEnabled(enabled) {
  cameraControlEnabled = enabled;
  console.log(`Camera controls ${enabled ? 'enabled' : 'disabled'}`);
}

/**
 * Get the current camera world position
 * @returns {THREE.Vector3}
 */
export function getCameraWorldPosition() {
  return camera.getWorldPosition(new THREE.Vector3());
}

/**
 * Get the current camera world direction
 * @returns {THREE.Vector3}
 */
export function getCameraWorldDirection() {
  return camera.getWorldDirection(new THREE.Vector3());
}

/**
 * Cleanup function to dispose of resources.
 */
export function dispose() {
  if (starField) {
    starField.dispose();
    starField = null;
  }

  if (renderer) {
    renderer.dispose();
    if (renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
  }

  window.removeEventListener("resize", onWindowResize);

  console.log("Scene disposed");
}

export {
  spaceScene,
  cockpitScene,
  camera,
  renderer,
  starField,
};