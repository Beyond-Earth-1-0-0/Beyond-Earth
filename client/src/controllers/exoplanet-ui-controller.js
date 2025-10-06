// src/controllers/exoplanet-ui-controller.js
import * as THREE from "three";
import { playUIBeepSound } from "../utilities/audio-utils.js";

let hudOpen = false;

/**
 * Builds the UI overlay
 */
export function createUI() {
	const exoplanetView = document.getElementById("exoplanet-view");
	if (!exoplanetView) {
		console.error("Missing #exoplanet-view container in DOM.");
		return;
	}

	// Enhanced crosshair
	const crosshair = document.createElement("div");
	crosshair.className = "crosshair";
	exoplanetView.appendChild(crosshair);

	// Status display
	const statusDisplay = document.createElement("div");
	statusDisplay.id = "status-display";
	statusDisplay.innerHTML = `
    <div class="status-header">COCKPIT SYSTEMS</div>
    <div class="status-line">Position: <span id="pos-display">0, 0, 0</span></div>
    <div class="status-line">Speed: <span id="speed-display">0</span></div>
    <div class="status-line">Target: <span id="target-display">None</span></div>
    <div class="status-line">Planets: <span id="planet-count">10</span> discovered</div>
  `;
	exoplanetView.appendChild(statusDisplay);

	// Controls overlay
	const controlsOverlay = document.createElement("div");
	controlsOverlay.id = "controls-overlay";
	controlsOverlay.innerHTML = `
    <div class="controls-header">EXPLORER CONTROLS</div>
    <div class="control-group">
      <div class="control-category">Navigation</div>
      <div class="control-item"><kbd>WASD</kbd> Move</div>
      <div class="control-item"><kbd>Mouse</kbd> Look</div>
      <div class="control-item"><kbd>Space/Shift</kbd> Up/Down</div>
    </div>
    <div class="control-group">
      <div class="control-category">Exploration</div>
      <div class="control-item"><kbd>Click</kbd> Travel to Planet</div>
      <div class="control-item"><kbd>I</kbd> Scan Planet</div>
      <div class="control-item"><kbd>T</kbd> Target Nearest</div>
    </div>
    <div class="control-group">
      <div class="control-category">System</div>
      <div class="control-item"><kbd>ESC</kbd> Exit Cockpit</div>
      <div class="control-item"><kbd>Click Canvas</kbd> Enter</div>
    </div>
  `;
	exoplanetView.appendChild(controlsOverlay);

	// Audio indicator
	const audioIndicator = document.createElement("div");
	audioIndicator.id = "audio-indicator";
	audioIndicator.innerHTML = "AUDIO ACTIVE";
	exoplanetView.appendChild(audioIndicator);

	// burger-menu toggle for settings
	const settingsToggle = document.createElement("button");
	settingsToggle.id = "settings-toggle";
	settingsToggle.innerHTML = `<img src="../assets/burger-menu-icon.png" alt="settings" style="width: 24px; height: 24px;">`;
	settingsToggle.addEventListener("click", toggleSettings);
	exoplanetView.appendChild(settingsToggle);

	// Settings panel
	const settingsPanel = document.createElement("div");
	settingsPanel.id = "settings-panel";
	settingsPanel.className = "settings-panel hidden";
	settingsPanel.innerHTML = `
    <div class="settings-header">SYSTEM SETTINGS</div>
    <button class="setting-btn" onclick="this.closest('#settings-panel').classList.add('hidden')">Close</button>
    <button class="setting-btn" id="mode-toggle">Toggle Scientist Mode</button>
    <button class="setting-btn" id="upload-data">Upload Exoplanet Data</button>
  `;
	exoplanetView.appendChild(settingsPanel);

	// Event listeners
	document.getElementById("mode-toggle").addEventListener("click", () => openDataViewer());
	document.getElementById("upload-data").addEventListener("click", () => openFilePicker());

	// Auto-hide controls after 20 seconds
	setTimeout(() => {
		controlsOverlay.classList.add("fade-out");
	}, 20000);

	console.log("Enhanced UI system initialized");
}

