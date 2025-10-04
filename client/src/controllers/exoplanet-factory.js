// src/controllers/exoplanet-factory.js
import * as THREE from "three";
import { landOnPlanet } from "../utilities/spaceship-physics-utils.js";
import { show3DPlanetInfo } from "./exoplanet-ui-controller.js";
import { loadDefaultData } from "../data management/planet-data-provider.js";
import { createRealisticPlanetTexture } from "./texture-generator.js"
// Config
const MIN_PLANET_RADIUS = 2;
const MAX_PLANET_RADIUS = 12;

export const planets = []; // global planets array

// Planet types with enhanced visual characteristics
const PLANET_TYPES = [
  {
    name: "Rocky",
    color: { h: 30, s: 60, l: 40 },
    roughness: 0.8,
    metalness: 0.2,
    emissive: 0x000000
  },
  {
    name: "Gas Giant",
    color: { h: 220, s: 70, l: 50 },
    roughness: 0.3,
    metalness: 0.1,
    emissive: 0x001122
  },
  {
    name: "Ice",
    color: { h: 200, s: 80, l: 70 },
    roughness: 0.1,
    metalness: 0.9,
    emissive: 0x001133
  },
  {
    name: "Volcanic",
    color: { h: 15, s: 90, l: 30 },
    roughness: 0.9,
    metalness: 0.1,
    emissive: 0x331100
  },
  {
    name: "Ocean",
    color: { h: 240, s: 80, l: 60 },
    roughness: 0.0,
    metalness: 0.8,
    emissive: 0x000033
  },
  {
    name: "Earth-like",
    color: { h: 120, s: 70, l: 45 },
    roughness: 0.6,
    metalness: 0.3,
    emissive: 0x000022
  }
];

// Audio context for futuristic sounds
let audioContext = null;
let gainNode = null;

function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  }
}

function playFuturisticScanSound() {
  if (!audioContext) initAudio();

  const oscillator1 = audioContext.createOscillator();
  const oscillator2 = audioContext.createOscillator();
  const envelope = audioContext.createGain();

  oscillator1.connect(envelope);
  oscillator2.connect(envelope);
  envelope.connect(gainNode);

  oscillator1.type = 'sine';
  oscillator2.type = 'sawtooth';
  oscillator1.frequency.setValueAtTime(800, audioContext.currentTime);
  oscillator2.frequency.setValueAtTime(400, audioContext.currentTime);

  oscillator1.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.3);
  oscillator2.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.3);

  envelope.gain.setValueAtTime(0, audioContext.currentTime);
  envelope.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.1);
  envelope.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);

  oscillator1.start(audioContext.currentTime);
  oscillator2.start(audioContext.currentTime);
  oscillator1.stop(audioContext.currentTime + 0.8);
  oscillator2.stop(audioContext.currentTime + 0.8);
}

function playTargetSound() {
  if (!audioContext) initAudio();

  const oscillator = audioContext.createOscillator();
  const envelope = audioContext.createGain();

  oscillator.connect(envelope);
  envelope.connect(gainNode);

  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.1);

  envelope.gain.setValueAtTime(0, audioContext.currentTime);
  envelope.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.05);
  envelope.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.2);
}

function getPlanetTypeConfig(typeName) {
  const typeMap = {
    "Super Earth": PLANET_TYPES[0],
    "Earth-like": PLANET_TYPES[5],
    "Terrestrial": PLANET_TYPES[0],
    "Rocky Super Earth": PLANET_TYPES[0],
    "Sub-Neptune": PLANET_TYPES[1],
    "Gas Giant": PLANET_TYPES[1],
    "Ice": PLANET_TYPES[2],
    "Volcanic": PLANET_TYPES[3],
    "Ocean": PLANET_TYPES[4]
  };

  return typeMap[typeName] || PLANET_TYPES[0];
}

