// src/controllers/cockpit-controls.js
import * as THREE from "three";
import { isHUDOpen } from "./exoplanet-ui-controller.js";
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

// Joystick state
let moveJoystick = { active: false, x: 0, y: 0 };
let lookJoystick = { active: false, x: 0, y: 0 };

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

  // Request pointer lock on canvas click
  const canvas = document.querySelector('canvas');
  if (canvas) {
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('click', () => {
      if (!isHUDOpen()) {
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

  initMobileControls();

  // Device tilt for rotation
  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', (event) => {
      tiltX = event.gamma || 0; // left/right tilt
      tiltY = event.beta || 0;  // forward/back tilt
    }, true);
  }

  console.log("Unified cockpit controls initialized");
}

function onPointerLockChange() {
  // Use document.pointerLockElement to check the current state
  if (document.pointerLockElement) {
    console.log('Pointer has been locked.');
    isPointerLocked = true;
  } else {
    console.log('Pointer has been unlocked.');
    isPointerLocked = false; // This is the single source of truth!
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
  }

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
  if (!camera || !isPointerLocked) return;

  const sensitivity = 0.0015; // Slightly reduced for better control
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

/**
 * Setup right joystick (rotation control)
 */
function setupLookJoystick(baseId, handleId) {
  const base = document.getElementById(baseId);
  const handle = document.getElementById(handleId);

  if (!base || !handle) return;

  let dragging = false;

  base.addEventListener("touchstart", () => {
    dragging = true;
    lookJoystick.active = true;
  });
  base.addEventListener("touchend", () => {
    dragging = false;
    lookJoystick.active = false;
    handle.style.transform = "translate(-50%, -50%)"; // reset to center
    lookJoystick.x = 0;
    lookJoystick.y = 0;
  });

  base.addEventListener("touchmove", (e) => {
    if (!dragging) return;
    e.preventDefault();

    const touch = e.touches[0];
    const rect = base.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = (touch.clientX - centerX) / (rect.width / 2);
    const dy = (touch.clientY - centerY) / (rect.height / 2);

    // clamp
    lookJoystick.x = THREE.MathUtils.clamp(dx, -1, 1);
    lookJoystick.y = THREE.MathUtils.clamp(dy, -1, 1);

    // apply transform
    const maxOffset = rect.width / 2 - handle.offsetWidth / 2;
    handle.style.transform = `translate(${lookJoystick.x * maxOffset}px, ${lookJoystick.y * maxOffset}px)`;
  }, { passive: false });
}

/**
 * Mobile controls setup
 */
function initMobileControls() {
  const leftBase = document.getElementById('joystick-base');
  const rightBase = document.getElementById('look-base');
  const leftHandle = document.getElementById('joystick-handle');
  const rightHandle = document.getElementById('look-handle');

  if (!leftBase || !rightBase || !leftHandle || !rightHandle) return;

  // Left joystick (movement)
  leftBase.addEventListener('touchstart', e => {
    moveJoystick.active = true;
    handleTouch(e, moveJoystick, leftBase, leftHandle);
  }, { passive: false });

  leftBase.addEventListener('touchmove', e => {
    handleTouch(e, moveJoystick, leftBase, leftHandle);
  }, { passive: false });

  leftBase.addEventListener('touchend', () => {
    moveJoystick.active = false;
  }, { passive: false });

  // Right joystick (rotation)
  setupLookJoystick('look-base', 'look-handle');
}

/**
 * Joystick movement calculation
 */
function handleTouch(e, joystick, base, handle) {
  e.preventDefault();
  const touch = e.touches[0];
  const rect = base.getBoundingClientRect();

  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  let dx = touch.clientX - centerX;
  let dy = touch.clientY - centerY;

  let x = dx / (rect.width / 2);
  let y = dy / (rect.height / 2);

  joystick.x = THREE.MathUtils.clamp(x, -1, 1);
  joystick.y = THREE.MathUtils.clamp(y, -1, 1);
  updateHandlePosition(joystick, handle, rect);
}

/**
* Update handle position while keeping it centered
*/
function updateHandlePosition(joystick, handle, rect) {
  const maxOffset = rect.width / 2 - handle.offsetWidth / 2;
  handle.style.transform = `translate(calc(${joystick.x * maxOffset}px - 50%), calc(${joystick.y * maxOffset}px - 50%))`;
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

  // Enhanced WASD movement with acceleration
  const moveForce = MOVE_SPEED * delta;
  const currentSpeed = velocity.length();
  const speedMultiplier = Math.min(1.0 + currentSpeed * 0.01, 2.0); // Progressive acceleration

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
  const activeDamping = (keys["w"] || keys["a"] || keys["s"] || keys["d"] || keys[" "] || keys["shift"])
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
  updateJoystickHandles();
}

function updateJoystickHandles() {
  const leftBase = document.getElementById('joystick-base');
  const rightBase = document.getElementById('look-base');
  const leftHandle = document.getElementById('joystick-handle');
  const rightHandle = document.getElementById('look-handle');

  if (!leftBase || !rightBase || !leftHandle || !rightHandle) return;

  if (!moveJoystick.active) {
    moveJoystick.x = THREE.MathUtils.lerp(moveJoystick.x, 0, 0.2);
    moveJoystick.y = THREE.MathUtils.lerp(moveJoystick.y, 0, 0.2);
  }

  if (!lookJoystick.active) {
    lookJoystick.x = THREE.MathUtils.lerp(lookJoystick.x, 0, 0.2);
    lookJoystick.y = THREE.MathUtils.lerp(lookJoystick.y, 0, 0.2);
  }
  updateHandlePosition(moveJoystick, leftHandle, leftBase.getBoundingClientRect());
  updateHandlePosition(lookJoystick, rightHandle, rightBase.getBoundingClientRect());
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
    speed: velocity.length(),
    position: spaceship ? spaceship.position.clone() : new THREE.Vector3(),
    rotation: {
      yaw: yaw * THREE.MathUtils.RAD2DEG,
      pitch: pitch * THREE.MathUtils.RAD2DEG
    }
  };
}

export { velocity };