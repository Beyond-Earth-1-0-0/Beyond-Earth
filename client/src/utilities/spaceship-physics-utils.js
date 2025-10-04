// src/utilities/spaceship-physics-utils.js
import * as THREE from "three";
import { playTravelSound, playArrivalSound, playPlanetScanSound as playAudioScanSound } from "./audio-utils.js";
import { planets } from "../controllers/exoplanet-factory.js";


let isLanding = false;

/**
 * Smoothly moves spaceship to planet position with enhanced effects
 * @param {THREE.Object3D} spaceship - The spaceship object
 * @param {THREE.Mesh} planet - Target planet
 * @param {number} [approachDistance=30] - Distance to maintain from planet surface
 * @param {number} delta - Delta time from clock.getDelta()
*/


export function landOnPlanet(spaceship, planet, approachDistance = 30) {
  if (isLanding) {
    console.log("Already landing on a planet");
    return;
  }

  isLanding = true;
  console.log(`Initiating travel to ${planet.userData.name}...`);

  // Play travel sound
  playTravelSound();

  // Calculate target position (approach distance from planet surface)
  const planetRadius = planet.userData.visualRadius || 5;
  const totalDistance = planetRadius + approachDistance;

  // Direction from planet center to current spaceship position
  const direction = new THREE.Vector3()
    .subVectors(spaceship.position, planet.position)
    .normalize();

  // If spaceship is too close to planet center, use a default direction
  if (direction.length() < 0.1) {
    direction.set(1, 0, 0); // Default direction
  }

  const targetPosition = new THREE.Vector3()
    .copy(planet.position)
    .add(direction.multiplyScalar(totalDistance));

  // Store initial position and time
  const startPosition = spaceship.position.clone();
  const startTime = Date.now();
  const travelDuration = 2000; // 2 seconds

  // Create scanning effect
  createScanningEffect();

  // Update status display
  updateStatusDisplay(`Traveling to ${planet.userData.name}...`);

  function animateTravel() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / travelDuration, 1);

    // Smooth easing function (ease-in-out)
    const smoothProgress = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    // Interpolate position
    spaceship.position.lerpVectors(startPosition, targetPosition, smoothProgress);

    // Add slight rotation during travel
    spaceship.rotation.y += 0.02;
    spaceship.rotation.x += 0.01;

    if (progress < 1) {
      requestAnimationFrame(animateTravel);
    } else {
      // Travel completed
      console.log(`Arrived at ${planet.userData.name}`);

      // Play arrival sound
      playArrivalSound();

      // Update status
      updateStatusDisplay(`Arrived at ${planet.userData.name}`);

      // Reset landing flag
      isLanding = false;

      // Trigger arrival effects
      triggerArrivalEffects(spaceship, planet);
    }
  }

  animateTravel();
}

/**
 * Creates visual scanning effect across the screen
 */
