// src/controllers/cockpit-controls.js
import * as THREE from "three";
import { isHUDOpen } from "./exoplanet-ui-controller.js";

let controlsEnabled = true;
// Persistent velocity for smooth motion
const velocity = new THREE.Vector3();

// References set during init
let spaceship = null;
let camera = null;

// Head movement limits inside cockpit
const MAX_YAW = THREE.MathUtils.degToRad(60);
const MAX_PITCH = THREE.MathUtils.degToRad(45);
const SMOOTHING = 0.12;

// Head rotation state
let yaw = 0;
let pitch = 0;
let yawTarget = 0;
let pitchTarget = 0;

// Key state
const keys = Object.create(null);

// Enhanced movement settings
const MOVE_SPEED = 45;
const ROTATION_SPEED = 1.0;
const DAMPING = 0.90;

// Preallocated vectors (avoid GC pressure)
const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const up = new THREE.Vector3();

// Mouse lock state
let isPointerLocked = false;

// Mobile joystick data (populated by mobile-controls.js events)
let mobileMovement = { x: 0, y: 0 };
// let mobileLook = { x: 0, y: 0 };

let mobileButtons = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  rollLeft: false,
  rollRight: false
};

// Device rotation (for mobile tilting)
let tiltX = 0, tiltY = 0;

/**
 * Initializes enhanced controls with better user feedback
 * @param {THREE.Object3D} spaceshipRef - Controlled spaceship.
 * @param {THREE.Camera} cameraRef - Cockpit camera.
 */
export function initControls(spaceshipRef, cameraRef) {
  spaceship = spaceshipRef;
  camera = cameraRef;

  // Request pointer lock on canvas click (desktop only)
  const canvas = document.querySelector('canvas');
  if (canvas) {
    canvas.addEventListener('click', () => {
      if (!isHUDOpen() && !isMobileDevice()) {
        canvas.requestPointerLock();
      }
    });
  }

  // Enhanced pointer lock event listeners
  document.addEventListener('pointerlockchange', onPointerLockChange);
  document.addEventListener('mozpointerlockchange', onPointerLockChange);
  document.addEventListener('webkitpointerlockchange', onPointerLockChange);

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);

  // Disable context menu on canvas
  if (canvas) {
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  // Enhanced scroll and key handling
  document.addEventListener('wheel', (e) => {
    if (isPointerLocked) {
      e.preventDefault();
    }
  }, { passive: false });

  // Prevent default behavior for movement keys
  document.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.key)) {
      e.preventDefault();
    }
  });

  // Listen to mobile control events from mobile-controls.js
  setupMobileEventListeners();

  // Device tilt for rotation
  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', (event) => {
      tiltX = event.gamma || 0; // left/right tilt
      tiltY = event.beta || 0;  // forward/back tilt
    }, true);
  }

  console.log("Unified cockpit controls initialized");
}

/**
 * Check if device is mobile
 */
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || (window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
}
/**
 * Setup listeners for mobile control events from mobile-controls.js
 */
function setupMobileEventListeners() {
  window.addEventListener('chatFocusChange', (e) => {
    const { isChatting } = e.detail;
    controlsEnabled = !isChatting;
    console.log(`Cockpit controls enabled: ${controlsEnabled}`);

    // If controls are disabled, reset movement states to stop the ship
    if (!controlsEnabled) {
      Object.keys(keys).forEach(key => { keys[key] = false; });
      Object.keys(mobileButtons).forEach(key => { mobileButtons[key] = false; });
      mobileMovement = { x: 0, y: 0 };
    }
  });
  console.log("Setting up mobile event listeners in cockpit-controls");

  // Listen for movement joystick updates
  window.addEventListener('mobileMovement', (e) => {
    mobileMovement = e.detail;
  });

  // Listen for center view button
  window.addEventListener('centerView', () => {
    console.log("Center view event received");
    centerView();
  });
  window.addEventListener('mobileButton', (e) => {
    const { button, pressed } = e.detail;
    if (mobileButtons.hasOwnProperty(button)) {
      mobileButtons[button] = pressed;
    }
  });
  console.log("Mobile event listeners attached");
}

