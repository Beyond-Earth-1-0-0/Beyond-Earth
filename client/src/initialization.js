// src/initialization.js

/**
 * Clean initialization without loading screens or explore buttons
 * Just sets up the UI and starts the experience immediately
 */

import { resumeAudioContext } from './utilities/audio-utils.js';

// Global initialization flag
let initialized = false;

/**
 * Initialize the exoplanet explorer
 */
export function initializeExplorer() {
    if (initialized) return;
    initialized = true;

    console.log('Initializing Exoplanet Explorer...');

    // Enable audio context on first user interaction
    setupAudioContext();

    // Add global event listeners
    setupGlobalEventListeners();

    // Setup audio indicators
    setupAudioIndicators();

    console.log('Explorer initialization complete');
}

/**
 * Setup audio context activation
 */
function setupAudioContext() {
    const enableAudio = () => {
        resumeAudioContext().then(() => {
            console.log('Audio context activated');
            showAudioIndicator();
        }).catch(err => {
            console.warn('Audio context failed to activate:', err);
        });
    };

    // Enable audio on first user interaction
    document.addEventListener('click', enableAudio, { once: true });
    document.addEventListener('keydown', enableAudio, { once: true });
}

/**
 * Setup global event listeners
 */
function setupGlobalEventListeners() {
    // Handle window focus/blur for better control management
    window.addEventListener('focus', () => {
        console.log('Window focused - exploration active');
    });

    window.addEventListener('blur', () => {
        console.log('Window blurred - pausing controls');
        // Exit pointer lock when window loses focus
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
    });

    // Handle window resize
    window.addEventListener('resize', handleWindowResize);

    // Error handling
    window.addEventListener('error', (event) => {
        console.error('Application error:', event.error);
    });

    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
    });
}

/**
 * Handle window resize
 */
function handleWindowResize() {
    // This will be called by the main scene controller
    const event = new CustomEvent('exoplanet-resize');
    window.dispatchEvent(event);
}

/**
 * Setup audio indicators
 */
function setupAudioIndicators() {
    // Listen for audio events and show indicator
    window.addEventListener('travel-sound', showAudioIndicator);
    window.addEventListener('arrival-sound', showAudioIndicator);
    window.addEventListener('scan-sound', showAudioIndicator);
}

/**
 * Show audio activity indicator
 */
function showAudioIndicator() {
    const indicator = document.getElementById('audio-indicator');
    if (indicator) {
        indicator.classList.add('active');
        setTimeout(() => {
            indicator.classList.remove('active');
        }, 3000);
    }
}

/**
 * Check if explorer is initialized
 */
export function isInitialized() {
    return initialized;
}