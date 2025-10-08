// src/controllers/exoplanet-ui-controller.js
import * as THREE from "three";
import { playUIBeepSound } from "../utilities/audio-utils.js";

let hudOpen = false;

/**
 * Handles keydown events to close the HUD with the Tab key.
 * @param {KeyboardEvent} event
 */
function handleKeyDownForHUD(event) {
	// Check if the pressed key is 'Tab' and if the HUD is currently open
	if (event.key === 'Tab' && isHUDOpen()) {
		event.preventDefault(); // Prevents the default Tab action (like focus switching)

		closeActiveHUD();
	}
}

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
	settingsToggle.addEventListener("click", (event) => {
		event.stopPropagation();
		toggleSettings();
	});
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
	document.addEventListener('keydown', handleKeyDownForHUD);
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
	const exoplanetView = document.getElementById("exoplanet-view");

	// Create HTML overlay
	const hudOverlay = document.createElement('div');
	hudOverlay.className = 'planet-hud-overlay';
	hudOverlay.innerHTML = `
		<div class="planet-hud-container">
			<button class="planet-hud-close" aria-label="Close">✕</button>
			
			<div class="planet-hud-header">
				<h2 class="planet-hud-title">${planet.userData.name || 'Unknown Planet'}</h2>
			</div>

			<div class="planet-hud-content">
				<div class="planet-hud-column planet-hud-main">
					<div class="planet-hud-data-row">
						<span class="planet-hud-label">Type:</span>
						<span class="planet-hud-value">${planet.userData.type || 'N/A'}</span>
					</div>
					<div class="planet-hud-data-row">
						<span class="planet-hud-label">Mass:</span>
						<span class="planet-hud-value">${planet.userData.mass || 'N/A'}</span>
					</div>
					<div class="planet-hud-data-row">
						<span class="planet-hud-label">Radius:</span>
						<span class="planet-hud-value">${planet.userData.radius || 'N/A'}</span>
					</div>
					<div class="planet-hud-data-row">
						<span class="planet-hud-label">Temperature:</span>
						<span class="planet-hud-value">${planet.userData.temperature || 'N/A'}</span>
					</div>
					<div class="planet-hud-data-row">
						<span class="planet-hud-label">Distance:</span>
						<span class="planet-hud-value">${planet.userData.distance || 'N/A'}</span>
					</div>
					<div class="planet-hud-data-row">
						<span class="planet-hud-label">Habitable:</span>
						<span class="planet-hud-value">${planet.userData.habitable ? 'Yes' : 'No'}</span>
					</div>
					<div class="planet-hud-data-row">
						<span class="planet-hud-label">Discovery Year:</span>
						<span class="planet-hud-value">${planet.userData.discoveryYear || 'N/A'}</span>
					</div>
				</div>

				<div class="planet-hud-column planet-hud-stats">
					<h3 class="planet-hud-stats-title">Stats Overview</h3>
					${createStatBar('Mass', parseFloat(planet.userData.mass) || 0)}
					${createStatBar('Radius', parseFloat(planet.userData.radius) || 0)}
					${createStatBar('Temp', parseFloat(planet.userData.temperature) || 0)}
					${createStatBar('Dist', parseFloat(planet.userData.distance) || 0)}
				</div>
			</div>

			${planet.userData.habitable ? '<div class="planet-hud-habitable">HABITABLE ZONE</div>' : ''}
			
			<div class="planet-hud-footer">Press TAB to close</div>
		</div>
	`;

	exoplanetView.appendChild(hudOverlay);

	// Add close button event
	const closeBtn = hudOverlay.querySelector('.planet-hud-close');
	closeBtn.addEventListener('click', (e) => {
		e.stopPropagation();
		closeActiveHUD();
	});

	// Fade in animation
	requestAnimationFrame(() => {
		hudOverlay.classList.add('planet-hud-visible');
	});

	// Store reference
	hudOverlay.userData = { planetRef: planet };

	return {
		domElement: hudOverlay,
		visible: true
	};
}

/**
 * Helper function to create stat bars
 */
function createStatBar(label, value) {
	const percentage = Math.min((value / 20) * 100, 100);
	return `
		<div class="planet-hud-stat-item">
			<div class="planet-hud-stat-header">
				<span class="planet-hud-stat-label">${label}</span>
				<span class="planet-hud-stat-value">${value.toFixed(2)}</span>
			</div>
			<div class="planet-hud-stat-bar-container">
				<div class="planet-hud-stat-bar" style="width: ${percentage}%"></div>
			</div>
		</div>
	`;
}

/**
 * Shows the HUD info for a planet
 * @param {THREE.Mesh} planet
 */
export function show3DPlanetInfo(planet) {
	// Import camera dynamically to avoid circular dependency
	import('../exoplanet-main.js').then(({ camera, planets }) => {
		// Hide any existing HUD first
		planets.forEach(p => {
			if (p.userData.infoHUD && p !== planet) {
				hide3DPlanetInfo(p, camera);
			}
		});

		if (planet.userData.infoHUD?.domElement) {
			hudOpen = true;
			planet.userData.infoHUD.domElement.classList.add('planet-hud-visible');
			planet.userData.infoHUD.visible = true;
			updateTargetDisplay(planet.userData.name);
			return;
		}
		if (planet.userData.infoHUD?.domElement && !document.body.contains(planet.userData.infoHUD.domElement)) {
			planet.userData.infoHUD = null;
		}
		const hud = createInfoHUD(planet);
		planet.userData.infoHUD = hud;
		hud.domElement.userData = { planetRef: planet };
		hudOpen = true;

		playUIBeepSound();
		updateTargetDisplay(planet.userData.name);
	});
}

function closeActiveHUD() {
	const hudOverlay = document.querySelector('.planet-hud-overlay.planet-hud-visible');
	if (!hudOverlay) return;

	hudOpen = false;  // Set this immediately
	playUIBeepSound();
	hudOverlay.classList.remove('planet-hud-visible');
	hudOverlay.classList.add('planet-hud-closing');

	// After the closing animation, remove the HUD element from the page.
	setTimeout(() => {
		const planet = hudOverlay.userData?.planetRef;
		if (planet && planet.userData.infoHUD) {
			planet.userData.infoHUD = null;
		}
		hudOverlay.remove();
		updateTargetDisplay('None');
	}, 300);
}

/**
 * Hides the HUD info
 * @param {THREE.Mesh} planet
 * @param {THREE.Camera} camera
 */
export function hide3DPlanetInfo(planet, camera) {
	if (planet.userData.infoHUD?.domElement) {
		hudOpen = false;
		const hudElement = planet.userData.infoHUD.domElement;
		hudElement.remove();
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