function onPointerLockChange() {
  // Use document.pointerLockElement to check the current state
  if (document.pointerLockElement) {
    console.log('Pointer has been locked.');
    isPointerLocked = true;
  } else {
    console.log('Pointer has been unlocked.');
    isPointerLocked = false;
  }

  // Update UI to show control status
  updateControlStatus(isPointerLocked);

  if (isPointerLocked) {
    console.log("Cockpit controls active - use WASD to navigate, mouse to look around");
  } else {
    console.log("Click canvas to enter cockpit mode, ESC to exit");
  }
}

function updateControlStatus(locked) {
  const statusElement = document.getElementById('status-display');
  if (statusElement) {
    if (locked) {
      statusElement.style.borderColor = '#00ff88';
      statusElement.style.boxShadow = '0 0 25px rgba(0, 255, 136, 0.3)';
    } else {
      statusElement.style.borderColor = '#00ffff';
      statusElement.style.boxShadow = '0 0 25px rgba(0, 255, 255, 0.3)';
    }
  }
}

function onKeyDown(event) {
  const key = event.key.toLowerCase();
  keys[key] = true;

  // Exit pointer lock with escape
  if (key.includes('esc') && isPointerLocked) {
    document.exitPointerLock();
    isPointerLocked = false;
    return;
  }
  if (!controlsEnabled) return;
  // Enhanced keyboard shortcuts
  if (isPointerLocked) {
    switch (key) {
      case 'r': // Reset orientation
        resetOrientation();
        break;
      case 'c': // Center view
        centerView();
        break;
    }
  }
}

function onKeyUp(event) {
  keys[event.key.toLowerCase()] = false;
}

function onMouseMove(event) {
  if (!camera || !isPointerLocked || !controlsEnabled) return;

  const sensitivity = 0.0015;
  const movementX = event.movementX || 0;
  const movementY = event.movementY || 0;

  yawTarget = THREE.MathUtils.clamp(
    yawTarget - movementX * sensitivity,
    -MAX_YAW,
    MAX_YAW
  );

  pitchTarget = THREE.MathUtils.clamp(
    pitchTarget - movementY * sensitivity,
    -MAX_PITCH,
    MAX_PITCH
  );
}

function resetOrientation() {
  yawTarget = 0;
  pitchTarget = 0;
  console.log("Cockpit view reset to forward");
}

function centerView() {
  yawTarget *= 0.1;
  pitchTarget *= 0.1;
  console.log("Cockpit view centered");
}

/**
 * Enhanced controls update with better physics
 * @param {number} delta - Frame delta time.
 */