function createPlanets(scene, planetData = null) {
  console.log("Creating planets...");

  planets.length = 0; // reset global array

  const data = planetData || loadDefaultData();
  const planetsData = data.planets;

  if (!planetsData || !Array.isArray(planetsData)) {
    console.error("No valid planet data found");
    return [];
  }

  planetsData.forEach((planetInfo, i) => {
    const { x, y, z } = planetInfo.position;
    const planetType = getPlanetTypeConfig(planetInfo.type);

    let radius = MIN_PLANET_RADIUS;
    if (planetInfo.radius) {
      const radiusMatch = planetInfo.radius.match(/([\d.,]+)/);
      if (radiusMatch) {
        const radiusValue = parseFloat(radiusMatch[0].replace(/,/g, ''));
        if (planetInfo.radius.includes('Earth')) {
          radius = Math.max(MIN_PLANET_RADIUS, Math.min(MAX_PLANET_RADIUS, radiusValue * 3));
        } else if (planetInfo.radius.includes('Jupiter')) {
          radius = Math.max(MIN_PLANET_RADIUS, Math.min(MAX_PLANET_RADIUS, radiusValue * 8));
        }
      }
    }

    // Create enhanced geometry
    const geometry = new THREE.IcosahedronGeometry(radius, 2);

    // // Add surface variation
    // const positions = geometry.attributes.position.array;
    // for (let j = 0; j < positions.length; j += 3) {
    //   const vertex = new THREE.Vector3(positions[j], positions[j + 1], positions[j + 2]);
    //   const noise = (Math.random() - 0.5) * 0.3;
    //   vertex.normalize().multiplyScalar(radius + noise);
    //   positions[j] = vertex.x;
    //   positions[j + 1] = vertex.y;
    //   positions[j + 2] = vertex.z;
    // }
    // geometry.attributes.position.needsUpdate = true;
    // geometry.computeVertexNormals();

    const texture = createRealisticPlanetTexture(planetInfo.type, radius, Math.random());

    // Enhanced material with texture
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: planetType.roughness + (Math.random() - 0.5) * 0.2,
      metalness: planetType.metalness + (Math.random() - 0.5) * 0.2,
      emissive: planetType.emissive,
      emissiveIntensity: Math.random() * 0.15,
      depthTest: true,
      depthWrite: true
    });

    const planet = new THREE.Mesh(geometry, material);

    // Store comprehensive planet data
    planet.userData = {
      id: i,
      name: planetInfo.name,
      type: planetInfo.type,
      mass: planetInfo.mass,
      radius: planetInfo.radius,
      temperature: planetInfo.temperature,
      atmosphere: planetInfo.atmosphere,
      surface: planetInfo.surface,
      orbitalPeriod: planetInfo.orbitalPeriod,
      distance: planetInfo.distance,
      hostStar: planetInfo.hostStar,
      discovery: planetInfo.discovery,
      habitability: planetInfo.habitability,
      habitable: planetInfo.habitability && planetInfo.habitability.includes('habitable'),
      discoveryYear: planetInfo.discovery ? planetInfo.discovery.match(/\d{4}/)?.[0] : 'N/A',
      position: { x, y, z },
      visualRadius: radius,
      infoHUD: null
    };

    planet.position.set(x, y, z);
    planet.rotation.x = Math.random() * Math.PI;
    planet.rotation.y = Math.random() * Math.PI;
    planet.rotation.z = Math.random() * Math.PI;

    // Add scanning ring effect for habitable planets
    if (planet.userData.habitable) {
      const ringGeometry = new THREE.RingGeometry(radius * 1.2, radius * 1.3, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff88,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      planet.add(ring);
      planet.userData.habitableRing = ring;
    }

    scene.add(planet);
    planets.push(planet);

    console.log(`Created ${planetInfo.name} at (${x}, ${y}, ${z})`);
  });

  console.log(`Created ${planets.length} planets`);
  return planets;
}

