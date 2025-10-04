// src/data management/planet-data-provider.js

/**
 * Default exoplanet data with realistic characteristics
 */
const DEFAULT_PLANET_DATA = {
  planets: [
    {
      name: "Kepler-442b",
      type: "Super Earth",
      mass: "2.3 Earth masses",
      radius: "1.34 Earth radii",
      temperature: "265 K (-8°C)",
      atmosphere: "Potentially thick atmosphere with water vapor",
      surface: "Likely rocky with possible liquid water",
      orbitalPeriod: "112.3 days",
      distance: "1,206 light years",
      hostStar: "Kepler-442 (K-type star)",
      discovery: "2015 by Kepler Space Telescope",
      habitability: "Located in habitable zone with potential for liquid water",
      position: { x: 200, y: 40, z: 120 }
    },
    {
      name: "TRAPPIST-1e",
      type: "Earth-like",
      mass: "0.77 Earth masses",
      radius: "0.92 Earth radii",
      temperature: "251 K (-22°C)",
      atmosphere: "Unknown, possibly Earth-like",
      surface: "Likely rocky with potential oceans",
      orbitalPeriod: "6.1 days",
      distance: "40.7 light years",
      hostStar: "TRAPPIST-1 (ultra-cool dwarf)",
      discovery: "2016 by TRAPPIST telescope",
      habitability: "In habitable zone, one of most Earth-like known",
      position: { x: -120, y: -20, z: 240 }
    },
    {
      name: "HD 40307g",
      type: "Super Earth",
      mass: "7.1 Earth masses",
      radius: "1.8 Earth radii",
      temperature: "280 K (7°C)",
      atmosphere: "Potentially dense atmosphere",
      surface: "Rocky surface with possible greenhouse effect",
      orbitalPeriod: "197.8 days",
      distance: "42 light years",
      hostStar: "HD 40307 (K-type dwarf)",
      discovery: "2012 by HARPS spectrograph",
      habitability: "Located in habitable zone",
      position: { x: 320, y: -60, z: -160 }
    },
    {
      name: "GJ 667Cc",
      type: "Super Earth",
      mass: "3.7 Earth masses",
      radius: "1.54 Earth radii",
      temperature: "277 K (4°C)",
      atmosphere: "Unknown composition",
      surface: "Likely rocky with potential for water",
      orbitalPeriod: "28.1 days",
      distance: "23.6 light years",
      hostStar: "Gliese 667C (red dwarf)",
      discovery: "2011 by HARPS",
      habitability: "Strong candidate for habitability",
      position: { x: -240, y: 100, z: 40 }
    },
    {
      name: "K2-18b",
      type: "Sub-Neptune",
      mass: "8.6 Earth masses",
      radius: "2.3 Earth radii",
      temperature: "265 K (-8°C)",
      atmosphere: "Water vapor detected, hydrogen-rich",
      surface: "Likely ocean world beneath thick atmosphere",
      orbitalPeriod: "33 days",
      distance: "124 light years",
      hostStar: "K2-18 (red dwarf)",
      discovery: "2015 by K2 mission",
      habitability: "Water vapor confirmed in atmosphere",
      position: { x: 80, y: 160, z: -200 }
    },
    {
      name: "Proxima Centauri b",
      type: "Terrestrial",
      mass: "1.17 Earth masses",
      radius: "1.1 Earth radii",
      temperature: "234 K (-39°C)",
      atmosphere: "Unknown, possibly stripped by stellar winds",
      surface: "Rocky, tidally locked to star",
      orbitalPeriod: "11.2 days",
      distance: "4.24 light years",
      hostStar: "Proxima Centauri (red dwarf)",
      discovery: "2016 by European Southern Observatory",
      habitability: "Closest potentially habitable exoplanet",
      position: { x: -80, y: -120, z: 280 }
    },
    {
      name: "TOI-715b",
      type: "Super Earth",
      mass: "3.02 Earth masses",
      radius: "1.55 Earth radii",
      temperature: "260 K (-13°C)",
      atmosphere: "Suitable for atmospheric study",
      surface: "Rocky composition with potential climate",
      orbitalPeriod: "19.3 days",
      distance: "137 light years",
      hostStar: "TOI-715 (red dwarf)",
      discovery: "2024 by TESS mission",
      habitability: "Recently confirmed in habitable zone",
      position: { x: 360, y: 20, z: 80 }
    },
    {
      name: "LHS 1140b",
      type: "Rocky Super Earth",
      mass: "6.6 Earth masses",
      radius: "1.7 Earth radii",
      temperature: "230 K (-43°C)",
      atmosphere: "Likely retains atmosphere better than most",
      surface: "Dense rocky composition",
      orbitalPeriod: "24.7 days",
      distance: "48.6 light years",
      hostStar: "LHS 1140 (red dwarf)",
      discovery: "2017 by MEarth project",
      habitability: "Excellent target for atmospheric studies",
      position: { x: -160, y: 200, z: -120 }
    },
    {
      name: "Wolf 1061c",
      type: "Super Earth",
      mass: "4.3 Earth masses",
      radius: "1.66 Earth radii",
      temperature: "223 K (-50°C)",
      atmosphere: "Unknown atmospheric retention",
      surface: "Rocky with possible ice caps",
      orbitalPeriod: "17.9 days",
      distance: "13.8 light years",
      hostStar: "Wolf 1061 (red dwarf)",
      discovery: "2015 by HARPS",
      habitability: "Inner edge of habitable zone",
      position: { x: 240, y: -100, z: 180 }
    },
    {
      name: "Kepler-1649c",
      type: "Earth-like",
      mass: "1.06 Earth masses",
      radius: "1.06 Earth radii",
      temperature: "234 K (-39°C)",
      atmosphere: "Unknown, potentially Earth-like",
      surface: "Rocky surface with potential liquid water",
      orbitalPeriod: "19.5 days",
      distance: "301 light years",
      hostStar: "Kepler-1649 (red dwarf)",
      discovery: "2020 by reanalysis of Kepler data",
      habitability: "Most Earth-like planet found by Kepler",
      position: { x: -280, y: -40, z: -240 }
    }
  ]
};