/**
 * Creates HUD info panel using canvas texture
 * @param {THREE.Mesh} planet
 * @param {THREE.Camera} camera
 * @returns {THREE.Group} The HUD group
 */
export function createInfoHUD(planet) {
	const hudGroup = new THREE.Group();
	hudGroup.position.set(0, 0, -5);
	hudGroup.scale.set(0, 0, 0);

	const width = 5; // Widened plane for more space
	const height = 3;
	const geometry = new THREE.PlaneGeometry(width, height);

	// Create canvas
	const canvas = document.createElement('canvas');
	canvas.width = 1280; // Wider canvas resolution
	canvas.height = 768;
	const ctx = canvas.getContext('2d');

	// Background
	const gradient = ctx.createLinearGradient(0, 0, 0, 768);
	gradient.addColorStop(0, 'rgba(0, 20, 40, 0.8)');
	gradient.addColorStop(1, 'rgba(0, 40, 80, 0.8)');
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, 1280, 768);

	ctx.strokeStyle = '#00ffff';
	ctx.lineWidth = 8;
	ctx.shadowColor = '#00ffff';
	ctx.shadowBlur = 20;
	ctx.strokeRect(20, 20, 1240, 728);

	// Title
	ctx.fillStyle = '#00ff88';
	ctx.shadowBlur = 10;
	ctx.font = 'bold 60px Orbitron';
	ctx.textAlign = "left";
	ctx.fillText(planet.userData.name || 'Unknown Planet', 50, 100);

	// --- Column 1: Main Data Table ---
	const tableData = [
		['Type', planet.userData.type || 'N/A'],
		['Mass', planet.userData.mass || 'N/A'],
		['Radius', planet.userData.radius || 'N/A'],
		['Temperature', planet.userData.temperature || 'N/A'],
		['Distance', planet.userData.distance || 'N/A'],
		['Habitable', planet.userData.habitable ? 'Yes' : 'No'],
		['Discovery Year', planet.userData.discoveryYear || 'N/A']
	];

	let y = 180;
	ctx.font = '32px Orbitron'; // Slightly smaller font for better fit
	ctx.shadowBlur = 5;

	tableData.forEach(([key, value]) => {
		ctx.fillStyle = '#00ffff';
		ctx.textAlign = "left";
		ctx.fillText(`${key}:`, 50, y);

		ctx.fillStyle = '#ffaa00';
		ctx.textAlign = "right";
		ctx.fillText(String(value), 550, y); // Align values to a right margin

		y += 50; // Reduced line spacing
	});

	// --- Column 2: Stats Overview Bar Graph ---
	const graphData = {
		Mass: parseFloat(planet.userData.mass) || 0,
		Radius: parseFloat(planet.userData.radius) || 0,
		Temp: parseFloat(planet.userData.temperature) || 0,
		Dist: parseFloat(planet.userData.distance) || 0
	};

	let graphY = 180;
	const graphX = 650;

	ctx.font = 'bold 40px Orbitron';
	ctx.fillStyle = '#00ffff';
	ctx.shadowBlur = 10;
	ctx.textAlign = "left";
	ctx.fillText('Stats Overview', graphX, 120);

	ctx.font = 'bold 32px Orbitron'; // Increased font size
	ctx.shadowBlur = 5;

	Object.entries(graphData).forEach(([label, value]) => {
		// Label
		ctx.fillStyle = '#00ffff';
		ctx.shadowColor = '#00ffff';
		ctx.textAlign = "left";
		ctx.fillText(label, graphX, graphY);

		const barWidth = 450;
		const normalizedValue = Math.min(value / 20, 1) * barWidth;

		// Bar background
		ctx.fillStyle = 'rgba(0, 40, 80, 0.5)';
		ctx.fillRect(graphX, graphY + 10, barWidth, 30);

		// Bar gradient
		const barGradient = ctx.createLinearGradient(graphX, 0, graphX + barWidth, 0);
		barGradient.addColorStop(0, '#00ffff');
		barGradient.addColorStop(1, '#0080ff');
		ctx.fillStyle = barGradient;
		ctx.shadowColor = '#00ffff';
		ctx.shadowBlur = 15;
		ctx.fillRect(graphX, graphY + 10, normalizedValue, 30);

		// Value text with strong contrast and outline
		ctx.shadowBlur = 0; // Disable shadow for outline effect
		ctx.strokeStyle = '#000000';
		ctx.lineWidth = 6;
		ctx.font = 'bold 28px Orbitron';
		ctx.textAlign = "left";
		ctx.strokeText(value.toFixed(2), graphX + 10, graphY + 33);

		ctx.fillStyle = '#ffffff';
		ctx.fillText(value.toFixed(2), graphX + 10, graphY + 33);

		graphY += 90; // More spacing
	});

	// Habitable indicator
	if (planet.userData.habitable) {
		ctx.fillStyle = '#00ff00';
		ctx.shadowColor = '#00ff00';
		ctx.shadowBlur = 30;
		ctx.font = 'bold 50px Orbitron';
		ctx.textAlign = "left";
		ctx.fillText('HABITABLE ZONE', 50, 680);
	}

	// Footer instruction
	ctx.fillStyle = '#ffffff';
	ctx.shadowBlur = 5;
	ctx.font = 'bold 28px Orbitron';
	ctx.textAlign = "center";
	ctx.fillText("Press TAB to close", canvas.width / 2, canvas.height - 40);

	// Create texture and material
	const texture = new THREE.CanvasTexture(canvas);
	texture.needsUpdate = true;
	const material = new THREE.MeshBasicMaterial({
		map: texture,
		transparent: true,
		side: THREE.DoubleSide,
		depthTest: false
	});

	const mesh = new THREE.Mesh(geometry, material);
	hudGroup.add(mesh);

	const collider = new THREE.Mesh(
		new THREE.PlaneGeometry(width, height),
		new THREE.MeshBasicMaterial({ visible: false })
	);
	collider.userData.isHUDCollider = true;
	hudGroup.add(collider);
	hudGroup.userData.collider = collider;
	// Draw close button
	const closeSize = 60;
	const closeX = canvas.width - closeSize - 40;
	const closeY = 40;

	ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
	ctx.shadowColor = '#ff0000';
	ctx.shadowBlur = 15;
	ctx.fillRect(closeX, closeY, closeSize, closeSize);

	ctx.fillStyle = '#ffffff';
	ctx.font = 'bold 48px Orbitron';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText('✕', closeX + closeSize / 2, closeY + closeSize / 2);
	// Store button bounds for click detection
	hudGroup.userData.closeBounds = {
		x: closeX,
		y: closeY,
		width: closeSize,
		height: closeSize,
		canvasWidth: canvas.width,
		canvasHeight: canvas.height
	};

	return hudGroup;
}

