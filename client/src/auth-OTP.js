import * as THREE from "three";
import { StarField } from './utilities/star-field.js';

class AuthOTPApp {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.starField = null;
        this.apiBase = "http://127.0.0.1:5500";
    }

    init() {
        // Initialize Three.js scene for the star field
        try {
            this.initThreeJS();
            this.starField = new StarField(this.scene);
            this.starField.init();
            this.animate();
        } catch (error) {
            console.warn("Failed to initialize star field:", error);
        }

        // Setup all UI event listeners
        this.setupEventListeners();
    }

    initThreeJS() {
        const canvas = document.getElementById("starfield-canvas");
        if (!canvas) {
            throw new Error('Canvas element with id "starfield-canvas" not found');
        }

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            5000
        );
        this.camera.position.z = 1000;

        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true,
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        if (this.starField) {
            this.starField.update();
        }
        this.renderer.render(this.scene, this.camera);
    }

    showFlash(message, type = "success") {
        const container = document.getElementById("flashContainer");
        container.innerHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>`;
        setTimeout(() => {
            container.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 100);
    }

    setButtonLoading(button, isLoading) {
        if (isLoading) {
            button.disabled = true;
            button.innerHTML += '<span class="spinner"></span>';
        } else {
            button.disabled = false;
            const spinner = button.querySelector(".spinner");
            if (spinner) spinner.remove();
        }
    }

    setupEventListeners() {
        // Window resize handler
        window.addEventListener("resize", () => {
            if (this.camera && this.renderer) {
                this.camera.aspect = window.innerWidth / window.innerHeight;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(window.innerWidth, window.innerHeight);
            }
        });

        // Send OTP form submission
        document.getElementById("otpForm").addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("email").value;
            const sendBtn = document.getElementById("sendOtpBtn");
            const originalHTML = sendBtn.innerHTML;

            try {
                this.setButtonLoading(sendBtn, true);
                const formData = new FormData();
                formData.append("email", email);
                const res = await fetch(`${this.apiBase}/send-otp`, {
                    method: "POST",
                    body: formData,
                });
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                const data = await res.json();
                this.showFlash(data.message, data.success ? "success" : "danger");
            } catch (err) {
                this.showFlash("Unable to send verification code. Please check your connection and try again.", "danger");
                console.error("Send OTP error:", err);
            } finally {
                sendBtn.innerHTML = originalHTML;
                this.setButtonLoading(sendBtn, false);
            }
        });

        // Verify OTP form submission
        document.getElementById("verifyForm").addEventListener("submit", async (e) => {
            e.preventDefault();
            const otp = document.getElementById("otp").value;
            const email = document.getElementById("email").value;

            try {
                const formData = new FormData();
                formData.append("otp", otp);
                formData.append("email", email);
                const res = await fetch(`${this.apiBase}/verify-otp`, {
                    method: "POST",
                    body: formData,
                });
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                const data = await res.json();
                this.showFlash(data.message, data.success ? "success" : "danger");
                if (data.success) {
                    sessionStorage.setItem("otpVerified", "true");
                    setTimeout(() => {
                        window.location.href = "./upload-dataset.html";
                    }, 2000);
                }
            } catch (err) {
                this.showFlash("Network error: " + err.message, "danger");
                console.error("Verify OTP error:", err);
            }
        });
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new AuthOTPApp();
    app.init();
});