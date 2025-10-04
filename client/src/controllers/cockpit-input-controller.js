// src/utils/cockpitLoader.js
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * Loads and prepares the spaceship cockpit model.
 * @returns {Promise<THREE.Group | null>} Loaded cockpit model or null if failed.
 */
export async function loadCockpit() {
  const loader = new GLTFLoader();
  try {
    const { scene } = await loader.loadAsync(
      "../assets/models/exo-cockpit.glb"
    );

    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const desiredCockpitSize = 20; // world units - adjust to taste
    const autoScale = desiredCockpitSize / maxDim;
    scene.scale.setScalar(autoScale);
    scene.rotation.set(0, Math.PI / 2, 0);
    scene.traverse((child) => {
      if (!child.isMesh) return;

      const matName = (child.material && child.material.name) ? child.material.name.toLowerCase() : "";
      const meshName = child.name ? child.name.toLowerCase() : "";

      const looksLikeGlass = matName.includes("glass") || meshName.includes("glass") || matName.includes("windshield");
      if (looksLikeGlass) {
        // keep existing material but tune it (safer than swapping types)
        child.material = child.material.clone();
        child.material.transparent = true;
        child.material.opacity = 0.25;        // visual translucency
        // IMPORTANT: ensure depth is written for the pre-pass to occlude planets
        child.material.depthWrite = true;
        child.material.depthTest = true;
        child.material.side = THREE.FrontSide;
        // renderOrder can help avoid sorting issues: keep cockpit depth first (lower)
        child.renderOrder = 0;
      } else {
        child.material = child.material ? child.material.clone() : new THREE.MeshStandardMaterial();
        child.material.transparent = false;
        child.material.depthWrite = true;
        child.material.depthTest = true;
        child.renderOrder = 0;
      }
    });


    return scene;
  } catch (error) {
    console.error("Failed to load cockpit model:", error);
    return null;
  }
}

/**
 * Updates cockpit position and rotation relative to the camera.
 * Keeps cockpit in sync with the player's view.
 * @param {THREE.Camera} camera - Active camera.
 * @param {THREE.Object3D} cockpitModel - Loaded cockpit model.
 * @param {number} [distance=-15] - Offset distance in front of camera.
 */
export function updateCockpit(camera, cockpitModel, distance = -15) {
  if (!cockpitModel) return;

  // Match camera orientation
  cockpitModel.quaternion.copy(camera.quaternion);

  // Place cockpit relative to camera
  const offset = new THREE.Vector3(0, 0, distance).applyQuaternion(
    camera.quaternion
  );

  cockpitModel.position.copy(camera.position).add(offset);
}