// src/controllers/cockpit-controls.js
import * as THREE from "three";

// Persistent velocity for smooth motion
const velocity = new THREE.Vector3();

// References
let spaceship = null;
let camera = null;

// Key state
const keys = Object.create(null);

// Movement settings
const MOVE_SPEED = 45;
const ROTATION_SPEED = 1.0;
const DAMPING = 0.90;

// Preallocated vectors
const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const up = new THREE.Vector3();

// Mouse lock
let isPointerLocked = false;

// Joystick state
let moveJoystick = { active: false, x: 0, y: 0 };
let lookJoystick = { active: false, x: 0, y: 0 };

// Device rotation (for mobile tilting)
let tiltX = 0, tiltY = 0;

/**
 * Initialize cockpit controls
 */
export function initControls(spaceshipRef, cameraRef) {
  spaceship = spaceshipRef;
  camera = cameraRef;

  const canvas = document.querySelector('canvas');
  if (canvas) {
    canvas.addEventListener('click', () => canvas.requestPointerLock());
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  document.addEventListener('pointerlockchange', onPointerLockChange);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  document.addEventListener('wheel', (e) => {
    if (isPointerLocked) e.preventDefault();
  }, { passive: false });

  document.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.key)) e.preventDefault();
  });

  // Mobile joystick initialization
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

/**
 * Pointer lock status
 */
function onPointerLockChange() {
  isPointerLocked = !!document.pointerLockElement;
  updateControlStatus(isPointerLocked);
  console.log(isPointerLocked ? "Desktop controls active: WASD + mouse" : "Click canvas to enter cockpit mode");
}

function updateControlStatus(locked) {
  const status = document.getElementById('status-display');
  if (!status) return;

  if (locked) {
    status.style.borderColor = '#00ff88';
    status.style.boxShadow = '0 0 25px rgba(0,255,136,0.3)';
  } else {
    status.style.borderColor = '#00ffff';
    status.style.boxShadow = '0 0 25px rgba(0,255,255,0.3)';
  }
}

/**
 * Keyboard handlers
 */
function onKeyDown(event) {
  const key = event.key.toLowerCase();
  keys[key] = true;

  if (key === 'escape' && isPointerLocked) document.exitPointerLock();
}

function onKeyUp(event) {
  keys[event.key.toLowerCase()] = false;
}

/**
 * Mouse movement for desktop (optional view rotation)
 */
function onMouseMove(event) {
  if (!camera || !isPointerLocked) return;
  // keep this if you want mouse look, otherwise remove
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
  }, {passive:false});

  leftBase.addEventListener('touchmove', e => { 
    handleTouch(e, moveJoystick, leftBase, leftHandle); 
  }, {passive:false});

  leftBase.addEventListener('touchend', () => { 
    moveJoystick.active = false; 
  }, {passive:false});

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

/**
 * Update all controls (desktop + mobile)
 */
export function updateControls(delta) {
  if (!spaceship) return;

  // Spaceship axes
  forward.set(0, 0, -1).applyQuaternion(spaceship.quaternion).normalize();
  right.set(1, 0, 0).applyQuaternion(spaceship.quaternion).normalize();
  up.set(0, 1, 0).applyQuaternion(spaceship.quaternion).normalize();

  const moveForce = MOVE_SPEED * delta;
  const currentSpeed = velocity.length();
  const speedMultiplier = Math.min(1 + currentSpeed * 0.01, 2.0);

  // Desktop keys (movement)
  if (keys["w"]) velocity.addScaledVector(forward, moveForce * speedMultiplier);
  if (keys["s"]) velocity.addScaledVector(forward, -moveForce * speedMultiplier);
  if (keys["a"]) velocity.addScaledVector(right, -moveForce * speedMultiplier);
  if (keys["d"]) velocity.addScaledVector(right, moveForce * speedMultiplier);
  if (keys[" "]) velocity.addScaledVector(up, moveForce * speedMultiplier);
  if (keys["shift"]) velocity.addScaledVector(up, -moveForce * speedMultiplier);

  // Left joystick (movement)
  if (moveJoystick.active) {
    velocity.addScaledVector(forward, -moveJoystick.y * moveForce * speedMultiplier);
    velocity.addScaledVector(right, moveJoystick.x * moveForce * speedMultiplier);
  }

  // Rotation keys
  const rotForce = ROTATION_SPEED * delta;
  if (keys["arrowup"]) spaceship.rotateX(rotForce);
  if (keys["arrowdown"]) spaceship.rotateX(-rotForce);
  if (keys["arrowleft"]) spaceship.rotateY(rotForce);
  if (keys["arrowright"]) spaceship.rotateY(-rotForce);
  if (keys["q"]) spaceship.rotateZ(rotForce);
  if (keys["e"]) spaceship.rotateZ(-rotForce);

  // Right joystick -> spaceship rotation (just like arrow keys)
  if (lookJoystick.active) {
    spaceship.rotateX(-lookJoystick.y * rotForce * 2); // pitch
    spaceship.rotateY(-lookJoystick.x * rotForce * 2); // yaw
  }

  // Apply velocity & damping
  spaceship.position.add(velocity);
  const activeDamping = (keys["w"]||keys["a"]||keys["s"]||keys["d"]||keys[" "]||keys["shift"]||moveJoystick.active)
    ? DAMPING * 1.02
    : DAMPING * 0.98;
  velocity.multiplyScalar(activeDamping);

  // Cockpit shake
  if (currentSpeed > 20) {
    const shake = new THREE.Vector3(
      (Math.random() - 0.5) * 0.02,
      (Math.random() - 0.5) * 0.02,
      (Math.random() - 0.5) * 0.02
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
 * Expose velocity and info
 */
export function getVelocity() { return velocity.clone(); }
export function setVelocity(newVel) { velocity.copy(newVel); }
export function getControlInfo() {
  return {
    isPointerLocked,
    speed: velocity.length(),
    position: spaceship ? spaceship.position.clone() : new THREE.Vector3()
  };
}

export { velocity };
