// src/exoplanet-main.js
import * as THREE from "three";

import { initExoplanetScene, animate, spaceScene, cockpitScene, camera, setCameraControlEnabled, renderer } from "./controllers/exoplanet-scene-controller.js";
import { createPlanets, enablePlanetInteractions, animatePlanets, initAudio } from "./controllers/exoplanet-factory.js";
import { loadCockpit } from "./controllers/cockpit-input-controller.js";
import { initControls, updateControls, velocity } from "./controllers/cockpit-controls.js";
import { createUI, updateStatusDisplays, showAudioIndicator } from "./controllers/exoplanet-ui-controller.js";
import { loadDefaultData, applyNewData } from "./data management/planet-data-provider.js";
import { initializeExplorer } from "./initialization.js";
import { resolveCollisions } from "./utilities/spaceship-physics-utils.js";

import { getPlanetTutor } from "./controllers/planet-tutor-controller.js";

console.log("Planet Tutor module loaded");

const clock = new THREE.Clock();

let spaceship = null;
let cockpitModel = null;
let planets = [];
let isSceneReady = false;

async function startScene() {
	console.log("Starting enhanced exoplanet exploration...");

	// Initialize systems
	initializeExplorer();
	setCameraControlEnabled(false);
	await initExoplanetScene();

	// Attach renderer to DOM
	const exoplanetView = document.getElementById('exoplanet-view');
	if (exoplanetView && renderer.domElement) {
		exoplanetView.appendChild(renderer.domElement);
		console.log("Renderer attached successfully");
	} else {
		console.error("Could not find exoplanet-view container");
		return;
	}

	// Initialize audio system
	try {
		initAudio();
		console.log("Audio system initialized");
	} catch (error) {
		console.warn("Audio initialization failed:", error);
	}

	// Create planets
	console.log("Creating planets...");
	try {
		const planetData = loadDefaultData();
		planets = createPlanets(spaceScene, planetData);
		planets.forEach(planet => {
			planet.renderOrder = 10;
		});
		console.log(`Created ${planets.length} planets`);
	} catch (error) {
		console.error("Failed to create planets:", error);
		return;
	}

	// Setup spaceship and cockpit
	console.log("Setting up spaceship and cockpit...");
	spaceship = new THREE.Group();

	try {
		cockpitModel = await loadCockpit(cockpitScene);
		if (cockpitModel) {
			spaceship.add(cockpitModel);
			console.log("Cockpit model loaded successfully");
			// Move cockpit model slightly back so camera is properly inside
			cockpitModel.position.set(0, 0, -1);

			cockpitModel.traverse((child) => {
				if (child.isMesh && child.material) {
					// Clone material to avoid affecting other objects
					child.material = child.material.clone();

					child.material.depthWrite = true;
					child.material.depthTest = true;
					child.material.colorWrite = true;
					child.renderOrder = -10; // Render much earlier

					// Check if this is a solid part (not glass/window)
					const name = (child.name || '').toLowerCase();
					const isGlass = name.includes('glass') || name.includes('window') || name.includes('windshield');

					if (!isGlass) {
						child.material.side = THREE.DoubleSide; // Try double-sided
						child.material.transparent = false;
						child.material.opacity = 1.0;
					}
				}
			});
		} else {
			// Enhanced placeholder cockpit
			const cockpitGeometry = new THREE.BoxGeometry(3, 1.5, 4);
			const cockpitMaterial = new THREE.MeshStandardMaterial({
				color: 0x333333,
				metalness: 0.8,
				roughness: 0.2,
				emissive: 0x001122,
				emissiveIntensity: 0.1
			});

			const placeholder = new THREE.Mesh(cockpitGeometry, cockpitMaterial);

			// Add some detail to placeholder
			const detailGeometry = new THREE.BoxGeometry(0.5, 0.1, 0.5);
			const detailMaterial = new THREE.MeshStandardMaterial({
				color: 0x00ffff,
				emissive: 0x001144,
				emissiveIntensity: 0.3
			});

			for (let i = 0; i < 3; i++) {
				const detail = new THREE.Mesh(detailGeometry, detailMaterial);
				detail.position.set(-1 + i, 0.3, 1);
				placeholder.add(detail);
			}

			spaceship.add(placeholder);
			console.log("Enhanced placeholder cockpit created");
		}
	} catch (error) {
		console.error("Error loading cockpit:", error);
	}

	cockpitScene.add(spaceship);
	spaceship.position.set(0, 0, 0);

	// Setup camera in cockpit
	camera.position.set(0, 0.5, 2);
	spaceship.add(camera);

	// Initialize controls and interactions
	try {
		initControls(spaceship, camera);
		const planetTutor = getPlanetTutor(); // Get tutor instance here when DOM is ready
		console.log("Planet Tutor instance obtained:", planetTutor);
		console.log("Tutor type:", typeof planetTutor);
		console.log(
			"Tutor has show method?",
			planetTutor && typeof planetTutor.show === "function"
		);
		console.log(
			"Tutor has isShowing method?",
			planetTutor && typeof planetTutor.isShowing === "function"
		);
		enablePlanetInteractions(planets, camera, spaceship, planetTutor);
		console.log("Enhanced controls and interactions initialized");
	} catch (error) {
		console.error("Error initializing controls:", error);
	}

	// Create UI system
	try {
		createUI(
			handleModeToggle,
			handleDataUpload
		);
		console.log("Enhanced UI system created");
	} catch (error) {
		console.error("Error creating UI:", error);
	}

	// Setup global event listeners
	setupGlobalEvents();

	isSceneReady = true;
	console.log(`Enhanced exoplanet exploration ready with ${planets.length} planets!`);
	console.log("Click canvas to enter cockpit mode and begin your journey!");

	// Start the main loop
	startMainLoop();
}