function createScanningEffect() {
  const scanningDiv = document.createElement('div');
  scanningDiv.className = 'scanning-effect';
  scanningDiv.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 1500;
    background: linear-gradient(90deg, 
      transparent 0%, 
      rgba(0, 255, 255, 0.1) 45%, 
      rgba(0, 255, 255, 0.3) 50%, 
      rgba(0, 255, 255, 0.1) 55%, 
      transparent 100%
    );
    transform: translateX(-100%);
    animation: scanningAnimation 2s ease-in-out forwards;
  `;

  // Add keyframe animation for scanning
  if (!document.getElementById('scanning-animation-style')) {
    const style = document.createElement('style');
    style.id = 'scanning-animation-style';
    style.textContent = `
      @keyframes scanningAnimation {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(scanningDiv);

  // Remove after animation
  setTimeout(() => {
    if (scanningDiv.parentNode) {
      scanningDiv.parentNode.removeChild(scanningDiv);
    }
  }, 2000);
}

/**
 * Trigger visual and audio effects on arrival
 * @param {THREE.Object3D} spaceship
 * @param {THREE.Mesh} planet
 */
function triggerArrivalEffects(spaceship, planet) {
  // Create particle effect around spaceship
  createArrivalParticles(spaceship);

  // Brief camera shake effect
  const camera = spaceship.children.find(child => child.isCamera);
  if (camera) {
    const originalPosition = camera.position.clone();

    let shakeTime = 0;
    const shakeDuration = 500;

    function shakeCamera() {
      shakeTime += 16;
      const intensity = Math.max(0, 1 - shakeTime / shakeDuration) * 0.1;

      camera.position.copy(originalPosition);
      camera.position.add(new THREE.Vector3(
        (Math.random() - 0.5) * intensity,
        (Math.random() - 0.5) * intensity,
        (Math.random() - 0.5) * intensity
      ));

      if (shakeTime < shakeDuration) {
        requestAnimationFrame(shakeCamera);
      } else {
        camera.position.copy(originalPosition);
      }
    }

    shakeCamera();
  }

  // Flash effect
  createFlashEffect();
}

/**
 * Create particle effects around spaceship on arrival
 * @param {THREE.Object3D} spaceship
 */
function createArrivalParticles(spaceship) {
  // This would create a particle system if Three.js particles are available
  // For now, we'll create a simple glow effect
  const glowGeometry = new THREE.SphereGeometry(5, 16, 16);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.3
  });

  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  spaceship.add(glow);

  // Animate and remove glow
  let glowTime = 0;
  const glowDuration = 1000;

  function animateGlow() {
    glowTime += 16;
    const progress = glowTime / glowDuration;

    glow.scale.setScalar(1 + progress * 2);
    glow.material.opacity = Math.max(0, 0.3 * (1 - progress));

    if (glowTime < glowDuration) {
      requestAnimationFrame(animateGlow);
    } else {
      spaceship.remove(glow);
      glow.geometry.dispose();
      glow.material.dispose();
    }
  }

  animateGlow();
}

/**
 * Create screen flash effect
 */
