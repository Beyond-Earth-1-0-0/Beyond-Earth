// DesertSceneController.js - Ultra-realistic Egyptian Desert Scene (EXR Local Updated)
//
// Features: oasis, pyramids, sphinx, day/night cycle, sandstorm toggle,
// click-to-focus, LOD/instancing, NaN safety, heat shimmer, sun shafts,
// EXR-based HDR sky from local assets.

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export class DesertSceneController {
  constructor(opts = {}) {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.isInitialized = false;
    this.desertOverlay = document.getElementById("desert-overlay");
    this.desertCanvas = document.getElementById("desert-canvas");
    this.root = document.documentElement;
    this.animationId = null;
    this.sandParticles = null;
    this.windDirection = { x: 0.5, z: 0.2 };
    this.time = 0;
    this.spaceship = null; // Reference to the spaceship model
    this.desertLocation = {
      name: "Far Desert, Egypt",
      description:
        "Majestic conical mountains rise from endless golden sands, sculpted by ancient winds.",
      temperature: 45,
      windSpeed: 8,
      visibility: "Exceptional",
    };

    this.opts = Object.assign(
      {
        rockCount: 600,
        bushCount: 400,
        particleCount: 250,
        enableHeatShimmer: true,
        enableSandstorm: false,
      },
      opts
    );

    this._raycaster = new THREE.Raycaster();
    this._mouse = new THREE.Vector2();
    this._focusTarget = null;
    this._dayProgress = 0.25;

    this.setupEventListeners();
  }

  _clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  _sanitizeFloat32Array(arr) {
    for (let i = 0; i < arr.length; i++) {
      if (!isFinite(arr[i])) arr[i] = 0;
    }
  }

  async init() {
    if (this.isInitialized) return;
    try {
      if (typeof THREE === "undefined")
        throw new Error("Three.js library not loaded.");
      await this.initializeDesertScene();
      this.isInitialized = true;
      console.log("Desert Scene Controller initialized.");
    } catch (error) {
      console.error("Failed to initialize Desert Scene:", error);
      this.initializationFailed = true;
    }
  }

  async initializeDesertScene() {
    if (!this.desertCanvas) throw new Error("Desert canvas element not found");

    this.desertCanvas.style.width = "100%";
    this.desertCanvas.style.height = "100%";
    this.desertCanvas.width = window.innerWidth;
    this.desertCanvas.height = window.innerHeight;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    this.camera.position.set(-12, 6, 18);
    this.camera.lookAt(0, 1.5, -10);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.desertCanvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0xeadfca, 0.0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene.fog = new THREE.FogExp2(0xdccfb4, 0.004);

    this.controls = new OrbitControls(this.camera, this.desertCanvas);
    this.controls.target.set(0, 1.5, -10);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 300;
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.controls.enableZoom = false; // Disable zooming to prevent resizing

    await this.setupLightingAndSky();

    // Load the spaceship model into the desert scene as a large, distant object
    await this.loadSpaceship();

    this.desertCanvas.addEventListener("click", (e) => this._onCanvasClick(e));
    // REMOVED: Wheel event listener that would take you back to space
    window.addEventListener("resize", () => this.onWindowResize());
    this.animate();
  }

  // ---------------------------- Load Spaceship ----------------------------
  async loadSpaceship() {
    const loader = new GLTFLoader();
    try {
      const { scene: spaceshipScene } = await loader.loadAsync(
        "../assets/models/spaceship-rocket.glb"
      );
      this.spaceship = spaceshipScene;

      // Make it much larger and position it farther from camera
      this.spaceship.scale.set(80, 80, 80); // Much bigger
      this.spaceship.position.set(40, 0, -200); // Much farther and on ground level
      this.spaceship.rotation.y = Math.PI * 0.25; // Angle it towards camera
      this.spaceship.rotation.x = 0; // Ensure it's level with ground

      // Fix materials to be opaque and sharp
      this.spaceship.traverse((child) => {
        if (child.isMesh) {
          // Make materials fully opaque
          child.material.transparent = false;
          child.material.opacity = 1.0;
          child.material.depthWrite = true;
          child.material.depthTest = true;

          // Enhance color and reduce roughness for sharper look
          if (child.material.color) {
            child.material.color.multiplyScalar(1.2); // Boost color intensity
          }
          child.material.roughness = Math.max(0.3, child.material.roughness || 0.5);
          child.material.metalness = Math.min(0.8, child.material.metalness || 0.5);

          // Enable shadows for better definition
          child.castShadow = true;
          child.receiveShadow = true;

          // Force material update
          child.material.needsUpdate = true;
        }
      });

      // Add some ambient glow to make it more noticeable
      const spaceshipLight = new THREE.PointLight(0x00aaff, 1.2, 100);
      spaceshipLight.position.copy(this.spaceship.position);
      spaceshipLight.position.y += 8;
      this.scene.add(spaceshipLight);

      // Add subtle engine glow underneath
      const engineLight = new THREE.PointLight(0xff4400, 0.8, 30);
      engineLight.position.copy(this.spaceship.position);
      engineLight.position.y -= 2;
      this.scene.add(engineLight);

      // Add the spaceship to the scene
      this.scene.add(this.spaceship);

      console.log("Spaceship loaded and positioned in desert");
    } catch (error) {
      console.error("Failed to load spaceship model:", error);
    }
  }

  // ---------------------------- Lighting & Sky ----------------------------
  async setupLightingAndSky() {
    this.ambient = new THREE.HemisphereLight(0xfff3e0, 0x7a6a5a, 0.6);
    this.scene.add(this.ambient);

    this.sun = new THREE.DirectionalLight(0xffdd9a, 3.0);
    this.sun.position.set(60, 120, 30);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    this.scene.add(this.sun);

    // Load local EXR if present; otherwise, fall back to gradient sky.
    const loader = new EXRLoader();
    loader.setDataType(THREE.FloatType); // <-- Important patch
    return new Promise((resolve) => {
      loader.load(
        "../assets/goegap_4k.exr",
        (texture) => {
          try {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            const pmrem = new THREE.PMREMGenerator(this.renderer);
            pmrem.compileEquirectangularShader();
            const envMap = pmrem.fromEquirectangular(texture).texture;
            this.scene.environment = envMap;
            this.scene.background = envMap;
            texture.dispose();
            pmrem.dispose();
          } catch (e) {
            const skyGeo = new THREE.SphereGeometry(1000, 32, 32);
            const skyMat = new THREE.MeshBasicMaterial({
              color: 0x87ceeb,
              side: THREE.BackSide,
            });
            this.scene.add(new THREE.Mesh(skyGeo, skyMat));
          }
          resolve();
        },
        undefined,
        () => {
          const skyGeo = new THREE.SphereGeometry(1000, 32, 32);
          const skyMat = new THREE.MeshBasicMaterial({
            color: 0x87ceeb,
            side: THREE.BackSide,
          });
          this.scene.add(new THREE.Mesh(skyGeo, skyMat));
          resolve();
        }
      );
    });
  }

  // ---------------------------- Animation Loop ----------------------------
  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    this.time += 0.01;

    // Add gentle rotation to spaceship for visual interest
    if (this.spaceship) {
      this.spaceship.rotation.y += 0.003; // Slower rotation since it's landed
    }

    // day/night cycle update
    this._dayProgress = (this._dayProgress + 0.0002) % 1.0;
    const dayFactor = Math.sin(this._dayProgress * Math.PI * 2) * 0.5 + 0.5; // 0..1
    const sunIntensity = 0.2 + dayFactor * 2.5;
    this.sun.intensity = sunIntensity;
    this.ambient.intensity = 0.15 + dayFactor * 0.6;
    // subtle background tint shift
    const skyColor = new THREE.Color().setHSL(
      0.58 - dayFactor * 0.06,
      0.6,
      0.5 + dayFactor * 0.1
    );
    if (this.scene.background && this.scene.background.isTexture) {
      // keep envMap
    } else {
      this.scene.background = new THREE.Color(skyColor.getHex());
    }

    // sand particles
    if (this.sandParticles) {
      const positions = this.sandParticles.geometry.attributes.position.array;
      const velocities = this.sandParticles.geometry.attributes.velocity.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] +=
          this.windDirection.x *
          (0.01 + (this.opts.enableSandstorm ? 0.08 : 0));
        positions[i + 2] +=
          this.windDirection.z *
          (0.01 + (this.opts.enableSandstorm ? 0.08 : 0));
        positions[i + 1] += velocities[i + 1];

        if (positions[i + 1] < -2) {
          positions[i] = (Math.random() - 0.5) * 200;
          positions[i + 1] = 6 + Math.random() * 6;
          positions[i + 2] = (Math.random() - 0.5) * 200;
        }
      }
      this.sandParticles.geometry.attributes.position.needsUpdate = true;
    }

    // wind direction animation
    this.windDirection.x = Math.sin(this.time * 0.5) * 0.5;
    this.windDirection.z = Math.cos(this.time * 0.3) * 0.3;

    // heat shimmer: subtle camera jitter
    if (this.opts.enableHeatShimmer) {
      const jitter = 0.003 * Math.sin(this.time * 3.0);
      this.camera.position.x += jitter;
      this.camera.position.y += jitter * 0.2;
    }

    // focus target smooth approach
    if (this._focusTarget && this.controls) {
      const target = this._focusTarget;
      const lerp = 0.02;
      this.controls.target.lerp(target, lerp);
      // move camera slightly towards target but keep distance
      this.camera.position.x +=
        (this.controls.target.x - this.camera.position.x) * 0.01;
      this.camera.position.z +=
        (this.controls.target.z - this.camera.position.z) * 0.01;
      this.controls.update();
    } else if (this.controls) {
      this.controls.update();
    }

    // render
    this.renderer.render(this.scene, this.camera);
  }

  // ---------------------------- Input / Interaction ----------------------------
  _onCanvasClick(e) {
    const rect = this.desertCanvas.getBoundingClientRect();
    this._mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this._mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this._raycaster.setFromCamera(this._mouse, this.camera);

    // Check if spaceship was clicked
    if (this.spaceship) {
      const spaceshipIntersects = this._raycaster.intersectObject(
        this.spaceship,
        true
      );
      if (spaceshipIntersects.length > 0) {
        console.log("Spaceship clicked! Transitioning to exoplanets...");
        this.triggerExoplanetTransition();
        return;
      }
    }

    // Default behavior for other clicks
    const intersects = this._raycaster.intersectObjects(
      this.scene.children,
      true
    );
    if (intersects.length > 0) {
      const hit = intersects[0];
      this._focusTarget = new THREE.Vector3().copy(hit.point);
      // lift focus target slightly
      this._focusTarget.y += 1.5;
    }
  }

  triggerExoplanetTransition() {
    console.log("Starting spaceship launch sequence...");
    // Start the launch animation
    this.launchSpaceship();
  }

  async launchSpaceship() {
    if (!this.spaceship) return;

    // Create smoke system for launch
    this.createLaunchSmoke();

    // Store initial position
    const startPos = this.spaceship.position.clone();
    const endPos = startPos.clone().add(new THREE.Vector3(0, 200, 0));

    // Launch parameters
    const duration = 4000; // 4 seconds
    const startTime = performance.now();

    // Add screen shake effect
    let originalCameraPos = this.camera.position.clone();

    // Launch animation function
    const animateLaunch = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Eased motion (slow start, fast middle, slow end)
      const easedProgress =
        progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      // Move spaceship upward
      this.spaceship.position.lerpVectors(startPos, endPos, easedProgress);

      // Add rotation during launch
      this.spaceship.rotation.z = Math.sin(progress * Math.PI * 4) * 0.1;
      this.spaceship.rotation.x = progress * 0.3;

      // Screen shake intensity based on launch progress
      const shakeIntensity =
        Math.sin(progress * Math.PI) * (1 - progress * 0.5);
      this.camera.position.x =
        originalCameraPos.x + (Math.random() - 0.5) * shakeIntensity * 2;
      this.camera.position.y =
        originalCameraPos.y + (Math.random() - 0.5) * shakeIntensity * 1;
      this.camera.position.z =
        originalCameraPos.z + (Math.random() - 0.5) * shakeIntensity * 2;

      // Update smoke system
      if (this.launchSmoke) {
        this.updateLaunchSmoke(progress);
      }

      // Continue animation or finish
      if (progress < 1) {
        requestAnimationFrame(animateLaunch);
      } else {
        this.finishLaunch();
      }
    };

    // Start the launch animation
    requestAnimationFrame(animateLaunch);
  }

  createLaunchSmoke() {
    const smokeGeometry = new THREE.BufferGeometry();
    const smokeCount = 80000;
    const positions = new Float32Array(smokeCount * 3);
    const velocities = new Float32Array(smokeCount * 3);
    const scales = new Float32Array(smokeCount);
    const life = new Float32Array(smokeCount);
    const opacity = new Float32Array(smokeCount);

    // Initialize smoke particles at spaceship base
    for (let i = 0; i < smokeCount; i++) {
      const i3 = i * 3;
      const radius = Math.random() * 4;
      const angle = Math.random() * Math.PI * 2;

      positions[i3] = this.spaceship.position.x + Math.cos(angle) * radius;
      positions[i3 + 1] = this.spaceship.position.y - 2; // Start below spaceship
      positions[i3 + 2] = this.spaceship.position.z + Math.sin(angle) * radius;

      // Realistic exhaust velocities
      const exhaustSpeed = 8 + Math.random() * 4;
      velocities[i3] = (Math.random() - 0.5) * 1.5; // Horizontal spread
      velocities[i3 + 1] = -exhaustSpeed; // Strong downward thrust
      velocities[i3 + 2] = (Math.random() - 0.5) * 1.5;

      scales[i] = 0.5 + Math.random() * 1.5;
      life[i] = Math.random(); // Random starting life
      opacity[i] = 0.8 + Math.random() * 0.2;
    }

    smokeGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
    smokeGeometry.setAttribute(
      "velocity",
      new THREE.BufferAttribute(velocities, 3)
    );
    smokeGeometry.setAttribute("scale", new THREE.BufferAttribute(scales, 1));
    smokeGeometry.setAttribute("life", new THREE.BufferAttribute(life, 1));
    smokeGeometry.setAttribute(
      "opacity",
      new THREE.BufferAttribute(opacity, 1)
    );

    // Create shader material for realistic smoke
    const smokeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(0x808080) },
      },
      vertexShader: `
        attribute float scale;
        attribute float life;
        attribute float opacity;
        uniform float time;
        varying float vLife;
        varying float vOpacity;
        
        void main() {
          vLife = life;
          vOpacity = opacity;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = scale * (300.0 / -mvPosition.z) * (1.0 + life * 2.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        varying float vLife;
        varying float vOpacity;
        
        void main() {
          float distanceFromCenter = length(gl_PointCoord - vec2(0.5));
          if (distanceFromCenter > 0.5) discard;
          
          float alpha = (1.0 - distanceFromCenter * 2.0) * vOpacity * (1.0 - vLife);
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    this.launchSmoke = new THREE.Points(smokeGeometry, smokeMaterial);
    this.scene.add(this.launchSmoke);
  }

  updateLaunchSmoke(progress) {
    if (!this.launchSmoke) return;

    const positions = this.launchSmoke.geometry.attributes.position.array;
    const velocities = this.launchSmoke.geometry.attributes.velocity.array;
    const scales = this.launchSmoke.geometry.attributes.scale.array;
    const life = this.launchSmoke.geometry.attributes.life.array;
    const opacity = this.launchSmoke.geometry.attributes.opacity.array;

    const thrustIntensity = Math.sin(progress * Math.PI) * 2; // Peak thrust in middle
    const wind = {
      x: Math.sin(this.time * 0.5) * 0.5,
      z: Math.cos(this.time * 0.3) * 0.3,
    };

    // Update smoke particles with realistic physics
    for (let i = 0; i < positions.length; i += 3) {
      const idx = i / 3;

      // Age particles
      life[idx] += 0.015;

      // Reset particle if too old
      if (life[idx] > 1.0) {
        const radius = Math.random() * 4;
        const angle = Math.random() * Math.PI * 2;
        positions[i] = this.spaceship.position.x + Math.cos(angle) * radius;
        positions[i + 1] = this.spaceship.position.y - 2;
        positions[i + 2] = this.spaceship.position.z + Math.sin(angle) * radius;

        const exhaustSpeed = (8 + Math.random() * 4) * thrustIntensity;
        velocities[i] = (Math.random() - 0.5) * 1.5;
        velocities[i + 1] = -exhaustSpeed;
        velocities[i + 2] = (Math.random() - 0.5) * 1.5;

        life[idx] = 0;
        opacity[idx] = 0.8 + Math.random() * 0.2;
      } else {
        // Apply physics
        positions[i] += velocities[i];
        positions[i + 1] += velocities[i + 1];
        positions[i + 2] += velocities[i + 2];

        // Air resistance and expansion
        velocities[i] *= 0.98;
        velocities[i + 1] *= 0.96; // Less resistance on main exhaust
        velocities[i + 2] *= 0.98;

        // Wind effect
        velocities[i] += wind.x * 0.1;
        velocities[i + 2] += wind.z * 0.1;

        // Gravity effect on older particles
        if (life[idx] > 0.3) {
          velocities[i + 1] -= 0.02;
        }

        // Expansion
        scales[idx] *= 1.015;

        // Fade out
        opacity[idx] *= 0.995;
      }
    }

    // Update uniforms and attributes
    this.launchSmoke.material.uniforms.time.value = this.time;
    this.launchSmoke.geometry.attributes.position.needsUpdate = true;
    this.launchSmoke.geometry.attributes.velocity.needsUpdate = true;
    this.launchSmoke.geometry.attributes.scale.needsUpdate = true;
    this.launchSmoke.geometry.attributes.life.needsUpdate = true;
    this.launchSmoke.geometry.attributes.opacity.needsUpdate = true;
  }

  finishLaunch() {
    console.log("Launch complete, transitioning to exoplanet scene...");

    // Clean up smoke systems
    if (this.launchSmoke) {
      this.scene.remove(this.launchSmoke);
      this.launchSmoke = null;
    }
    if (this.smokeCloud) {
      this.scene.remove(this.smokeCloud);
      this.smokeCloud = null;
    }

    // Hide desert overlay with fade effect
    this.desertOverlay.style.transition = "opacity 1s ease-out";
    this.desertOverlay.style.opacity = "0";

    setTimeout(() => {
      this.hideDesert();

      // Trigger transition to exoplanet scene
      setTimeout(() => {
        // Navigate to exoplanet scene
        try {
          window.location.href = "exo-space.html";
        } catch (e) {
          window.location.hash = "#exoplanets";
        }
      }, 500);
    }, 1000);
  }

  onWindowResize() {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  setupEventListeners() {
    document.addEventListener("keydown", (e) => {
      if (
        e.key === "Escape" &&
        this.desertOverlay?.classList.contains("visible")
      )
        this.hideDesert();
      if (e.key === "S") {
        // toggle sandstorm
        this.opts.enableSandstorm = !this.opts.enableSandstorm;
        console.log("Sandstorm:", this.opts.enableSandstorm);
      }
    });

    this.desertOverlay?.addEventListener("click", (e) => {
      if (e.target === this.desertOverlay) this.hideDesert();
    });
  }

  showDesert(location, options = {}) {
    if (!this.isInitialized) {
      console.warn("Desert Scene not initialized yet");
      return;
    }
    if (this.initializationFailed) {
      console.warn("Desert Scene initialization failed, cannot show desert");
      return;
    }

    this.desertOverlay.classList.remove("hidden");
    this.desertOverlay.classList.add("visible");
    this.setOverlayBlend(0);
    document.body.classList.add("desert-immersive");
    window.dispatchEvent(
      new CustomEvent("desert-immersive", { detail: { visible: true } })
    );

    this.updateDesertInfo();

    if (!this.animationId) this.animate();
    this.playDesertVoiceover();
  }

  playDesertVoiceover() {
    // Prevent multiple calls by checking if speech is already playing
    if (window.speechSynthesis.speaking) {
      return;
    }

    const playSpeech = () => {
      // Double-check that speech isn't already playing
      if (window.speechSynthesis.speaking) {
        return;
      }

      const speech = new SpeechSynthesisUtterance();
      speech.text =
        "You have arrived in the desert. Look for the spaceship to begin your journey to explore distant exoplanets among the stars.";
      speech.volume = 1;
      speech.rate = 0.9;
      speech.pitch = 1;

      // Find a suitable female voice with a more robust search
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(
        (voice) =>
          voice.lang.startsWith("en") &&
          /female|samantha|tessa|susan|zira|google/i.test(voice.name)
      );

      if (femaleVoice) {
        speech.voice = femaleVoice;
      } else {
        // Fallback to the first available English voice if no specific female voice is found
        speech.voice = voices.find((voice) => voice.lang.startsWith("en"));
      }

      window.speechSynthesis.speak(speech);
    };

    // Ensure voices are loaded before trying to play
    if (speechSynthesis.getVoices().length === 0) {
      // Use a one-time event listener to prevent multiple calls
      const handleVoicesChanged = () => {
        speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
        playSpeech();
      };
      speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    } else {
      playSpeech();
    }
  }

  hideDesert() {
    this.desertOverlay.classList.remove("visible");
    setTimeout(() => {
      this.desertOverlay.classList.add("hidden");
      document.body.classList.remove("desert-immersive");
      this.setOverlayBlend(0);
      window.dispatchEvent(
        new CustomEvent("desert-immersive", { detail: { visible: false } })
      );
    }, 500);
  }

  updateDesertInfo() {
    document.getElementById("desert-location-name").textContent =
      this.desertLocation.name;
    document.getElementById("desert-location-description").textContent =
      this.desertLocation.description;
    document.getElementById(
      "desert-temp"
    ).textContent = `${this.desertLocation.temperature}°C`;
    document.getElementById(
      "desert-wind"
    ).textContent = `${this.desertLocation.windSpeed} km/h`;
    document.getElementById("desert-visibility").textContent =
      this.desertLocation.visibility;
  }

  onDescentToLocation(location, options) {
    if (location && this.isInitialized) this.showDesert(location, options);
  }

  setOverlayBlend(t) {
    const clamped = Math.max(0, Math.min(1, t));
    this.root.style.setProperty("--overlayOpacity", String(clamped));
  }

  // Cleanup method
  destroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.renderer) this.renderer.dispose();
    if (this.scene) {
      // dispose geometries/materials
      this.scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose?.();
        if (obj.material) {
          if (Array.isArray(obj.material))
            obj.material.forEach((m) => m.dispose?.());
          else obj.material.dispose?.();
        }
      });
      this.scene.clear();
    }
  }
}

window.DesertSceneController = DesertSceneController;
