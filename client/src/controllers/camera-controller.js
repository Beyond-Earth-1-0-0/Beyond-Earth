import * as THREE from "three";

export class CameraController {
  constructor(camera) {
    this.camera = camera;
    this.targetPosition = new THREE.Vector3();
    this.targetRotation = new THREE.Euler();
    this.currentPosition = new THREE.Vector3();
    this.currentRotation = new THREE.Euler();
    this.desertSceneController = null;
    this.desertShown = false;

    // Descent state
    this.inDescent = false;
    this.descentIntensity = 0; // 0..1 eased progress within descent phase

    // Journey phases
    this.phases = {
      deepSpace: { start: 0, end: 0.25 },
      approaching: { start: 0.25, end: 0.5 },
      earthOrbit: { start: 0.5, end: 0.75 },
      descent: { start: 0.75, end: 1.0 },
    };
  }

  setDesertSceneController(controller) {
    this.desertSceneController = controller;
  }

  setInitialPosition() {
    // Start in deep space
    this.camera.position.set(0, 0, 1000);
    this.camera.lookAt(0, 0, 0);
    this.currentPosition.copy(this.camera.position);
    this.currentRotation.copy(this.camera.rotation);
    this.targetPosition.copy(this.camera.position);
    this.targetRotation.copy(this.camera.rotation);
  }

  updateFromScroll(progress) {
    // Determine which phase we're in
    if (progress <= this.phases.deepSpace.end) {
      this.handleDeepSpacePhase(progress / this.phases.deepSpace.end);
    } else if (progress <= this.phases.approaching.end) {
      const phaseProgress =
        (progress - this.phases.deepSpace.end) /
        (this.phases.approaching.end - this.phases.deepSpace.end);
      this.handleApproachingPhase(phaseProgress);
    } else if (progress <= this.phases.earthOrbit.end) {
      const phaseProgress =
        (progress - this.phases.approaching.end) /
        (this.phases.earthOrbit.end - this.phases.approaching.end);
      this.handleEarthOrbitPhase(phaseProgress);
    } else {
      const phaseProgress =
        (progress - this.phases.earthOrbit.end) /
        (this.phases.descent.end - this.phases.earthOrbit.end);
      this.handleDescentPhase(phaseProgress);
    }
  }

  handleDeepSpacePhase(progress) {
    this.inDescent = false;
    this.descentIntensity = 0;
    this.desertShown = false;
    // Gradually move closer to solar system
    const startZ = 1000;
    const endZ = 500;
    this.targetPosition.set(
      0,
      0,
      THREE.MathUtils.lerp(startZ, endZ, this.easeInOut(progress))
    );
    this.targetRotation.set(0, 0, 0);
  }

  handleApproachingPhase(progress) {
    this.inDescent = false;
    this.descentIntensity = 0;
    this.desertShown = false;
    // Move from deep space towards Earth
    const startZ = 500;
    const endZ = 150;
    this.targetPosition.set(
      0,
      0,
      THREE.MathUtils.lerp(startZ, endZ, this.easeInOut(progress))
    );
    this.targetRotation.set(0, 0, 0);
  }