function enablePlanetInteractions(planets, camera, spaceship) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let hoveredPlanet = null;

  raycaster.far = 1000;

  // Mouse move for hover effects
  document.addEventListener("mousemove", (event) => {
    if (!document.pointerLockElement) return;

    mouse.x = 0;
    mouse.y = 0;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planets);

    // Clear previous hover
    if (hoveredPlanet && hoveredPlanet !== (intersects[0]?.object)) {
      hoveredPlanet.material.emissiveIntensity = hoveredPlanet.userData.originalEmissive || 0;
      hoveredPlanet = null;
    }

    // Set new hover
    if (intersects.length > 0) {
      const planet = intersects[0].object;
      if (planet !== hoveredPlanet) {
        hoveredPlanet = planet;
        planet.userData.originalEmissive = planet.material.emissiveIntensity;
        planet.material.emissiveIntensity = 0.3;
        playTargetSound();
      }
    }
  });

  // Click interactions
  document.addEventListener("click", (event) => {
    if (!document.pointerLockElement) return;

    mouse.x = 0;
    mouse.y = 0;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planets);

    if (intersects.length === 0) {
      // Forward ray casting
      raycaster.set(
        camera.getWorldPosition(new THREE.Vector3()),
        camera.getWorldDirection(new THREE.Vector3())
      );

      const forwardIntersects = raycaster.intersectObjects(planets);
      if (forwardIntersects.length === 0) return;

      const targetPlanet = forwardIntersects[0].object;
      handlePlanetInteraction(targetPlanet, spaceship);
      return;
    }

    const clickedPlanet = intersects[0].object;
    handlePlanetInteraction(clickedPlanet, spaceship);
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() === 't') {
      const nearestPlanet = findNearestPlanet(planets, spaceship.position);
      if (nearestPlanet) {
        handlePlanetInteraction(nearestPlanet, spaceship);
      }
    }

    if (event.key.toLowerCase() === 'i') {
      const nearestPlanet = findNearestPlanet(planets, spaceship.position);
      if (nearestPlanet) {
        playFuturisticScanSound();
        show3DPlanetInfo(nearestPlanet);
      }
    }
  });

  document.getElementById("toggle-info").addEventListener("click", () => {
  const nearestPlanet = findNearestPlanet(planets, spaceship.position);
  if (nearestPlanet) {
    playFuturisticScanSound();
    show3DPlanetInfo(nearestPlanet);
  }
  });

  document.getElementById("toggle-targets").addEventListener("click", () => {
  const nearestPlanet = findNearestPlanet(planets, spaceship.position);
  if (nearestPlanet) handlePlanetInteraction(nearestPlanet, spaceship);
  });
}

function handlePlanetInteraction(planet, spaceship) {
  console.log("Interacting with planet:", planet.userData.name);

  playFuturisticScanSound();
  landOnPlanet(spaceship, planet);

  setTimeout(() => {
    show3DPlanetInfo(planet);
  }, 1000);
}

function findNearestPlanet(planets, position) {
  let nearest = null;
  let minDistance = Infinity;

  planets.forEach(planet => {
    const distance = planet.position.distanceTo(position);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = planet;
    }
  });

  return nearest;
}

function animatePlanets(planets, delta) {
  planets.forEach((planet, index) => {
    const baseSpeed = 0.1;
    const sizeModifier = 1 / (planet.userData.visualRadius || 3);
    const typeModifier = planet.userData.type === 'Gas Giant' ? 1.5 : 1;
    const rotationSpeed = baseSpeed * sizeModifier * typeModifier;

    planet.rotation.y += rotationSpeed * delta;
    planet.rotation.x += rotationSpeed * 0.2 * delta;

    // Animate habitable rings
    if (planet.userData.habitableRing) {
      planet.userData.habitableRing.rotation.z += delta * 0.5;
      planet.userData.habitableRing.material.opacity = 0.2 + Math.sin(Date.now() * 0.003) * 0.1;
    }

    // Subtle floating motion for gas giants
    if (planet.userData.type === 'Gas Giant') {
      planet.position.y += Math.sin(Date.now() * 0.001 + index) * 0.1 * delta;
    }
  });
}

export {
  createPlanets,
  enablePlanetInteractions,
  findNearestPlanet,
  animatePlanets,
  playFuturisticScanSound,
  initAudio
};