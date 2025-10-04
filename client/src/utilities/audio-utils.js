// src/utilities/audio-utils.js

let audioContext = null;
let masterGain = null;
let isAudioEnabled = false;

/**
 * Initialize and resume audio context
 * @returns {Promise<boolean>} Success status
 */
export async function resumeAudioContext() {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            masterGain = audioContext.createGain();
            masterGain.connect(audioContext.destination);
            masterGain.gain.setValueAtTime(0.3, audioContext.currentTime);
        }

        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        isAudioEnabled = true;
        console.log('Audio context resumed successfully');
        return true;
    } catch (error) {
        console.error('Failed to resume audio context:', error);
        return false;
    }
}

/**
 * Play UI beep/chime sound for HUD open
 */
export function playUIBeepSound() {
    if (!audioContext || !isAudioEnabled) return;

    const duration = 0.4;
    const now = audioContext.currentTime;

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.connect(gain);
    gain.connect(masterGain);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, now);
    osc.frequency.exponentialRampToValueAtTime(1500, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(800, now + duration);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc.start(now);
    osc.stop(now + duration);

    // Dispatch audio event
    window.dispatchEvent(new CustomEvent('audio-event'));

    console.log('Playing UI beep sound');
}

/**
 * Play futuristic planet scan sound
 */
export function playPlanetScanSound() {
    if (!audioContext || !isAudioEnabled) return;

    const duration = 1.2;
    const now = audioContext.currentTime;

    // Primary scanning frequency
    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();

    // Secondary harmonic
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();

    // Filter for sci-fi effect
    const filter = audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.Q.setValueAtTime(5, now);

    // Connect audio graph
    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(filter);
    gain2.connect(filter);
    filter.connect(masterGain);

    // Configure oscillators
    osc1.type = 'sine';
    osc2.type = 'sawtooth';

    // Frequency sweep for scanning effect
    osc1.frequency.setValueAtTime(400, now);
    osc1.frequency.exponentialRampToValueAtTime(1200, now + 0.5);
    osc1.frequency.exponentialRampToValueAtTime(200, now + duration);

    osc2.frequency.setValueAtTime(800, now);
    osc2.frequency.exponentialRampToValueAtTime(600, now + 0.3);
    osc2.frequency.exponentialRampToValueAtTime(400, now + duration);

    // Envelope
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.3, now + 0.1);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + duration);

    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.15, now + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + duration);

    // Filter sweep
    filter.frequency.exponentialRampToValueAtTime(1500, now + 0.4);
    filter.frequency.exponentialRampToValueAtTime(300, now + duration);

    // Start and stop
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration);
    osc2.stop(now + duration);

    // Dispatch audio event
    window.dispatchEvent(new CustomEvent('audio-event'));

    console.log('Playing planet scan sound');
}

/**
 * Play travel/warp sound
 */
export function playTravelSound() {
    if (!audioContext || !isAudioEnabled) return;

    const duration = 2.0;
    const now = audioContext.currentTime;

    // Main engine sound
    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();

    // High-frequency detail
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();

    // Noise for engine texture
    const noiseBuffer = createNoiseBuffer(0.5);
    const noiseSource = audioContext.createBufferSource();
    const noiseGain = audioContext.createGain();

    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    // Filter for engine rumble
    const lowpass = audioContext.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(200, now);
    lowpass.frequency.exponentialRampToValueAtTime(800, now + duration);

    // Connect audio graph
    osc1.connect(gain1);
    osc2.connect(gain2);
    noiseSource.connect(noiseGain);
    gain1.connect(lowpass);
    gain2.connect(lowpass);
    noiseGain.connect(lowpass);
    lowpass.connect(masterGain);

    // Configure oscillators
    osc1.type = 'sawtooth';
    osc2.type = 'sine';

    // Engine ramp-up
    osc1.frequency.setValueAtTime(60, now);
    osc1.frequency.exponentialRampToValueAtTime(200, now + duration * 0.8);
    osc1.frequency.exponentialRampToValueAtTime(80, now + duration);

    osc2.frequency.setValueAtTime(120, now);
    osc2.frequency.exponentialRampToValueAtTime(400, now + duration * 0.6);
    osc2.frequency.exponentialRampToValueAtTime(150, now + duration);

    // Volume envelopes
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.4, now + 0.3);
    gain1.gain.linearRampToValueAtTime(0.3, now + duration * 0.8);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + duration);

    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.2, now + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + duration);

    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.1, now + 0.1);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    // Start and stop
    osc1.start(now);
    osc2.start(now);
    noiseSource.start(now);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
    noiseSource.stop(now + duration);

    // Dispatch audio event
    window.dispatchEvent(new CustomEvent('audio-event'));

    console.log('Playing travel sound');
}

/**
 * Play target acquisition sound
 */
export function playTargetSound() {
    if (!audioContext || !isAudioEnabled) return;

    const duration = 0.3;
    const now = audioContext.currentTime;

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.connect(gain);
    gain.connect(masterGain);

    osc.type = 'square';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.1);
    osc.frequency.exponentialRampToValueAtTime(700, now + duration);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc.start(now);
    osc.stop(now + duration);
}

/**
 * Play arrival sound
 */
export function playArrivalSound() {
    if (!audioContext || !isAudioEnabled) return;

    const duration = 1.0;
    const now = audioContext.currentTime;

    // Harmonic chord
    const frequencies = [300, 400, 500];
    const oscillators = [];
    const gains = [];

    frequencies.forEach((freq, i) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.connect(gain);
        gain.connect(masterGain);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        osc.start(now);
        osc.stop(now + duration);

        oscillators.push(osc);
        gains.push(gain);
    });

    // Dispatch audio event
    window.dispatchEvent(new CustomEvent('audio-event'));

    console.log('Playing arrival sound');
}

/**
 * Create noise buffer for engine texture
 * @param {number} duration - Buffer duration in seconds
 * @returns {AudioBuffer} Noise buffer
 */
function createNoiseBuffer(duration) {
    const sampleRate = audioContext.sampleRate;
    const bufferLength = sampleRate * duration;
    const buffer = audioContext.createBuffer(1, bufferLength, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferLength; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    return buffer;
}

/**
 * Set master volume
 * @param {number} volume - Volume level (0-1)
 */
export function setMasterVolume(volume) {
    if (masterGain) {
        masterGain.gain.setValueAtTime(
            Math.max(0, Math.min(1, volume)),
            audioContext.currentTime
        );
    }
}

/**
 * Check if audio is enabled
 * @returns {boolean} Audio status
 */
export function isAudioActive() {
    return isAudioEnabled && audioContext && audioContext.state === 'running';
}

/**
 * Cleanup audio resources
 */
export function disposeAudio() {
    if (audioContext) {
        audioContext.close();
        audioContext = null;
        masterGain = null;
        isAudioEnabled = false;
        console.log('Audio context disposed');
    }
}