/**
 * Load default planet data
 * @returns {Object} Planet data object
 */
export function loadDefaultData() {
  return JSON.parse(JSON.stringify(DEFAULT_PLANET_DATA));
}

/**
 * Apply new planet data to existing planets
 * @param {Array} existingPlanets - Array of existing planet meshes
 * @param {Object} newData - New planet data
 */
export function applyNewData(existingPlanets, newData) {
  if (!newData || !newData.planets || !Array.isArray(newData.planets)) {
    throw new Error("Invalid planet data format. Expected { planets: [...] }");
  }

  console.log("Applying new planet data...");

  // Validate new data structure
  const requiredFields = ['name', 'type', 'position'];
  const validPlanets = newData.planets.filter(planet => {
    return requiredFields.every(field => planet.hasOwnProperty(field));
  });

  if (validPlanets.length === 0) {
    throw new Error("No valid planets found in data. Each planet must have: name, type, position");
  }

  // Update existing planets with new data
  validPlanets.forEach((planetData, index) => {
    if (index < existingPlanets.length) {
      const planetMesh = existingPlanets[index];

      // Update position
      if (planetData.position && typeof planetData.position === 'object') {
        const { x, y, z } = planetData.position;
        if (typeof x === 'number' && typeof y === 'number' && typeof z === 'number') {
          planetMesh.position.set(x, y, z);
        }
      }

      // Update userData with new information
      Object.assign(planetMesh.userData, {
        name: planetData.name || planetMesh.userData.name,
        type: planetData.type || planetMesh.userData.type,
        mass: planetData.mass || planetMesh.userData.mass,
        radius: planetData.radius || planetMesh.userData.radius,
        temperature: planetData.temperature || planetMesh.userData.temperature,
        atmosphere: planetData.atmosphere || planetMesh.userData.atmosphere,
        surface: planetData.surface || planetMesh.userData.surface,
        orbitalPeriod: planetData.orbitalPeriod || planetMesh.userData.orbitalPeriod,
        distance: planetData.distance || planetMesh.userData.distance,
        hostStar: planetData.hostStar || planetMesh.userData.hostStar,
        discovery: planetData.discovery || planetMesh.userData.discovery,
        habitability: planetData.habitability || planetMesh.userData.habitability,
        position: planetData.position || planetMesh.userData.position
      });

      // Update visual appearance based on type if needed
      updatePlanetVisuals(planetMesh, planetData);
    }
  });

  console.log(`Updated ${Math.min(validPlanets.length, existingPlanets.length)} planets with new data`);
}

