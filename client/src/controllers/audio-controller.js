export class AudioController {
  constructor() {
    this.ctx = null;
    this.started = false;
    this.muted = false;

    // Nodes
    this.masterGain = null;
    this.spaceGain = null;
    this.windGain = null;
    this.spaceOsc = null;
    this.spaceFilter = null;
    this.windNoise = null;
    this.windFilter = null;

    // LFOs
    this.lfo = null;
    this.lfoGain = null;

    // Targets for smooth fades
    this.targetSpace = 0.0;
    this.targetWind = 0.0;
    this.duckMultiplier = 0.2; // duck when map overlay visible

    this.lastUpdate = 0;
    this.sourcesStarted = false; // Track if sources have been started
    this.initializationPromise = null;
  }

  async init() {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._initializeAudio();
    return this.initializationPromise;
  }

  async _initializeAudio() {
    // Defer audio context creation until first user gesture (autoplay policies)
    const startAudio = async () => {
      if (this.started) return;

      try {
        this.started = true;
        await this._setupAudioGraph();
        // Remove all listeners after successful initialization
        this._removeAudioListeners();
      } catch (error) {
        console.warn("Failed to initialize audio:", error);
        this.started = false;
        // Keep listeners active for retry
      }
    };

    // Store reference to the function for removal
    this._startAudioHandler = startAudio;

    window.addEventListener("pointerdown", this._startAudioHandler, { once: true });
    window.addEventListener("keydown", this._startAudioHandler, { once: true });
    window.addEventListener("wheel", this._startAudioHandler, { once: true, passive: true });
    window.addEventListener("click", this._startAudioHandler, { once: true });
    window.addEventListener("touchstart", this._startAudioHandler, { once: true, passive: true });

    // Mute toggle for user control
    window.addEventListener("keydown", (e) => {
      if (e.key.toLowerCase() === "m") {
        this.toggleMute();
      }
    });
  }

  _removeAudioListeners() {
    if (this._startAudioHandler) {
      window.removeEventListener("pointerdown", this._startAudioHandler);
      window.removeEventListener("keydown", this._startAudioHandler);
      window.removeEventListener("wheel", this._startAudioHandler);
      window.removeEventListener("click", this._startAudioHandler);
      window.removeEventListener("touchstart", this._startAudioHandler);
      this._startAudioHandler = null;
    }
  }

  async _setupAudioGraph() {
    try {
      // Only create context after user gesture
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();

      // Ensure the audio context is running - with better error handling
      if (this.ctx.state === "suspended") {
        try {
          await this.ctx.resume();
          console.log("AudioContext resumed successfully");
        } catch (resumeError) {
          console.warn("Could not resume audio context:", resumeError);
          throw resumeError; // Re-throw to be caught by outer try-catch
        }
      }

      // Verify context is actually running
      if (this.ctx.state !== "running") {
        console.warn("AudioContext not running after resume attempt, state:", this.ctx.state);
        throw new Error("AudioContext failed to start");
      }

      console.log("AudioContext is now running, initializing audio nodes...");

      // Master
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.4;
      this.masterGain.connect(this.ctx.destination);

      // Space hum: low oscillator through lowpass filter
      this.spaceGain = this.ctx.createGain();
      this.spaceGain.gain.value = 0.0;
      this.spaceFilter = this.ctx.createBiquadFilter();
      this.spaceFilter.type = "lowpass";
      this.spaceFilter.frequency.value = 120;
      this.spaceOsc = this.ctx.createOscillator();
      this.spaceOsc.type = "sine";
      this.spaceOsc.frequency.value = 48; // Hz

      // LFO to modulate filter cutoff slightly (movement)
      this.lfo = this.ctx.createOscillator();
      this.lfo.frequency.value = 0.08;
      this.lfoGain = this.ctx.createGain();
      this.lfoGain.gain.value = 10; // cutoff swing
      this.lfo.connect(this.lfoGain);
      this.lfoGain.connect(this.spaceFilter.frequency);

      this.spaceOsc.connect(this.spaceFilter);
      this.spaceFilter.connect(this.spaceGain);
      this.spaceGain.connect(this.masterGain);

      // Wind: filtered noise through bandpass + gain
      this.windGain = this.ctx.createGain();
      this.windGain.gain.value = 0.0;
      this.windFilter = this.ctx.createBiquadFilter();
      this.windFilter.type = "bandpass";
      this.windFilter.frequency.value = 400;
      this.windFilter.Q.value = 0.5;

      this.windNoise = this._createNoiseSource();
      if (this.windNoise) {
        this.windNoise.connect(this.windFilter);
        this.windFilter.connect(this.windGain);
        this.windGain.connect(this.masterGain);
      }

      // Skydiving wind effects
      this.skydiveWindGain = this.ctx.createGain();
      this.skydiveWindGain.gain.value = 0.0;
      this.skydiveWindFilter = this.ctx.createBiquadFilter();
      this.skydiveWindFilter.type = "highpass";
      this.skydiveWindFilter.frequency.value = 200;
      this.skydiveWindFilter.Q.value = 0.3;

      this.skydiveWindNoise = this._createNoiseSource();
      if (this.skydiveWindNoise) {
        this.skydiveWindNoise.connect(this.skydiveWindFilter);
        this.skydiveWindFilter.connect(this.skydiveWindGain);
        this.skydiveWindGain.connect(this.masterGain);
      }

      // Atmospheric pressure effect (low rumble)
      this.atmosphereGain = this.ctx.createGain();
      this.atmosphereGain.gain.value = 0.0;
      this.atmosphereFilter = this.ctx.createBiquadFilter();
      this.atmosphereFilter.type = "lowpass";
      this.atmosphereFilter.frequency.value = 80;
      this.atmosphereFilter.Q.value = 1.0;

      this.atmosphereOsc = this.ctx.createOscillator();
      this.atmosphereOsc.type = "sawtooth";
      this.atmosphereOsc.frequency.value = 30;

      this.atmosphereOsc.connect(this.atmosphereFilter);
      this.atmosphereFilter.connect(this.atmosphereGain);
      this.atmosphereGain.connect(this.masterGain);

      // Speed rush effect (high frequency whoosh)
      this.rushGain = this.ctx.createGain();
      this.rushGain.gain.value = 0.0;
      this.rushFilter = this.ctx.createBiquadFilter();
      this.rushFilter.type = "bandpass";
      this.rushFilter.frequency.value = 2000;
      this.rushFilter.Q.value = 2.0;

      this.rushNoise = this._createNoiseSource();
      if (this.rushNoise) {
        this.rushNoise.connect(this.rushFilter);
        this.rushFilter.connect(this.rushGain);
        this.rushGain.connect(this.masterGain);
      }

      // Start sources after a small delay to ensure everything is connected
      setTimeout(() => {
        this._startAudioSources();
      }, 100);

      // Default ambient space bed
      this.targetSpace = 0.12;
      this.targetWind = 0.0;
      this.targetSkydiveWind = 0.0;
      this.targetAtmosphere = 0.0;
      this.targetRush = 0.0;

      this.lastUpdate = this.ctx.currentTime;
      console.log("Audio system initialized successfully");
    } catch (error) {
      console.warn("Failed to setup audio graph:", error);
      this.ctx = null;
      this.started = false;
      throw error; // Re-throw to be handled by caller
    }
  }

  _startAudioSources() {
    if (this.sourcesStarted || !this.ctx || this.ctx.state !== "running") {
      return;
    }

    try {
      // Add small delay before starting oscillators to ensure context is stable
      const startTime = this.ctx.currentTime + 0.1;

      this.spaceOsc.start(startTime);
      this.lfo.start(startTime);
      this.windNoise.start(startTime);
      this.skydiveWindNoise.start(startTime);
      this.atmosphereOsc.start(startTime);
      this.rushNoise.start(startTime);
      this.sourcesStarted = true;
    } catch (error) {
      console.warn("Failed to start audio sources:", error);
    }
  }

  _createNoiseSource() {
    if (!this.ctx) return null;

    try {
      const bufferSize = 2 * this.ctx.sampleRate;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1; // white noise
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;
      return noise;
    } catch (error) {
      console.warn("Failed to create noise source:", error);
      return null;
    }
  }

  update(descentState) {
    if (!this.ctx || !this.started) return;

    // Try to start sources if they haven't been started yet
    if (!this.sourcesStarted && this.ctx.state === "running") {
      this._startAudioSources();
    }

    // Return early if audio nodes aren't created yet
    if (!this.spaceGain || !this.windGain || !this.skydiveWindGain ||
      !this.atmosphereGain || !this.rushGain) {
      return;
    }

    const intensity = descentState?.intensity || 0;
    const inDescent = !!descentState?.inDescent;
    const speed = descentState?.speed || 0;

    // Skydiving audio targets based on descent phase
    let targetSpace,
      targetWind,
      targetSkydiveWind,
      targetAtmosphere,
      targetRush;

    if (inDescent) {
      // Skydiving audio profile
      targetSpace = 0.08 * (0.2 - 0.1 * intensity); // Reduce space hum during descent
      targetWind = 0.1 * intensity; // Gentle wind
      targetSkydiveWind = 0.3 * intensity * speed; // Strong wind during skydiving
      targetAtmosphere = 0.2 * intensity; // Atmospheric pressure
      targetRush = 0.4 * intensity * speed; // Speed rush effect

      // Adjust wind filter frequency based on speed
      if (this.skydiveWindFilter) {
        const windFreq = 200 + speed * 800; // 200Hz to 1000Hz based on speed
        this.skydiveWindFilter.frequency.value = windFreq;
      }

      // Adjust rush filter frequency based on speed
      if (this.rushFilter) {
        const rushFreq = 1500 + speed * 1000; // 1500Hz to 2500Hz based on speed
        this.rushFilter.frequency.value = rushFreq;
      }
    } else {
      // Normal space audio profile
      targetSpace = 0.08;
      targetWind = 0.0;
      targetSkydiveWind = 0.0;
      targetAtmosphere = 0.0;
      targetRush = 0.0;
    }

    // Apply ducking (e.g., when map overlay is visible)
    this.targetSpace = targetSpace * this.duckMultiplier;
    this.targetWind = targetWind * this.duckMultiplier;
    this.targetSkydiveWind = targetSkydiveWind * this.duckMultiplier;
    this.targetAtmosphere = targetAtmosphere * this.duckMultiplier;
    this.targetRush = targetRush * this.duckMultiplier;

    // Smoothly approach targets
    const now = this.ctx.currentTime;
    const dt = Math.min(0.1, Math.max(0.016, now - this.lastUpdate));
    this.lastUpdate = now;

    const lerp = (a, b, t) => a + (b - a) * t;
    const k = 1.2 * dt; // smoothing speed
    const desiredSpace = this.muted ? 0 : this.targetSpace;
    const desiredWind = this.muted ? 0 : this.targetWind;
    const desiredSkydiveWind = this.muted ? 0 : this.targetSkydiveWind;
    const desiredAtmosphere = this.muted ? 0 : this.targetAtmosphere;
    const desiredRush = this.muted ? 0 : this.targetRush;

    this.spaceGain.gain.value = lerp(
      this.spaceGain.gain.value,
      desiredSpace,
      k
    );
    this.windGain.gain.value = lerp(this.windGain.gain.value, desiredWind, k);
    this.skydiveWindGain.gain.value = lerp(
      this.skydiveWindGain.gain.value,
      desiredSkydiveWind,
      k
    );
    this.atmosphereGain.gain.value = lerp(
      this.atmosphereGain.gain.value,
      desiredAtmosphere,
      k
    );
    this.rushGain.gain.value = lerp(this.rushGain.gain.value, desiredRush, k);
  }

  setMapImmersive(isVisible) {
    // Change profile when map is visible: lighter hum, almost no wind
    this.duckMultiplier = isVisible ? 0.6 : 1.0;
    if (this.ctx && this.spaceFilter) {
      const targetCutoff = isVisible ? 90 : 120;
      this.spaceFilter.frequency.cancelScheduledValues(this.ctx.currentTime);
      this.spaceFilter.frequency.linearRampToValueAtTime(
        targetCutoff,
        this.ctx.currentTime + 0.3
      );
    }
    if (this.ctx && this.lfoGain) {
      const targetLfo = isVisible ? 6 : 10;
      this.lfoGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.lfoGain.gain.linearRampToValueAtTime(
        targetLfo,
        this.ctx.currentTime + 0.3
      );
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      // Smoothly ramp down
      if (this.spaceGain)
        this.spaceGain.gain.linearRampToValueAtTime(
          0,
          this.ctx.currentTime + 0.2
        );
      if (this.windGain)
        this.windGain.gain.linearRampToValueAtTime(
          0,
          this.ctx.currentTime + 0.2
        );
    }
    console.log(
      this.muted
        ? "Audio muted (press M to unmute)"
        : "Audio unmuted (press M to mute)"
    );
  }

  dispose() {
    try {
      if (this.sourcesStarted) {
        this.spaceOsc?.stop();
        this.windNoise?.stop();
        this.skydiveWindNoise?.stop();
        this.atmosphereOsc?.stop();
        this.rushNoise?.stop();
        this.lfo?.stop();
      }
      this.ctx?.close();
    } catch (e) {
      // no-op
    }

    // Clean up event listeners
    this._removeAudioListeners();

    this.ctx = null;
    this.sourcesStarted = false;
  }
}

window.AudioController = AudioController;