export function updateControls(delta) {
  if (!spaceship || !camera) return;

  if (!controlsEnabled) {
    velocity.multiplyScalar(DAMPING);
    spaceship.position.add(velocity);
    return;
  }

  // Smooth head movement inside cockpit with enhanced responsiveness
  yaw += (yawTarget - yaw) * SMOOTHING;
  pitch += (pitchTarget - pitch) * SMOOTHING;

  // Apply head rotation to camera with smooth interpolation
  camera.rotation.order = 'YXZ';
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;

  // Get spaceship's local direction vectors
  forward.set(0, 0, -1).applyQuaternion(spaceship.quaternion).normalize();
  right.set(1, 0, 0).applyQuaternion(spaceship.quaternion).normalize();
  up.set(0, 1, 0).applyQuaternion(spaceship.quaternion).normalize();

  // Enhanced movement with acceleration
  const moveForce = MOVE_SPEED * delta;
  const currentSpeed = velocity.length();
  const speedMultiplier = Math.min(1.0 + currentSpeed * 0.01, 2.0);

  // Desktop keyboard controls
  if (keys["w"]) {
    velocity.addScaledVector(forward, moveForce * speedMultiplier);
  }
  if (keys["s"]) {
    velocity.addScaledVector(forward, -moveForce * speedMultiplier);
  }
  if (keys["a"]) {
    velocity.addScaledVector(right, -moveForce * speedMultiplier);
  }
  if (keys["d"]) {
    velocity.addScaledVector(right, moveForce * speedMultiplier);
  }

  // Mobile joystick movement controls
  if (isMobileDevice() && (mobileMovement.x !== 0 || mobileMovement.y !== 0)) {
    const mobileForce = moveForce * 1.5; // Slightly stronger for mobile
    velocity.addScaledVector(forward, mobileMovement.y * mobileForce * speedMultiplier);
    velocity.addScaledVector(right, mobileMovement.x * mobileForce * speedMultiplier);
  }

  // Enhanced vertical movement
  if (keys[" "]) { // Space for up
    velocity.addScaledVector(up, moveForce * speedMultiplier);
  }
  if (keys["shift"]) { // Shift for down
    velocity.addScaledVector(up, -moveForce * speedMultiplier);
  }

  // Smooth rotation with enhanced responsiveness
  const rotationForce = ROTATION_SPEED * delta;

  if (keys["arrowup"]) {
    spaceship.rotateX(rotationForce);
  }
  if (keys["arrowdown"]) {
    spaceship.rotateX(-rotationForce);
  }
  if (keys["arrowleft"]) {
    spaceship.rotateY(rotationForce);
  }
  if (keys["arrowright"]) {
    spaceship.rotateY(-rotationForce);
  }

  // Enhanced rotation with Q/E for roll
  if (keys["q"]) {
    spaceship.rotateZ(rotationForce);
  }
  if (keys["e"]) {
    spaceship.rotateZ(-rotationForce);
  }

  // Apply velocity with enhanced physics
  spaceship.position.add(velocity);

  // Enhanced damping based on movement state
  const isMoving = keys["w"] || keys["a"] || keys["s"] || keys["d"] ||
    keys[" "] || keys["shift"] ||
    (mobileMovement.x !== 0 || mobileMovement.y !== 0);

  const activeDamping = isMoving
    ? DAMPING * 1.02 // Less damping when actively moving
    : DAMPING * 0.98; // More damping when coasting

  velocity.multiplyScalar(activeDamping);

  // Add subtle cockpit shake when moving fast
  if (currentSpeed > 20 && camera) {
    const shakeIntensity = Math.min(currentSpeed / 100, 0.02);
    const shake = new THREE.Vector3(
      (Math.random() - 0.5) * shakeIntensity,
      (Math.random() - 0.5) * shakeIntensity,
      (Math.random() - 0.5) * shakeIntensity
    );
    camera.position.add(shake);
  }
  // For mobile devices - button controls
  if (isMobileDevice()) {
    if (mobileButtons.forward) {
      spaceship.rotateX(rotationForce);
    }
    if (mobileButtons.backward) {
      spaceship.rotateX(-rotationForce);
    }
    if (mobileButtons.left) {
      spaceship.rotateY(rotationForce);
    }
    if (mobileButtons.right) {
      spaceship.rotateY(-rotationForce);
    }
    if (mobileButtons.rollLeft) {
      spaceship.rotateZ(rotationForce);
    }
    if (mobileButtons.rollRight) {
      spaceship.rotateZ(-rotationForce);
    }
  }

}

/**
 * Get current velocity for physics calculations
 */
export function getVelocity() {
  return velocity.clone();
}

/**
 * Set spaceship velocity (for external physics)
 */
export function setVelocity(newVelocity) {
  velocity.copy(newVelocity);
}

/**
 * Get current control state info
 */
export function getControlInfo() {
  return {
    isPointerLocked,
    isMobile: isMobileDevice(),
    speed: velocity.length(),
    position: spaceship ? spaceship.position.clone() : new THREE.Vector3(),
    rotation: {
      yaw: yaw * THREE.MathUtils.RAD2DEG,
      pitch: pitch * THREE.MathUtils.RAD2DEG
    },
    mobileInput: {
      movement: mobileMovement,
    }
  };
}

export { velocity };