/**
 * Shows the HUD info for a planet
 * @param {THREE.Mesh} planet
 */
export function show3DPlanetInfo(planet) {
	// Import camera dynamically to avoid circular dependency
	import('../exoplanet-main.js').then(({ camera, planets }) => {
		hudOpen = true;
		// Hide any existing HUD first
		planets.forEach(p => {
			if (p.userData.infoHUD && p !== planet) {
				hide3DPlanetInfo(p, camera);
			}
		});

		if (planet.userData.infoHUD) {
			planet.userData.infoHUD.visible = true;
			updateTargetDisplay(planet.userData.name);
			return;
		}

		const hud = createInfoHUD(planet, camera);
		camera.add(hud);
		planet.userData.infoHUD = hud;
		hud.userData.planetRef = planet;

		const handleHUDMouseDown = (event) => {
			const clickedClose = onHUDClick(event, hud, camera);
			if (clickedClose) {
				event.stopPropagation();
				event.preventDefault();
				window.removeEventListener('mousedown', handleHUDMouseDown);
			}
		};

		window.addEventListener('mousedown', handleHUDMouseDown);

		// Fade-in animation
		let scale = 0;
		const animateFadeIn = () => {
			if (scale < 1) {
				scale += 0.05;
				hud.scale.set(scale, scale, scale);
				requestAnimationFrame(animateFadeIn);
			}
		};
		animateFadeIn();

		playUIBeepSound();
		updateTargetDisplay(planet.userData.name);
	});
}

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onHUDClick(event, hudGroup, camera) {
	if (!hudGroup.visible || !hudGroup.userData.collider) return false;

	mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

	raycaster.setFromCamera(mouse, camera);

	const intersects = raycaster.intersectObject(hudGroup.userData.collider);
	if (intersects.length === 0) return false;

	const uv = intersects[0].uv;
	const bounds = hudGroup.userData.closeBounds;

	const x = uv.x * bounds.canvasWidth;
	const y = (1 - uv.y) * bounds.canvasHeight;

	const inside =
		x > bounds.x &&
		x < bounds.x + bounds.width &&
		y > bounds.y &&
		y < bounds.y + bounds.height;

	if (inside) {
		playUIBeepSound();

		let scale = hudGroup.scale.x;
		const fadeOut = () => {
			if (scale > 0) {
				scale -= 0.05;
				hudGroup.scale.set(scale, scale, scale);
				requestAnimationFrame(fadeOut);
			} else {
				const planet = hudGroup.userData.planetRef;
				if (planet) {
					hide3DPlanetInfo(planet, camera);
				}
			}
		};
		fadeOut();

		return true;
	}

	return false;
}
export { onHUDClick };