  handleEarthOrbitPhase(progress) {
    this.inDescent = false;
    this.descentIntensity = 0;
    this.desertShown = false;
    // Orbit around Earth
    const radius = 100;
    const angle = progress * Math.PI * 0.5; // Quarter orbit

    this.targetPosition.set(
      Math.sin(angle) * radius,
      Math.sin(angle) * 20, // Slight vertical movement
      Math.cos(angle) * radius - 50 // Offset to center on Earth
    );

    // Look at Earth
    const lookAtTarget = new THREE.Vector3(0, 0, -200);
    const direction = lookAtTarget.clone().sub(this.targetPosition).normalize();
    this.targetRotation.setFromQuaternion(
      new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, -1),
        direction
      )
    );
  }

  handleDescentPhase(progress) {
    this.inDescent = true;
    // Use default desert location (Cairo, Egypt)
    const userLocation = { lat: 30.0444, lng: 31.2357 };

    // Convert lat/lng to 3D position on Earth surface
    const earthRadius = 50;
    const lat = THREE.MathUtils.degToRad(userLocation.lat);
    const lng = THREE.MathUtils.degToRad(userLocation.lng);

    const earthCenter = new THREE.Vector3(0, 0, -200);
    const surfacePoint = new THREE.Vector3(
      Math.cos(lat) * Math.cos(lng) * earthRadius,
      Math.sin(lat) * earthRadius,
      Math.cos(lat) * Math.sin(lng) * earthRadius
    ).add(earthCenter);

    // Realistic atmospheric descent phases
    let height, speed, fov, atmosphericLayer;
    if (progress < 0.1) {
      // Exosphere (500-1000km) - Very high altitude, slow descent
      height = THREE.MathUtils.lerp(80, 70, progress / 0.1);
      speed = 0.1;
      fov = 60;
      atmosphericLayer = "exosphere";
    } else if (progress < 0.25) {
      // Mesosphere (50-85km) - High altitude, increasing speed
      const phaseProgress = (progress - 0.1) / 0.15;
      height = THREE.MathUtils.lerp(70, 55, phaseProgress);
      speed = 0.1 + phaseProgress * 0.2;
      fov = 60 + phaseProgress * 10;
      atmosphericLayer = "mesosphere";
    } else if (progress < 0.5) {
      // Stratosphere (10-50km) - Mid altitude, accelerating
      const phaseProgress = (progress - 0.25) / 0.25;
      height = THREE.MathUtils.lerp(55, 35, phaseProgress);
      speed = 0.3 + phaseProgress * 0.3;
      fov = 70 + phaseProgress * 15;
      atmosphericLayer = "stratosphere";
    } else if (progress < 0.8) {
      // Troposphere (0-10km) - Low altitude, high speed through clouds
      const phaseProgress = (progress - 0.5) / 0.3;
      height = THREE.MathUtils.lerp(35, 15, phaseProgress);
      speed = 0.6 + phaseProgress * 0.3;
      fov = 85 + phaseProgress * 10;
      atmosphericLayer = "troposphere";
    } else {
      // Final approach - Near ground, slowing down
      const phaseProgress = (progress - 0.8) / 0.2;
      height = THREE.MathUtils.lerp(15, 7, phaseProgress);
      speed = 0.9 - phaseProgress * 0.4;
      fov = 95 - phaseProgress * 5;
      atmosphericLayer = "surface";
    }

    this.descentIntensity = progress;
    this.descentSpeed = speed;
    this.currentAtmosphericLayer = atmosphericLayer;

    // Drive desert scene loading during descent
    if (this.desertSceneController) {
      const mapLoadStart = 0.6; // Start loading desert scene at 60% descent
      const mapLoadEnd = 0.9; // Fully loaded at 90%

      if (progress >= mapLoadStart) {
        const mapProgress =
          (progress - mapLoadStart) / (mapLoadEnd - mapLoadStart);
        this.desertSceneController.setOverlayBlend(mapProgress);

        // Show desert scene when we're close to ground
        if (progress > 0.75 && !this.desertShown) {
          this.desertShown = true;
          this.desertSceneController.onDescentToLocation(userLocation, {
            zoom: 18,
            transitionMs: 2000,
          });
        }
      }
    }

    // Basis vectors at the target point
    const normal = surfacePoint.clone().sub(earthCenter).normalize();
    const up = normal.clone();
    // East vector (partial derivative wrt longitude)
    const east = new THREE.Vector3(
      -Math.sin(lng),
      0,
      Math.cos(lng)
    ).normalize();
    // North vector (partial derivative wrt latitude)
    const north = new THREE.Vector3(
      -Math.sin(lat) * Math.cos(lng),
      Math.cos(lat),
      -Math.sin(lat) * Math.sin(lng)
    ).normalize();

    // First-person skydiving direction - looking down and forward
    const forwardTangent = new THREE.Vector3()
      .addVectors(east, north)
      .normalize();

    // Wind effects that vary by atmospheric layer
    let windEffect = 0;
    if (atmosphericLayer === "exosphere" || atmosphericLayer === "mesosphere") {
      windEffect = Math.sin(progress * Math.PI * 2) * speed * 0.1; // Minimal wind
    } else if (atmosphericLayer === "stratosphere") {
      windEffect = Math.sin(progress * Math.PI * 3) * speed * 0.2; // Moderate wind
    } else if (atmosphericLayer === "troposphere") {
      windEffect = Math.sin(progress * Math.PI * 4) * speed * 0.4; // Strong wind
    } else {
      windEffect = Math.sin(progress * Math.PI * 6) * speed * 0.2; // Ground level wind
    }

    const windDirection = new THREE.Vector3()
      .crossVectors(forwardTangent, up)
      .normalize();

    // First-person position - looking down at Earth
    const aheadDistance = THREE.MathUtils.lerp(25, 5, progress);
    this.targetPosition
      .copy(surfacePoint)
      .addScaledVector(forwardTangent, aheadDistance)
      .addScaledVector(windDirection, windEffect)
      .addScaledVector(up, height);

    // Look direction - first-person view looking down and slightly forward
    const lookTarget = surfacePoint
      .clone()
      .addScaledVector(forwardTangent, 8)
      .addScaledVector(windDirection, windEffect * 0.3);
    const lookDirection = lookTarget.sub(this.targetPosition).normalize();
    this.targetRotation.setFromQuaternion(
      new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, -1),
        lookDirection
      )
    );

    // Store FOV for update method
    this.targetFov = fov;
  }

  update() {
    // Smooth interpolation to target - faster during skydiving
    const lerpFactor = this.inDescent ? 0.18 : 0.08;

    this.currentPosition.lerp(this.targetPosition, lerpFactor);
    this.currentRotation.x = THREE.MathUtils.lerp(
      this.currentRotation.x,
      this.targetRotation.x,
      lerpFactor
    );
    this.currentRotation.y = THREE.MathUtils.lerp(
      this.currentRotation.y,
      this.targetRotation.y,
      lerpFactor
    );
    this.currentRotation.z = THREE.MathUtils.lerp(
      this.currentRotation.z,
      this.targetRotation.z,
      lerpFactor
    );

    this.camera.position.copy(this.currentPosition);
    this.camera.rotation.copy(this.currentRotation);

    // Skydiving motion effects
    const now = Date.now() * 0.001;
    const intensity = this.inDescent ? this.descentIntensity : 0;
    const speed = this.inDescent ? this.descentSpeed || 1.0 : 0;

    if (this.inDescent) {
      // First-person skydiving motion effects based on atmospheric layer
      const layer = this.currentAtmosphericLayer || "exosphere";

      // Roll and pitch effects vary by atmospheric layer
      let rollSway, pitchSway, turbulenceIntensity;

      if (layer === "exosphere" || layer === "mesosphere") {
        // High altitude - minimal movement, stable
        rollSway = Math.sin(now * 0.5) * 0.005 * speed;
        pitchSway = Math.sin(now * 0.3) * 0.003 * speed;
        turbulenceIntensity = speed * 0.1;
      } else if (layer === "stratosphere") {
        // Mid altitude - moderate movement
        rollSway =
          (Math.sin(now * 1.5) * 0.01 + Math.sin(now * 0.8) * 0.005) * speed;
        pitchSway = Math.sin(now * 1.2) * 0.008 * speed;
        turbulenceIntensity = speed * 0.3;
      } else if (layer === "troposphere") {
        // Low altitude - strong movement through clouds
        rollSway =
          (Math.sin(now * 2.5) * 0.02 + Math.sin(now * 1.3) * 0.01) * speed;
        pitchSway = Math.sin(now * 2.0) * 0.015 * speed;
        turbulenceIntensity = speed * 0.6;
      } else {
        // Near ground - stabilizing
        rollSway =
          (Math.sin(now * 1.8) * 0.015 + Math.sin(now * 1.0) * 0.008) * speed;
        pitchSway = Math.sin(now * 1.5) * 0.012 * speed;
        turbulenceIntensity = speed * 0.4;
      }

      this.camera.rotation.z += rollSway;
      this.camera.rotation.x += pitchSway;

      // Wind turbulence - varies by atmospheric layer
      const shakeAmp = turbulenceIntensity * 0.5;
      if (shakeAmp > 0) {
        const sx =
          Math.sin(now * 6.0) * shakeAmp * 0.8 +
          Math.sin(now * 3.2) * shakeAmp * 0.2;
        const sy =
          Math.cos(now * 5.1) * shakeAmp * 0.6 +
          Math.sin(now * 2.8) * shakeAmp * 0.4;
        const sz = Math.sin(now * 4.5) * shakeAmp * 0.3;
        this.camera.position.x += sx;
        this.camera.position.y += sy;
        this.camera.position.z += sz;
      }

      // Speed-based camera shake - more intense in lower atmosphere
      const speedShake =
        Math.sin(now * 8.0) * speed * (layer === "troposphere" ? 0.15 : 0.08);
      this.camera.rotation.x += speedShake;
      this.camera.rotation.y += speedShake * 0.3;

      // FOV changes based on atmospheric layers
      if (this.targetFov !== undefined) {
        this.camera.fov = THREE.MathUtils.lerp(
          this.camera.fov,
          this.targetFov,
          0.1
        );
      }
    } else {
      // Normal motion for non-descent phases
      const rollSway =
        (Math.sin(now * 2.4) * 0.02 + Math.sin(now * 0.9) * 0.015) * 0.5;
      const pitchSway = Math.sin(now * 1.8 + 1.2) * 0.01 * 0.4;
      this.camera.rotation.z += rollSway;
      this.camera.rotation.x += pitchSway;

      // Normal FOV
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, 75, 0.02);
    }

    this.camera.updateProjectionMatrix();
  }

  easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  getCurrentPhase(progress) {
    if (progress <= this.phases.deepSpace.end) return "Deep Space";
    if (progress <= this.phases.approaching.end)
      return "Approaching Solar System";
    if (progress <= this.phases.earthOrbit.end) return "Earth Orbit";
    return "Descending to Earth surface";
  }
}
