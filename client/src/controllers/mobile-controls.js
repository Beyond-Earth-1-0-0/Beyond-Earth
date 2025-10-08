// client/src/controllers/mobile-controls.js
class MobileControls {
    constructor() {
        console.log("MobileControls constructor called");
        this.isMobile = this.detectMobile();
        console.log("Is mobile device:", this.isMobile);

        this.joystickActive = false;
        this.joystickData = { x: 0, y: 0 };

        this.init();
    }

    detectMobile() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
            || (window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
        console.log("Mobile detection result:", isMobile);
        return isMobile;
    }

    init() {
        console.log("MobileControls init called, isMobile:", this.isMobile);

        if (this.isMobile) {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.setupMobileUI();
                });
            } else {
                this.setupMobileUI();
            }
        } else {
            console.log("Not mobile device, skipping mobile controls setup");
        }
    }

    setupMobileUI() {
        console.log("Setting up mobile UI...");
        this.createMobileButtons();
        this.createMobileJoysticks();
        this.setupHelpMenuToggle();
        this.hideDesktopControls();
        console.log("Mobile UI setup complete");
    }

    createMobileButtons() {
        console.log("Creating mobile buttons...");
        const buttonsContainer = document.getElementById('mobile-controls');

        if (!buttonsContainer) {
            console.warn("mobile-controls container not found in DOM");
            return;
        }

        if (buttonsContainer.children.length > 0) {
            console.log("Mobile buttons already exist");
            return;
        }

        buttonsContainer.innerHTML = `
            <div class="button-row top-col">
                <div id="toggle-help" class="mobile-button" title="Help">?</div>
                <div id="toggle-info" class="mobile-button" title="Info">i</div>
                <div id="target-btn" class="mobile-button" title="Target">T</div>
            </div>
            <div id="dpad-container">
                <div id="btn-up" class="mobile-button control-btn" title="Move Forward">▲</div>
                <div id="btn-down" class="mobile-button control-btn" title="Move Backward">▼</div>
                <div id="btn-left" class="mobile-button control-btn" title="Move Left">◄</div>
                <div id="btn-right" class="mobile-button control-btn" title="Move Right">►</div>
            </div>
            <div class="button-row bottom-row">
                <div id="btn-roll-left" class="mobile-button control-btn" title="Roll Left">↶</div>
                <div id="btn-roll-right" class="mobile-button control-btn" title="Roll Right">↷</div>
            </div>
        `;

        console.log("Mobile buttons created");
        this.setupButtonListeners();
        this.setupControlButtons();
    }

    setupButtonListeners() {
        const helpBtn = document.getElementById('toggle-help');
        if (helpBtn) {
            helpBtn.addEventListener('click', () => {
                console.log("Help button clicked");
                const controlsOverlay = document.getElementById('controls-overlay');
                if (controlsOverlay) {
                    controlsOverlay.classList.toggle('mobile-visible');
                }
            });
        }
    }

    setupControlButtons() {
        // Setup control buttons with press/release
        const buttonMap = {
            'btn-up': 'forward',
            'btn-down': 'backward',
            'btn-left': 'left',
            'btn-right': 'right',
            'btn-roll-left': 'rollLeft',
            'btn-roll-right': 'rollRight'
        };

        Object.keys(buttonMap).forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                const buttonName = buttonMap[btnId];

                // Touch events
                btn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    btn.classList.add('active');
                    this.dispatchButtonEvent(buttonName, true);
                }, { passive: false });

                btn.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    btn.classList.remove('active');
                    this.dispatchButtonEvent(buttonName, false);
                }, { passive: false });

                // Mouse events for testing
                btn.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    btn.classList.add('active');
                    this.dispatchButtonEvent(buttonName, true);
                });

                btn.addEventListener('mouseup', (e) => {
                    e.preventDefault();
                    btn.classList.remove('active');
                    this.dispatchButtonEvent(buttonName, false);
                });

                btn.addEventListener('mouseleave', () => {
                    btn.classList.remove('active');
                    this.dispatchButtonEvent(buttonName, false);
                });

                console.log(`Control button ${btnId} setup complete`);
            }
        });
    }

    dispatchButtonEvent(button, pressed) {
        const event = new CustomEvent('mobileButton', {
            detail: { button, pressed }
        });
        window.dispatchEvent(event);
        console.log(`Button ${button}: ${pressed ? 'pressed' : 'released'}`);
    }

    createMobileJoysticks() {
        console.log("Creating mobile joysticks...");
        const joystickBase = document.getElementById('joystick-base');

        if (!joystickBase) {
            console.warn("Joystick element not found in DOM");
            return;
        }

        console.log("Joystick element found, setting up listeners");
        this.setupJoystickListeners();
    }

    setupJoystickListeners() {
        const joystickBase = document.getElementById('joystick-base');
        const joystickHandle = document.getElementById('joystick-handle');

        if (joystickBase && joystickHandle) {
            console.log("Setting up movement joystick");
            this.setupJoystick(joystickBase, joystickHandle, 'joystick');
        } else {
            console.warn("Movement joystick elements missing");
        }
    }

    setupJoystick(base, handle, type) {
        console.log(`Setting up ${type} joystick`);
        let active = false;
        let startPos = { x: 0, y: 0 };
        let currentPos = { x: 0, y: 0 };
        let maxDistance = 0;

        const handleStart = (e) => {
            e.preventDefault();
            active = true;
            handle.classList.add('active');
            maxDistance = base.offsetWidth / 2 - handle.offsetWidth / 2;
            const touch = e.touches ? e.touches[0] : e;
            const rect = base.getBoundingClientRect();
            startPos = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };
            console.log(`${type} joystick activated`);
        };

        const handleMove = (e) => {
            if (!active) return;
            e.preventDefault();
            if (maxDistance <= 0) return;
            const touch = e.touches ? e.touches[0] : e;
            let deltaX = touch.clientX - startPos.x;
            let deltaY = touch.clientY - startPos.y;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            if (distance > maxDistance) {
                const angle = Math.atan2(deltaY, deltaX);
                deltaX = Math.cos(angle) * maxDistance;
                deltaY = Math.sin(angle) * maxDistance;
            }

            currentPos = { x: deltaX, y: deltaY };
            handle.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;

            const normalizedX = deltaX / maxDistance;
            const normalizedY = deltaY / maxDistance;

            if (type === 'joystick') {
                this.joystickData = { x: normalizedX, y: -normalizedY };
                this.updateMovement();
            }
        };

        const handleEnd = (e) => {
            if (!active) return;
            e.preventDefault();
            active = false;
            handle.classList.remove('active');
            handle.style.transform = 'translate(-50%, -50%)';
            currentPos = { x: 0, y: 0 };

            if (type === 'joystick') {
                this.joystickData = { x: 0, y: 0 };
                this.updateMovement();
            }
            console.log(`${type} joystick deactivated`);
        };

        base.addEventListener('touchstart', handleStart, { passive: false });
        document.addEventListener('touchmove', handleMove, { passive: false });
        document.addEventListener('touchend', handleEnd, { passive: false });

        base.addEventListener('mousedown', handleStart);
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleEnd);

        console.log(`${type} joystick event listeners attached`);
    }

    updateMovement() {
        const event = new CustomEvent('mobileMovement', { detail: this.joystickData });
        window.dispatchEvent(event);
        if (Math.abs(this.joystickData.x) > 0.1 || Math.abs(this.joystickData.y) > 0.1) {
            console.log("Movement:", this.joystickData);
        }
    }

    setupHelpMenuToggle() {
        const controlsOverlay = document.getElementById('controls-overlay');
        if (controlsOverlay) {
            controlsOverlay.classList.add('mobile-hidden');
            if (!controlsOverlay.querySelector('.mobile-close')) {
                const closeBtn = document.createElement('button');
                closeBtn.className = 'mobile-close';
                closeBtn.innerHTML = '×';
                closeBtn.addEventListener('click', () => {
                    controlsOverlay.classList.remove('mobile-visible');
                });
                controlsOverlay.insertBefore(closeBtn, controlsOverlay.firstChild);
            }
        }

        const instructions = document.getElementById('instructions');
        if (instructions) {
            instructions.classList.add('mobile-hidden');
        }

        const cockpitHud = document.querySelector('.cockpit-hud');
        if (cockpitHud) {
            cockpitHud.classList.add('mobile-hidden');
        }
    }

    hideDesktopControls() {
        document.body.classList.add('mobile-mode');
        console.log("Desktop controls hidden, mobile mode activated");
    }

    getMovementData() {
        return this.joystickData;
    }
}

console.log("mobile-controls.js loaded, document state:", document.readyState);

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log("DOM loaded, creating MobileControls instance");
        window.mobileControls = new MobileControls();
    });
} else {
    console.log("DOM already loaded, creating MobileControls instance immediately");
    window.mobileControls = new MobileControls();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileControls;
}