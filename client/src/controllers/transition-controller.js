export class TransitionController {
  constructor(audioController) {
    this.overlay = document.getElementById("transition-overlay");
    this.canvas = document.getElementById("transition-canvas");
    this.ctx2d = this.canvas.getContext("2d");
    this.audio = audioController;
    this.running = false;
    this.startTime = 0;
    this.raf = 0;
    this.stars = [];
    this.duration = 3600; // ms, extended for richer sequence
    this.starCount = 320;
    this.resizeHandler = this.onResize.bind(this);
    window.addEventListener("resize", this.resizeHandler);
    this.onResize();
  }

  onResize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.overlay.classList.remove("hidden");
    document.body.classList.add("transition-active");
    this.startTime = performance.now();
    this.initStars();
    this.audio?.setMapImmersive(true); // keep soft profile
    this.loop();
  }

  initStars() {
    this.stars = [];
    for (let i = 0; i < this.starCount; i++) {
      this.stars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        len: Math.random() * 2 + 1,
        speed: Math.random() * 8 + 4,
        alpha: Math.random() * 0.6 + 0.2,
      });
    }
  }

  draw(t) {
    const ctx = this.ctx2d;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Phase timings for atmospheric descent
    const boot = Math.min(1, t / 0.1); // visor boot-in
    const descentPhase = t > 0.05 ? Math.min(1, (t - 0.05) / 0.9) : 0; // atmospheric descent
    const flashPhase = t > 0.95 ? (t - 0.95) / 0.05 : 0; // arrival flash

    // Atmospheric layers background based on descent phase
    if (descentPhase > 0) {
      const gradient = ctx.createLinearGradient(0, 0, 0, h);
      const phase = descentPhase;

      if (phase < 0.1) {
        // Exosphere - Very dark blue to black
        gradient.addColorStop(0, `rgba(10, 10, 30, ${0.9 * phase})`);
        gradient.addColorStop(0.5, `rgba(20, 20, 50, ${0.7 * phase})`);
        gradient.addColorStop(1, `rgba(30, 30, 70, ${0.5 * phase})`);
      } else if (phase < 0.25) {
        // Mesosphere - Dark blue to purple
        gradient.addColorStop(0, `rgba(20, 20, 50, ${0.8})`);
        gradient.addColorStop(0.3, `rgba(45, 27, 105, ${0.7})`);
        gradient.addColorStop(0.7, `rgba(70, 50, 120, ${0.6})`);
        gradient.addColorStop(1, `rgba(100, 80, 150, ${0.5})`);
      } else if (phase < 0.5) {
        // Stratosphere - Blue to light blue
        gradient.addColorStop(0, `rgba(30, 50, 120, ${0.8})`);
        gradient.addColorStop(0.3, `rgba(65, 105, 225, ${0.7})`);
        gradient.addColorStop(0.7, `rgba(135, 206, 235, ${0.6})`);
        gradient.addColorStop(1, `rgba(173, 216, 230, ${0.5})`);
      } else if (phase < 0.8) {
        // Troposphere - Light blue to white (clouds)
        gradient.addColorStop(0, `rgba(100, 150, 200, ${0.8})`);
        gradient.addColorStop(0.2, `rgba(135, 206, 235, ${0.9})`);
        gradient.addColorStop(0.5, `rgba(200, 220, 255, ${0.8})`);
        gradient.addColorStop(0.8, `rgba(240, 248, 255, ${0.7})`);
        gradient.addColorStop(1, `rgba(255, 255, 255, ${0.6})`);
      } else {
        // Near ground - White to light blue
        gradient.addColorStop(0, `rgba(240, 248, 255, ${0.9})`);
        gradient.addColorStop(0.3, `rgba(220, 240, 255, ${0.8})`);
        gradient.addColorStop(0.7, `rgba(200, 230, 255, ${0.7})`);
        gradient.addColorStop(1, `rgba(180, 220, 255, ${0.6})`);
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    }

    // Cloud particles for skydiving through clouds
    if (descentPhase > 0.2) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      const cloudPhase = Math.min(1, (descentPhase - 0.2) / 0.6);
      const cloudCount = Math.floor(cloudPhase * 50);

      for (let i = 0; i < cloudCount; i++) {
        const x = (i * 137.5) % w;
        const y = (i * 89.3) % h;
        const size = 20 + Math.sin(i * 0.7) * 15;
        const alpha = (0.3 + Math.sin(i * 0.5) * 0.2) * cloudPhase;

        // Create cloud-like blob
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();

        // Add smaller cloud particles
        for (let j = 0; j < 3; j++) {
          const offsetX = Math.sin(i * 0.3 + j) * size * 0.8;
          const offsetY = Math.cos(i * 0.3 + j) * size * 0.6;
          const smallSize = size * (0.3 + Math.sin(i + j) * 0.2);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
          ctx.beginPath();
          ctx.arc(x + offsetX, y + offsetY, smallSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    // Wind streaks for skydiving motion
    if (descentPhase > 0.1) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      const windPhase = Math.min(1, (descentPhase - 0.1) / 0.8);
      const streakCount = Math.floor(windPhase * 30);

      for (let i = 0; i < streakCount; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const length = 50 + Math.random() * 100;
        const speed = 2 + Math.random() * 4;
        const alpha = (0.1 + Math.random() * 0.2) * windPhase;

        ctx.strokeStyle = `rgba(200, 220, 255, ${alpha})`;
        ctx.lineWidth = 1 + Math.random() * 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.sin(i * 0.7) * length, y + length);
        ctx.stroke();
      }
      ctx.restore();
    }

    // HUD elements for atmospheric descent
    const hud = document.querySelector(".hud-ring");
    if (hud) {
      const intensity = 0.2 + 0.8 * descentPhase;
      const color =
        descentPhase < 0.5 ? "rgba(0, 191, 255" : "rgba(255, 255, 255";
      hud.style.boxShadow = `0 0 ${
        10 + 30 * descentPhase
      }px ${color}, ${intensity}) inset`;
    }

    // Atmospheric layer and altitude indicators
    if (descentPhase > 0.05) {
      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * descentPhase})`;
      ctx.font = "bold 20px Arial";
      ctx.textAlign = "right";

      // Altitude indicator
      const altitude = Math.floor((1 - descentPhase) * 20000) + 500;
      ctx.fillText(`ALT: ${altitude}m`, w - 20, 30);

      // Speed indicator
      const speed = Math.floor(descentPhase * 300) + 100;
      ctx.fillText(`SPD: ${speed} km/h`, w - 20, 55);

      // Atmospheric layer indicator
      let layerName = "EXOSPHERE";
      if (descentPhase > 0.1) layerName = "MESOSPHERE";
      if (descentPhase > 0.25) layerName = "STRATOSPHERE";
      if (descentPhase > 0.5) layerName = "TROPOSPHERE";
      if (descentPhase > 0.8) layerName = "SURFACE";

      ctx.font = "bold 16px Arial";
      ctx.fillText(`LAYER: ${layerName}`, w - 20, 80);

      ctx.restore();
    }

    // Arrival flash
    if (flashPhase > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(255,255,255,${0.6 * flashPhase})`;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
  }

  loop() {
    this.raf = requestAnimationFrame(() => this.loop());
    const now = performance.now();
    const elapsed = now - this.startTime;
    const t = Math.min(1, elapsed / this.duration);

    this.draw(t);

    // slight audio swell and then fade
    if (this.audio?.ctx) {
      const swell = 0.08 * Math.sin(t * Math.PI);
      this.audio.targetSpace = Math.max(0.06, 0.12 - swell);
      this.audio.targetWind = Math.max(0.02, 0.06 * t);
    }

    if (t >= 1) {
      cancelAnimationFrame(this.raf);
      this.running = false;
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("exoplanets-transition-complete"));
      }, 50);
    }
  }

  hide() {
    this.overlay.classList.add("hidden");
    document.body.classList.remove("transition-active");
  }
}

window.TransitionController = TransitionController;