function handleModeToggle() {
	console.log("Mode toggle requested - reloading...");
	window.location.reload();
}

function handleDataUpload(newData) {
	console.log("Applying new planet data...");
	try {
		applyNewData(planets, newData);
		showAudioIndicator();
		console.log("Planet data updated successfully");
	} catch (error) {
		console.error("Error applying new data:", error);
	}
}

function setupGlobalEvents() {
	// Keyboard shortcuts
	document.addEventListener('keydown', (event) => {
		if (!isSceneReady) return;

		switch (event.key.toLowerCase()) {
			case 'h':
				toggleHelpDisplay();
				break;
			case 'tab':
				// Hide HUD when ESC is pressed
				planets.forEach(planet => {
					if (planet.userData.infoHUD) {
						const hud = planet.userData.infoHUD;
						camera.remove(hud);
						planet.userData.infoHUD = null;
					}
				});
				break;
		}
	});

	// Window resize
	window.addEventListener('resize', handleWindowResize);

	// Handle visibility change
	document.addEventListener('visibilitychange', () => {
		if (document.hidden) {
			if (document.pointerLockElement) {
				document.exitPointerLock();
			}
		}
	});
}

function toggleHelpDisplay() {
	const controlsOverlay = document.getElementById('controls-overlay');
	if (controlsOverlay) {
		controlsOverlay.classList.toggle('fade-out');
	}
}

function handleWindowResize() {
	if (camera && renderer) {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	}
}

function startMainLoop() {
	function loop() {
		if (!isSceneReady) {
			requestAnimationFrame(loop);
			return;
		}

		const delta = clock.getDelta();

		// Update scene components
		animate();
		updateControls(delta);
		resolveCollisions(spaceship, planets, velocity);

		// Animate planets
		animatePlanets(planets, delta);

		// Update UI displays
		if (spaceship) {
			const speed = velocity.length();
			updateStatusDisplays(spaceship.position, speed, planets.length);
		}

		// Manual rendering with depth pre-pass
		renderer.autoClear = false;
		renderer.clear();

		// 1) Cockpit depth pre-pass
		const originalOverride = cockpitScene.overrideMaterial;
		cockpitScene.overrideMaterial = new THREE.MeshDepthMaterial({
			depthPacking: THREE.RGBADepthPacking
		});
		renderer.render(cockpitScene, camera);
		cockpitScene.overrideMaterial = originalOverride;

		// 2) Render space (planets occluded by cockpit depth)
		renderer.render(spaceScene, camera);

		// 3) Render cockpit visuals
		renderer.render(cockpitScene, camera);


		requestAnimationFrame(loop);
	}

	loop();
}

function cleanup() {
	console.log("Cleaning up exoplanet explorer...");

	window.removeEventListener('resize', handleWindowResize);

	if (renderer) {
		renderer.dispose();
	}

	planets.forEach(planet => {
		if (planet.geometry) planet.geometry.dispose();
		if (planet.material) planet.material.dispose();
	});
}

window.addEventListener('beforeunload', cleanup);

startScene();

export { spaceScene, cockpitScene, camera, spaceship, planets, isSceneReady };