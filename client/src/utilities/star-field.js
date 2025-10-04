import * as THREE from "three";

export class StarField {
  constructor(scene) {
    this.scene = scene;
    this.starCount = 6000;
    this.stars = null; // will hold the THREE.Points
    this.material = null;
  }

  async init() {
    try {
      this.createStarField();
    } catch (error) {
      console.error("Error initializing StarField:", error);
    }
  }

  createStarField() {
    // --- create circular texture ---
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");

    const cx = 32,
      cy = 32,
      radius = 28;
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.4, "rgba(255, 255, 255, 0.8)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);

    // --- star positions ---
    const positions = new Float32Array(this.starCount * 3);
    for (let i = 0; i < this.starCount; i++) {
      const r = 1000 + Math.random() * 2000;
      const theta = Math.random() * Math.PI * 2;
      const u = 2 * Math.random() - 1;
      const phi = Math.acos(Math.min(Math.max(u, -1), 1));

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    // --- material for points ---
    this.material = new THREE.PointsMaterial({
      size: 12,
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 1.0,
    });

    this.stars = new THREE.Points(geometry, this.material);
    this.scene.add(this.stars);
  }

  update() {
    if (!this.stars) return;

    // const time = Date.now() * 0.001;

    // spin the whole star field
    this.stars.rotation.y += 0.0002;
    this.stars.rotation.x += 0.0001;

    // // pulsing glow
    // const pulse = 0.6 + 0.4 * Math.sin(time * 1.5);
    // this.material.size = 6 + pulse * 2;
    // this.material.opacity = 0.75 + 0.25 * Math.sin(time * 2.3);
  }

  dispose() {
    if (this.stars) {
      this.scene.remove(this.stars);
      this.stars.geometry.dispose();
      this.material.dispose();
      this.stars = null;
    }
  }
}