/**
 * Hides the HUD info
 * @param {THREE.Mesh} planet
 * @param {THREE.Camera} camera
 */
export function hide3DPlanetInfo(planet, camera) {
	if (planet.userData.infoHUD) {
		hudOpen = false;
		camera.remove(planet.userData.infoHUD);
		planet.userData.infoHUD.traverse(child => {
			if (child.geometry) child.geometry.dispose();
			if (child.material) {
				if (child.material.map) child.material.map.dispose();
				child.material.dispose();
			}
		});
		planet.userData.infoHUD = null;
		updateTargetDisplay('None');
	}
}

/**
 * Update target display
 */
function updateTargetDisplay(targetName) {
	const targetDisplay = document.getElementById('target-display');
	if (targetDisplay) {
		targetDisplay.textContent = targetName;
	}
}

/**
 * Toggle settings panel
 */
function toggleSettings() {
	const panel = document.getElementById("settings-panel");
	panel.classList.toggle("hidden");
}

/**
 * Update status displays
 */
export function updateStatusDisplays(position, speed, planetCount) {
	const posDisplay = document.getElementById('pos-display');
	const speedDisplay = document.getElementById('speed-display');
	const planetCountDisplay = document.getElementById('planet-count');

	if (posDisplay) {
		posDisplay.textContent = `${position.x.toFixed(0)}, ${position.y.toFixed(0)}, ${position.z.toFixed(0)}`;
	}
	if (speedDisplay) {
		speedDisplay.textContent = speed.toFixed(1);
	}
	if (planetCountDisplay) {
		planetCountDisplay.textContent = planetCount;
	}
}

/**
 * Show audio activity indicator
 */
export function showAudioIndicator() {
	const indicator = document.getElementById('audio-indicator');
	if (indicator) {
		indicator.classList.add('active');
		setTimeout(() => {
			indicator.classList.remove('active');
		}, 2000);
	}
}

/**
 * Opens a file picker for JSON data upload
 */
function openFilePicker() {
	window.location.href = "../pages/auth-OTP.html";
}
function openDataViewer() {
	window.location.href = "../pages/data-viewer.html";
}
export function isHUDOpen() {
	return hudOpen;
}