function createFlashEffect() {
  const flash = document.createElement('div');
  flash.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 255, 255, 0.3);
    pointer-events: none;
    z-index: 2000;
    opacity: 1;
    transition: opacity 0.3s ease;
  `;

  document.body.appendChild(flash);

  // Fade out flash
  setTimeout(() => {
    flash.style.opacity = '0';
    setTimeout(() => {
      if (flash.parentNode) {
        flash.parentNode.removeChild(flash);
      }
    }, 300);
  }, 100);
}

/**
 * Update status display with current action
 * @param {string} message
 */
function updateStatusDisplay(message) {
  const targetDisplay = document.getElementById('target-display');
  if (targetDisplay) {
    targetDisplay.textContent = message;
  }
}

/**
 * Play planet scan sound with visual feedback
 */
export function playPlanetScanSound() {
  playAudioScanSound();

  // Add visual scan lines effect
  createScanLinesEffect();
}

/**
 * Create scanning lines effect
 */
function createScanLinesEffect() {
  const scanLines = document.createElement('div');
  scanLines.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 1500;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0, 255, 255, 0.1) 2px,
      rgba(0, 255, 255, 0.1) 4px
    );
    opacity: 0;
    animation: scanLinesAnim 2s ease-in-out;
  `;

  // Add keyframe animation
  if (!document.getElementById('scan-lines-style')) {
    const style = document.createElement('style');
    style.id = 'scan-lines-style';
    style.textContent = `
      @keyframes scanLinesAnim {
        0% { opacity: 0; }
        20% { opacity: 0.6; }
        80% { opacity: 0.6; }
        100% { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(scanLines);

  // Remove after animation
  setTimeout(() => {
    if (scanLines.parentNode) {
      scanLines.parentNode.removeChild(scanLines);
    }
  }, 2000);
}

/**
 * Calculate orbital mechanics for realistic movement
 * @param {THREE.Vector3} position - Current position
 * @param {THREE.Vector3} velocity - Current velocity
 * @param {THREE.Vector3} centerMass - Center of gravitational influence
 * @param {number} gravityStrength - Strength of gravity
 * @param {number} deltaTime - Time step
 * @returns {Object} Updated position and velocity
 */
export function calculateOrbitalMotion(position, velocity, centerMass, gravityStrength, deltaTime) {
  // Calculate gravitational force
  const direction = new THREE.Vector3().subVectors(centerMass, position);
  const distance = direction.length();

  if (distance < 0.1) return { position, velocity }; // Avoid division by zero

  direction.normalize();
  const forceMagnitude = gravityStrength / (distance * distance);
  const force = direction.multiplyScalar(forceMagnitude);

  // Update velocity (F = ma, assuming unit mass)
  velocity.add(force.multiplyScalar(deltaTime));

  // Update position
  const deltaPosition = velocity.clone().multiplyScalar(deltaTime);
  position.add(deltaPosition);

  return { position, velocity };
}

/**
 * Create warp effect for fast travel
 * @param {THREE.Object3D} spaceship
 * @param {THREE.Vector3} targetPosition
 * @param {Function} onComplete
 */
export function warpToPosition(spaceship, targetPosition, onComplete) {
  console.log("Initiating warp drive...");

  playTravelSound();

  // Create warp tunnel effect
  createWarpTunnelEffect();

  const startPosition = spaceship.position.clone();
  const startTime = Date.now();
  const warpDuration = 1500;

  function animateWarp() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / warpDuration, 1);

    // Non-linear warp motion (accelerate then decelerate)
    let warpProgress;
    if (progress < 0.1) {
      warpProgress = progress * 5; // Fast acceleration
    } else if (progress > 0.9) {
      warpProgress = 0.5 + (progress - 0.9) * 5; // Fast deceleration
    } else {
      warpProgress = 0.5; // Maintain position in warp
    }

    spaceship.position.lerpVectors(startPosition, targetPosition, Math.min(warpProgress, 1));

    if (progress < 1) {
      requestAnimationFrame(animateWarp);
    } else {
      console.log("Warp drive complete");
      if (onComplete) onComplete();
    }
  }

  animateWarp();
}

/**
 * Create warp tunnel visual effect
 */
function createWarpTunnelEffect() {
  const warpTunnel = document.createElement('div');
  warpTunnel.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100px;
    height: 100px;
    border: 2px solid #00ffff;
    border-radius: 50%;
    box-shadow: 
      0 0 20px #00ffff,
      inset 0 0 20px #00ffff;
    pointer-events: none;
    z-index: 1500;
    animation: warpExpand 1.5s ease-out forwards;
  `;

  // Add keyframe animation for warp effect
  if (!document.getElementById('warp-effect-style')) {
    const style = document.createElement('style');
    style.id = 'warp-effect-style';
    style.textContent = `
      @keyframes warpExpand {
        0% {
          width: 100px;
          height: 100px;
          opacity: 1;
        }
        50% {
          width: 2000px;
          height: 2000px;
          opacity: 0.8;
        }
        100% {
          width: 4000px;
          height: 4000px;
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(warpTunnel);

  // Remove after animation
  setTimeout(() => {
    if (warpTunnel.parentNode) {
      warpTunnel.parentNode.removeChild(warpTunnel);
    }
  }, 1500);
}

/**
 * Simple collision detection and resolution
 * @param {THREE.Object3D} spaceship
 * @param {THREE.Mesh} planet
 * @param {THREE.Vector3} velocity
 * @param {Object} options
 */


export function resolveCollisions(spaceship, planets, velocity, options = {}) {
  const { penetrationSlack = 5.0, approachDistance = 30 } = options;

  if (!spaceship || !planets || !velocity) return;

  planets.forEach((planet) => {
    if (!planet) return;

    const distance = spaceship.position.distanceTo(planet.position);
    const planetRadius = planet.userData.visualRadius || 5;

    // 👇 updated: add approachDistance
    const minDistance = planetRadius + approachDistance;

    if (distance < minDistance) {
      // Push-back direction (from planet center to ship)
      const direction = new THREE.Vector3()
        .subVectors(spaceship.position, planet.position)
        .normalize();

      // Push spaceship just outside planet surface
      const pushDistance = minDistance - distance;
      spaceship.position.addScaledVector(direction, pushDistance);

      // Dampen velocity toward planet
      const velocityDotDirection = velocity.dot(direction);
      if (velocityDotDirection < 0) {
        velocity.addScaledVector(direction, -velocityDotDirection * 0.5);
      }
    }
  });
}


/**
 * Check if spaceship is currently landing
 * @returns {boolean}
 */
export function isCurrentlyLanding() {
  return isLanding;
}

/**
 * Reset landing state (useful for emergency stops)
 */
export function resetLandingState() {
  isLanding = false;
}

// Export the isLanding variable for external access
export { isLanding };