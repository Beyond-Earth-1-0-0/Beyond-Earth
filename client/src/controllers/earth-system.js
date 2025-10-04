import * as THREE from "three";

export class EarthSystem {
  constructor(scene) {
    this.scene = scene;
    this.earth = null;
    this.atmosphere = null;
    this.clouds = null;
    this.earthGroup = new THREE.Group();
    this.scene.add(this.earthGroup);

    this.earthRadius = 50;
    // Texture sources (three.js examples - stable and CORS-friendly)
    this.TEXTURE_URLS = {
      day: "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg",
      normal:
        "https://threejs.org/examples/textures/planets/earth_normal_2048.jpg",
      specular:
        "https://threejs.org/examples/textures/planets/earth_specular_2048.jpg",
      clouds:
        "https://threejs.org/examples/textures/planets/earth_clouds_1024.png",
    };

    // Satellites
    this.satellites = [];
    this.satelliteGroup = new THREE.Group();
    this.earthGroup.add(this.satelliteGroup);
  }

  async init() {
    try {
      await this.createEarth();
      await this.createClouds();
      this.createAtmosphere();
      this.setupLighting();
      this.createSatellites();
    } catch (error) {
      console.error("Error initializing Earth System:", error);
    }
  }

  loadTexture(url) {
    return new Promise((resolve, reject) => {
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin("anonymous");
      loader.load(
        url,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = 8;
          resolve(tex);
        },
        undefined,
        (err) => reject(err)
      );
    });
  }

  createSatellites() {
    // Small spheres with metallic glint orbiting Earth
    const satelliteCount = 5;
    for (let i = 0; i < satelliteCount; i++) {
      const geom = new THREE.SphereGeometry(0.6, 12, 12);
      const mat = new THREE.MeshPhysicalMaterial({
        color: 0xbfc7d5,
        metalness: 0.9,
        roughness: 0.25,
        reflectivity: 0.9,
        clearcoat: 0.6,
      });
      const sat = new THREE.Mesh(geom, mat);
      sat.userData = {
        radius: 65 + Math.random() * 25,
        speed: 0.3 + Math.random() * 0.5,
        inclination: THREE.MathUtils.degToRad(-20 + Math.random() * 40),
        phase: Math.random() * Math.PI * 2,
      };
      this.satelliteGroup.add(sat);
      this.satellites.push(sat);
    }
  }

  async createEarth() {
    const earthGeometry = new THREE.SphereGeometry(50, 128, 128);

    const [dayTex, normalTex, specularTex] = await Promise.all([
      this.loadTexture(this.TEXTURE_URLS.day),
      this.loadTexture(this.TEXTURE_URLS.normal),
      this.loadTexture(this.TEXTURE_URLS.specular),
    ]);

    const earthMaterial = new THREE.MeshPhongMaterial({
      map: dayTex,
      normalMap: normalTex,
      specularMap: specularTex,
      shininess: 20,
      side: THREE.FrontSide,
    });

    this.earth = new THREE.Mesh(earthGeometry, earthMaterial);
    this.earth.castShadow = true;
    this.earth.receiveShadow = true;
    this.earthGroup.add(this.earth);

    // Position and tilt the Earth (approx 23.5°)
    this.earthGroup.position.set(0, 0, -200);
    this.earthGroup.rotation.z = THREE.MathUtils.degToRad(23.5);
  }

  // Removed procedural texture generation in favor of high-resolution photo textures

  // (removed)

  // (removed)

  // (removed)

  // (removed)

  // (removed)

  createAtmosphere() {
    // Create realistic atmospheric layers for first-person skydiving
    this.atmosphereLayers = [];
    this.earthRadius = 50; // Base Earth radius

    // Exosphere (500-1000km) - Very thin, dark blue
    const exosphereGeometry = new THREE.SphereGeometry(
      this.earthRadius + 15,
      64,
      64
    );
    exosphereGeometry.computeBoundingSphere();
    const exosphereMaterial = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        glowColor: { value: new THREE.Color(0x1a1a3a) },
        intensity: { value: 0.3 },
        density: { value: 0.1 },
      },
      vertexShader: `
        precision mediump float;
        precision mediump int;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vHeight;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          vHeight = length(position) - 50.0;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision mediump float;
        precision mediump int;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vHeight;
        uniform vec3 glowColor;
        uniform float intensity;
        uniform float density;
        void main() {
          float fresnel = pow(1.0 - abs(vNormal.z), 3.0);
          float heightFactor = 1.0 - vHeight / 15.0;
          heightFactor = clamp(heightFactor, 0.0, 1.0);
          float alpha = fresnel * intensity * density * heightFactor * 0.3;
          gl_FragColor = vec4(glowColor, alpha);
        }
      `,
    });

    const exosphere = new THREE.Mesh(exosphereGeometry, exosphereMaterial);
    this.earthGroup.add(exosphere);
    exosphere.frustumCulled = false;
    this.validateGeometry(exosphere.geometry, "exosphere");
    this.atmosphereLayers.push({
      mesh: exosphere,
      layer: "exosphere",
      height: 15,
    });

    // Mesosphere (50-85km) - Dark blue to purple
    const mesosphereGeometry = new THREE.SphereGeometry(
      this.earthRadius + 8,
      64,
      64
    );
    mesosphereGeometry.computeBoundingSphere();
    const mesosphereMaterial = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        glowColor: { value: new THREE.Color(0x2d1b69) },
        intensity: { value: 0.6 },
        density: { value: 0.3 },
      },
      vertexShader: `
        precision mediump float;
        precision mediump int;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vHeight;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          vHeight = length(position) - 50.0;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision mediump float;
        precision mediump int;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vHeight;
        uniform vec3 glowColor;
        uniform float intensity;
        uniform float density;
        void main() {
          float fresnel = pow(1.0 - abs(vNormal.z), 2.5);
          float heightFactor = 1.0 - vHeight / 8.0;
          heightFactor = clamp(heightFactor, 0.0, 1.0);
          float alpha = fresnel * intensity * density * heightFactor * 0.5;
          gl_FragColor = vec4(glowColor, alpha);
        }
      `,
    });

    const mesosphere = new THREE.Mesh(mesosphereGeometry, mesosphereMaterial);
    this.earthGroup.add(mesosphere);
    mesosphere.frustumCulled = false;
    this.validateGeometry(mesosphere.geometry, "mesosphere");
    this.atmosphereLayers.push({
      mesh: mesosphere,
      layer: "mesosphere",
      height: 8,
    });

    // Stratosphere (10-50km) - Blue to light blue
    const stratosphereGeometry = new THREE.SphereGeometry(
      this.earthRadius + 4,
      64,
      64
    );
    stratosphereGeometry.computeBoundingSphere();
    const stratosphereMaterial = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        glowColor: { value: new THREE.Color(0x4169e1) },
        intensity: { value: 0.8 },
        density: { value: 0.6 },
      },
      vertexShader: `
        precision mediump float;
        precision mediump int;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vHeight;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          vHeight = length(position) - 50.0;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision mediump float;
        precision mediump int;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vHeight;
        uniform vec3 glowColor;
        uniform float intensity;
        uniform float density;
        void main() {
          float fresnel = pow(1.0 - abs(vNormal.z), 2.0);
          float heightFactor = 1.0 - vHeight / 4.0;
          heightFactor = clamp(heightFactor, 0.0, 1.0);
          float alpha = fresnel * intensity * density * heightFactor * 0.7;
          gl_FragColor = vec4(glowColor, alpha);
        }
      `,
    });

    const stratosphere = new THREE.Mesh(
      stratosphereGeometry,
      stratosphereMaterial
    );
    this.earthGroup.add(stratosphere);
    stratosphere.frustumCulled = false;
    this.validateGeometry(stratosphere.geometry, "stratosphere");
    this.atmosphereLayers.push({
      mesh: stratosphere,
      layer: "stratosphere",
      height: 4,
    });

    // Troposphere (0-10km) - Light blue to white, densest
    const troposphereGeometry = new THREE.SphereGeometry(
      this.earthRadius + 1.5,
      64,
      64
    );
    troposphereGeometry.computeBoundingSphere();
    const troposphereMaterial = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        glowColor: { value: new THREE.Color(0x87ceeb) },
        intensity: { value: 1.2 },
        density: { value: 1.0 },
      },
      vertexShader: `
        precision mediump float;
        precision mediump int;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vHeight;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          vHeight = length(position) - 50.0;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision mediump float;
        precision mediump int;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vHeight;
        uniform vec3 glowColor;
        uniform float intensity;
        uniform float density;
        void main() {
          float fresnel = pow(1.0 - abs(vNormal.z), 1.5);
          float heightFactor = 1.0 - vHeight / 1.5;
          heightFactor = clamp(heightFactor, 0.0, 1.0);
          float alpha = fresnel * intensity * density * heightFactor;
          gl_FragColor = vec4(glowColor, alpha);
        }
      `,
    });

    const troposphere = new THREE.Mesh(
      troposphereGeometry,
      troposphereMaterial
    );
    this.earthGroup.add(troposphere);
    troposphere.frustumCulled = false;
    this.validateGeometry(troposphere.geometry, "troposphere");
    this.atmosphereLayers.push({
      mesh: troposphere,
      layer: "troposphere",
      height: 1.5,
    });

    this.atmosphere = troposphere; // Keep reference for compatibility
  }

  async createClouds() {
    this.cloudLayers = [];
    const cloudTexture = await this.loadTexture(this.TEXTURE_URLS.clouds);
    cloudTexture.colorSpace = THREE.SRGBColorSpace;

    // Cirrus clouds (6-12km) - High altitude, thin and wispy
    const cirrusGeometry = new THREE.SphereGeometry(
      this.earthRadius + 1.2,
      64,
      64
    );
    cirrusGeometry.computeBoundingSphere();
    const cirrusMaterial = new THREE.MeshLambertMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.15,
      depthWrite: false,
      alphaTest: 0.1,
    });

    const cirrusClouds = new THREE.Mesh(cirrusGeometry, cirrusMaterial);
    cirrusClouds.castShadow = false;
    cirrusClouds.receiveShadow = false;
    cirrusClouds.frustumCulled = false;
    this.earthGroup.add(cirrusClouds);
    this.validateGeometry(cirrusClouds.geometry, "cirrus");
    this.cloudLayers.push({
      mesh: cirrusClouds,
      layer: "cirrus",
      altitude: 1.2,
      speed: 0.008,
      baseOpacity: 0.15,
      density: 0.3,
    });

    // Altocumulus clouds (2-6km) - Mid altitude, puffy
    const altocumulusGeometry = new THREE.SphereGeometry(
      this.earthRadius + 0.8,
      64,
      64
    );
    altocumulusGeometry.computeBoundingSphere();
    const altocumulusMaterial = new THREE.MeshLambertMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
      alphaTest: 0.1,
    });

    const altocumulusClouds = new THREE.Mesh(
      altocumulusGeometry,
      altocumulusMaterial
    );
    altocumulusClouds.castShadow = false;
    altocumulusClouds.receiveShadow = false;
    altocumulusClouds.frustumCulled = false;
    this.earthGroup.add(altocumulusClouds);
    this.validateGeometry(altocumulusClouds.geometry, "altocumulus");
    this.cloudLayers.push({
      mesh: altocumulusClouds,
      layer: "altocumulus",
      altitude: 0.8,
      speed: 0.012,
      baseOpacity: 0.4,
      density: 0.6,
    });

    // Cumulus clouds (0.5-2km) - Low altitude, dense and puffy
    const cumulusGeometry = new THREE.SphereGeometry(
      this.earthRadius + 0.4,
      64,
      64
    );
    cumulusGeometry.computeBoundingSphere();
    const cumulusMaterial = new THREE.MeshLambertMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      alphaTest: 0.1,
    });

    const cumulusClouds = new THREE.Mesh(cumulusGeometry, cumulusMaterial);
    cumulusClouds.castShadow = false;
    cumulusClouds.receiveShadow = false;
    cumulusClouds.frustumCulled = false;
    this.earthGroup.add(cumulusClouds);
    this.validateGeometry(cumulusClouds.geometry, "cumulus");
    this.cloudLayers.push({
      mesh: cumulusClouds,
      layer: "cumulus",
      altitude: 0.4,
      speed: 0.015,
      baseOpacity: 0.7,
      density: 0.8,
    });

    // Stratus clouds (0-0.5km) - Ground level, thick and dense
    const stratusGeometry = new THREE.SphereGeometry(
      this.earthRadius + 0.1,
      64,
      64
    );
    stratusGeometry.computeBoundingSphere();
    const stratusMaterial = new THREE.MeshLambertMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      alphaTest: 0.1,
    });

    const stratusClouds = new THREE.Mesh(stratusGeometry, stratusMaterial);
    stratusClouds.castShadow = false;
    stratusClouds.receiveShadow = false;
    stratusClouds.frustumCulled = false;
    this.earthGroup.add(stratusClouds);
    this.validateGeometry(stratusClouds.geometry, "stratus");
    this.cloudLayers.push({
      mesh: stratusClouds,
      layer: "stratus",
      altitude: 0.1,
      speed: 0.018,
      baseOpacity: 0.9,
      density: 1.0,
    });

    // Keep reference for compatibility
    this.clouds = stratusClouds;
  }

  validateGeometry(geometry, label = "geometry") {
    // Sanitize NaN/Infinity vertex positions and recompute bounds
    try {
      const position = geometry?.attributes?.position;
      if (!position || !position.array) return;
      const arr = position.array;
      let fixed = 0;
      for (let i = 0; i < arr.length; i++) {
        const v = arr[i];
        if (!Number.isFinite(v)) {
          arr[i] = 0;
          fixed++;
        }
      }
      if (fixed > 0) {
        console.warn(
          `[EarthSystem] Sanitized ${fixed} invalid position values on ${label}.`
        );
      }
      position.needsUpdate = true;
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();
      geometry.computeBoundingBox();
    } catch (e) {
      console.warn(`[EarthSystem] validateGeometry failed for ${label}`, e);
    }
  }

  setupLighting() {
    // Sun light
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.35);
    sunLight.position.set(200, 50, 200);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    this.scene.add(sunLight);

    // Soft ambient
    const ambientLight = new THREE.AmbientLight(0x223344, 0.35);
    this.scene.add(ambientLight);

    // Cool rim/back light for depth
    const rimLight = new THREE.DirectionalLight(0x6ba7ff, 0.25);
    rimLight.position.set(-250, 50, -150);
    this.scene.add(rimLight);
  }

  update(cameraPosition = null) {
    const time = Date.now() * 0.001;

    // Rotate earth with realistic speed (one rotation per 24 hours = 0.00001157 radians per second)
    // Scaled up for visual effect: 0.00001157 * 1000 = 0.01157
    if (this.earth) {
      this.earth.rotation.y = time * 0.01157;
    }

    // Update atmospheric layers with camera-based effects
    if (this.atmosphereLayers && cameraPosition) {
      this.atmosphereLayers.forEach((layer) => {
        const distance = cameraPosition.distanceTo(
          new THREE.Vector3(0, 0, -200)
        );
        const heightAboveEarth = distance - this.earthRadius;

        // Update camera position uniform for shaders
        if (layer.mesh.material.uniforms.cameraPosition) {
          layer.mesh.material.uniforms.cameraPosition.value.copy(
            cameraPosition
          );
        }

        // Adjust opacity based on camera height
        if (heightAboveEarth < layer.height) {
          // Camera is inside this atmospheric layer
          const penetration = 1.0 - heightAboveEarth / layer.height;
          layer.mesh.material.opacity = Math.min(1.0, penetration * 0.8);
        } else {
          // Camera is outside this layer
          layer.mesh.material.opacity = 0.3;
        }
      });
    }

    // Update cloud layers with camera-based penetration effects
    if (this.cloudLayers && cameraPosition) {
      this.cloudLayers.forEach((layer) => {
        layer.mesh.rotation.y = time * layer.speed;

        // Add subtle vertical movement for more dynamic clouds
        const verticalOffset = Math.sin(time * 0.5 + layer.altitude) * 0.05;
        layer.mesh.position.y = verticalOffset;

        // Calculate camera height above Earth
        const distance = cameraPosition.distanceTo(
          new THREE.Vector3(0, 0, -200)
        );
        const heightAboveEarth = distance - this.earthRadius;

        // Cloud penetration effect
        if (heightAboveEarth < layer.altitude) {
          // Camera is inside cloud layer - create penetration effect
          const penetration = 1.0 - heightAboveEarth / layer.altitude;
          const density = layer.density * penetration;

          // Create fog-like effect when inside clouds
          layer.mesh.material.opacity = Math.min(
            0.9,
            layer.baseOpacity * density
          );

          // Add slight color shift for immersion
          const fogColor = new THREE.Color(0xffffff);
          fogColor.lerp(new THREE.Color(0x87ceeb), penetration * 0.3);
          layer.mesh.material.color = fogColor;
        } else {
          // Camera is outside cloud layer
          layer.mesh.material.opacity = layer.baseOpacity;
          layer.mesh.material.color = new THREE.Color(0xffffff);
        }

        // Add wind effect to clouds
        const windOffset = Math.sin(time * 0.3 + layer.altitude * 10) * 0.02;
        layer.mesh.position.x = windOffset;
      });
    }

    // Add subtle wobble to simulate Earth's axial tilt and precession
    if (this.earthGroup) {
      this.earthGroup.rotation.x = Math.sin(time * 0.001) * 0.01;
    }

    // Update satellites orbits
    if (this.satellites?.length) {
      this.satellites.forEach((sat) => {
        const { radius, speed, inclination, phase } = sat.userData;
        const angle = time * speed + phase;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = Math.sin(angle * 0.7) * 6; // slight vertical oscillation
        // Apply inclination by rotating around X
        const pos = new THREE.Vector3(x, y, z);
        pos.applyAxisAngle(new THREE.Vector3(1, 0, 0), inclination);
        sat.position.copy(pos);
        sat.rotation.y += 0.03;
      });
    }
  }

  getEarthGroup() {
    return this.earthGroup;
  }

  dispose() {
    // Dispose of atmosphere layers
    if (this.atmosphereLayers) {
      this.atmosphereLayers.forEach((mesh) => {
        if (mesh) {
          this.earthGroup.remove(mesh);
          mesh.geometry.dispose();
          if (mesh.material instanceof THREE.Material) {
            mesh.material.dispose();
          }
        }
      });
    }

    // Dispose of cloud layers
    if (this.cloudLayers) {
      this.cloudLayers.forEach((layer) => {
        if (layer.mesh) {
          this.earthGroup.remove(layer.mesh);
          layer.mesh.geometry.dispose();
          if (layer.mesh.material instanceof THREE.Material) {
            layer.mesh.material.dispose();
          }
        }
      });
    }

    // Dispose of earth and other objects
    [this.earth].forEach((mesh) => {
      if (mesh) {
        this.earthGroup.remove(mesh);
        mesh.geometry.dispose();
        if (mesh.material instanceof THREE.Material) {
          mesh.material.dispose();
        }
      }
    });

    this.scene.remove(this.earthGroup);
  }
}