/**
 * Update planet visual appearance based on data
 * @param {THREE.Mesh} planetMesh - The planet mesh to update
 * @param {Object} planetData - New planet data
 */
function updatePlanetVisuals(planetMesh, planetData) {
  if (!planetData.type) return;

  // Color mapping based on planet type
  const typeColors = {
    "Super Earth": { h: 30, s: 60, l: 40 },
    "Earth-like": { h: 120, s: 70, l: 45 },
    "Terrestrial": { h: 30, s: 60, l: 40 },
    "Rocky Super Earth": { h: 25, s: 65, l: 35 },
    "Sub-Neptune": { h: 220, s: 70, l: 50 },
    "Gas Giant": { h: 220, s: 70, l: 50 },
    "Ice": { h: 200, s: 80, l: 70 },
    "Volcanic": { h: 15, s: 90, l: 30 },
    "Ocean": { h: 240, s: 80, l: 60 }
  };

  const colorConfig = typeColors[planetData.type];
  if (colorConfig && planetMesh.material) {
    planetMesh.material.color.setHSL(
      colorConfig.h / 360,
      colorConfig.s / 100,
      colorConfig.l / 100
    );

    // Update material properties based on type
    if (planetData.type.includes("Gas")) {
      planetMesh.material.roughness = 0.3;
      planetMesh.material.metalness = 0.1;
    } else if (planetData.type.includes("Ice")) {
      planetMesh.material.roughness = 0.1;
      planetMesh.material.metalness = 0.9;
    } else if (planetData.type.includes("Rocky") || planetData.type.includes("Earth")) {
      planetMesh.material.roughness = 0.8;
      planetMesh.material.metalness = 0.2;
    }
  }
}

/**
 * Validate planet data structure
 * @param {Object} data - Data to validate
 * @returns {Object} Validation result with errors if any
 */
export function validatePlanetData(data) {
  const errors = [];

  if (!data) {
    errors.push("No data provided");
    return { valid: false, errors };
  }

  if (!data.planets) {
    errors.push("Missing 'planets' array");
    return { valid: false, errors };
  }

  if (!Array.isArray(data.planets)) {
    errors.push("'planets' must be an array");
    return { valid: false, errors };
  }

  data.planets.forEach((planet, index) => {
    const planetErrors = [];

    if (!planet.name) planetErrors.push("Missing 'name'");
    if (!planet.type) planetErrors.push("Missing 'type'");
    if (!planet.position) planetErrors.push("Missing 'position'");

    if (planet.position && typeof planet.position === 'object') {
      if (typeof planet.position.x !== 'number') planetErrors.push("position.x must be a number");
      if (typeof planet.position.y !== 'number') planetErrors.push("position.y must be a number");
      if (typeof planet.position.z !== 'number') planetErrors.push("position.z must be a number");
    }

    if (planetErrors.length > 0) {
      errors.push(`Planet ${index}: ${planetErrors.join(', ')}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * Generate sample planet data structure for user reference
 * @returns {Object} Sample data structure
 */
export function generateSampleData() {
  return {
    planets: [
      {
        name: "Sample Planet Alpha",
        type: "Earth-like",
        mass: "1.2 Earth masses",
        radius: "1.1 Earth radii",
        temperature: "285 K (12°C)",
        atmosphere: "Nitrogen-oxygen with water vapor",
        surface: "Rocky with large oceans",
        orbitalPeriod: "365.25 days",
        distance: "50 light years",
        hostStar: "Sample Star A (G-type)",
        discovery: "2024 by Sample Observatory",
        habitability: "Located in habitable zone with confirmed water",
        position: { x: 100, y: 0, z: 0 }
      },
      {
        name: "Sample Planet Beta",
        type: "Super Earth",
        mass: "3.5 Earth masses",
        radius: "1.6 Earth radii",
        temperature: "250 K (-23°C)",
        atmosphere: "Dense atmosphere with greenhouse gases",
        surface: "Rocky with polar ice caps",
        orbitalPeriod: "180 days",
        distance: "75 light years",
        hostStar: "Sample Star B (K-type)",
        discovery: "2024 by Sample Survey",
        habitability: "Potentially habitable with seasonal variations",
        position: { x: -50, y: 30, z: 80 }
      }
    ]
  };
}