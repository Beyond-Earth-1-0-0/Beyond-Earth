// client/src/controllers/planet-tutor-controller.js

class PlanetTutor {
	constructor() {
		console.log("Initializing Planet Tutor...");
		this.tutorElement = null;
		this.dialogElement = null;
		this.currentPlanet = null;
		this.isActive = false;
		this.chatSound = null;
		this.typewriterInterval = null;
		this.messageIndex = 0;
		this.messages = [];
		this.initialized = false;
		this.chatMode = false; // Track if we're in chat mode
		this.chatHistory = []; // Store conversation history

		// Initialize immediately since we're created after DOM ready
		this.init();
	}

	init() {
		console.log("Initializing Planet Tutor UI...");
		this.createTutorUI();
		this.createChatSound();
		this.initialized = true;
		console.log("Planet Tutor initialized successfully");
	}

	createTutorUI() {
		console.log("createTutorUI called - Starting UI creation...");

		if (document.getElementById("planet-tutor")) {
			this.tutorElement = document.getElementById("planet-tutor");
			return;
		}

		this.tutorElement = document.createElement("div");
		this.tutorElement.id = "planet-tutor";
		this.tutorElement.className = "planet-tutor hidden";

		this.tutorElement.innerHTML = `
        <div class="tutor-avatar">
            <img src="../assets/astro.gif" alt="Space Tutor" class="tutor-gif" onerror="this.style.display='none'">
        </div>
        <div class="tutor-dialog">
            <div class="dialog-header">
                <span class="tutor-name">ASTRO GUIDE</span>
                <button class="dialog-close" id="closeTutor"></button>
            </div>
            <div class="dialog-content" id="tutorMessage">
                Welcome, space explorer!
            </div>
            <div class="chat-input-container" id="chatInputContainer" style="display: none;">
                <div class="chat-input-wrapper">
                    <input type="text" id="chatInput" placeholder="Ask about ${this.currentPlanet?.name || 'this planet'}...">
                    <button class="dialog-btn" id="sendChatBtn">➤</button>
                </div>
            </div>
            <div class="dialog-footer" id="dialogFooter">
                <button class="dialog-btn" id="nextMessage">Next</button>
                <button class="dialog-btn secondary" id="skipTutor">Skip</button>
            </div>
        </div>
    `;

		document.body.appendChild(this.tutorElement);

		// Add event listeners
		const closeBtn = document.getElementById("closeTutor");
		const skipBtn = document.getElementById("skipTutor");
		const nextBtn = document.getElementById("nextMessage");
		const sendChatBtn = document.getElementById("sendChatBtn");
		const chatInput = document.getElementById("chatInput");

		if (closeBtn) closeBtn.addEventListener("click", () => this.hide());
		if (skipBtn) skipBtn.addEventListener("click", () => this.enterChatMode());
		if (nextBtn) nextBtn.addEventListener("click", () => this.showNextMessage());
		if (sendChatBtn) sendChatBtn.addEventListener("click", () => this.sendChatMessage());
		if (chatInput) {
			chatInput.addEventListener("keypress", (e) => {
				if (e.key === "Enter") this.sendChatMessage();
			});
			chatInput.addEventListener("focus", () => {
				console.log("Chat input focused, disabling controls.");
				window.dispatchEvent(new CustomEvent('chatFocusChange', { detail: { isChatting: true } }));
			});

			// Re-enable cockpit controls when not typing
			chatInput.addEventListener("blur", () => {
				console.log("Chat input blurred, enabling controls.");
				window.dispatchEvent(new CustomEvent('chatFocusChange', { detail: { isChatting: false } }));
			});
		}
	}

	createChatSound() {
		const AudioContext = window.AudioContext || window.webkitAudioContext;
		if (!AudioContext) {
			console.warn("Web Audio API not supported");
			return;
		}
		this.audioContext = new AudioContext();
	}

	playChatSound() {
		if (!this.audioContext) return;
		try {
			const oscillator = this.audioContext.createOscillator();
			const gainNode = this.audioContext.createGain();
			oscillator.connect(gainNode);
			gainNode.connect(this.audioContext.destination);
			oscillator.frequency.value = 800;
			oscillator.type = "sine";
			gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
			gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
			oscillator.start(this.audioContext.currentTime);
			oscillator.stop(this.audioContext.currentTime + 0.1);
		} catch (error) {
			console.warn("Could not play chat sound:", error);
		}
	}

	getPlanetStory(planetData) {
		const stories = {
			"Hot Jupiter": [`Welcome to ${planetData.name}! This massive gas giant orbits extremely close to its star.`, `The temperatures here can exceed 1000°C, hot enough to vaporize metals!`, `Despite the extreme heat, these planets are fascinating laboratories for studying atmospheric dynamics.`],
			"Super Earth": [`You've arrived at ${planetData.name}, a Super-Earth exoplanet!`, `These planets are larger than Earth but smaller than Neptune, with masses up to 10 times Earth's.`, `Some Super-Earths might have conditions suitable for life, making them prime targets in our search.`],
			"Neptune-like": [`This is ${planetData.name}, a Neptune-like ice giant!`, `These planets have thick atmospheres of hydrogen and helium surrounding icy cores.`, `Winds on Neptune-like planets can reach supersonic speeds of over 2,000 km/h!`],
			Terrestrial: [`Welcome to ${planetData.name}, a rocky terrestrial planet!`, `These Earth-like planets have solid surfaces and are prime candidates for habitability.`, `This planet could potentially harbor conditions similar to early Earth!`],
			"Gas Giant": [`You're now orbiting ${planetData.name}, a majestic gas giant!`, `These massive planets are mostly composed of hydrogen and helium with no solid surface.`, `Gas giants play a crucial role in shaping their solar systems' architecture.`],
			"Earth-like": [`Welcome to ${planetData.name}, an Earth-like world!`, `This planet shares similarities with our home world, making it incredibly interesting to study.`, `The conditions here might allow for liquid water on the surface!`],
		};
		const planetType = planetData.type || "Gas Giant";
		return stories[planetType] || stories["Gas Giant"];
	}

	show(planetData) {
		if (!this.initialized || !this.tutorElement) {
			console.error("Tutor UI not initialized yet!");
			this.init();
			setTimeout(() => this.show(planetData), 100);
			return;
		}
		if (this.isActive) return;

		this.currentPlanet = planetData;
		this.isActive = true;
		this.messageIndex = 0;
		this.chatMode = false;
		this.chatHistory = [];
		this.messages = this.getPlanetStory(planetData);

		if (this.audioContext && this.audioContext.state === "suspended") {
			this.audioContext.resume();
		}

		this.tutorElement.classList.remove("hidden");
		this.tutorElement.classList.add("active");

		this.showMessage(this.messages[0]);
	}

	showMessage(message) {
		const messageElement = document.getElementById("tutorMessage");
		if (!messageElement) return;
		messageElement.textContent = "";
		let charIndex = 0;
		if (this.typewriterInterval) clearInterval(this.typewriterInterval);

		this.typewriterInterval = setInterval(() => {
			if (charIndex < message.length) {
				messageElement.textContent += message[charIndex];
				charIndex++;
				if (charIndex % 3 === 0) this.playChatSound();
			} else {
				clearInterval(this.typewriterInterval);
				this.typewriterInterval = null;
			}
		}, 50);
	}

	showNextMessage() {
		this.messageIndex++;
		if (this.messageIndex < this.messages.length) {
			this.showMessage(this.messages[this.messageIndex]);
			this.playChatSound();
		} else {
			this.enterChatMode();
		}
		const nextBtn = document.getElementById("nextMessage");
		if (this.messageIndex >= this.messages.length - 1) {
			nextBtn.textContent = "Ask Questions";
		}
	}

	enterChatMode() {
		this.chatMode = true;
		const footer = document.getElementById("dialogFooter");
		if (footer) footer.style.display = "none";
		const chatContainer = document.getElementById("chatInputContainer");
		if (chatContainer) chatContainer.style.display = "block";
		const messageElement = document.getElementById("tutorMessage");
		if (messageElement) {
			if (this.typewriterInterval) clearInterval(this.typewriterInterval);
			messageElement.innerHTML = `<div class="chat-intro"><strong>Story Complete!</strong><br><span>Now you can ask me anything about ${this.currentPlanet.name}.</span></div>`;
		}
		const chatInput = document.getElementById("chatInput");
		if (chatInput) chatInput.focus();
	}

	async sendChatMessage() {
		const chatInput = document.getElementById("chatInput");
		if (!chatInput || !chatInput.value.trim()) return;

		const userMessage = chatInput.value.trim();
		this.addMessageToDisplay("You", userMessage, true);
		chatInput.value = "";
		this.addMessageToDisplay("ASTRO", "Thinking...", false, true);

		try {
			const response = await fetch("http://127.0.0.1:5000/api", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ message: userMessage, planet: this.currentPlanet.name }),
			});
			const data = await response.json();
			this.removeLoadingIndicator();
			this.addMessageToDisplay("ASTRO", data.content, false);
			this.playChatSound();
		} catch (error) {
			console.error("Error calling chatbot API:", error);
			this.removeLoadingIndicator();
			this.addMessageToDisplay("ASTRO", "I'm having trouble connecting. Please ensure the Flask server is running.", false);
		}
	}

	removeLoadingIndicator() {
		const loadingMsg = document.querySelector(".loading-message");
		if (loadingMsg) loadingMsg.remove();
	}

	addMessageToDisplay(sender, message, isUser, isLoading = false) {
		const messageElement = document.getElementById("tutorMessage");
		if (!messageElement) return;
		const msgDiv = document.createElement("div");
		msgDiv.className = `chat-message ${isUser ? 'user-message' : 'astro-message'} ${isLoading ? 'loading-message' : ''}`;
		msgDiv.innerHTML = `<strong>${sender}:</strong><br><span>${message}</span>`;
		messageElement.appendChild(msgDiv);
		messageElement.scrollTop = messageElement.scrollHeight;
	}

	hide() {
		if (!this.isActive) return;
		if (this.typewriterInterval) clearInterval(this.typewriterInterval);

		this.tutorElement.classList.remove("active");
		setTimeout(() => {
			this.tutorElement.classList.add("hidden");
			this.isActive = false;
			this.chatMode = false;
			this.currentPlanet = null;

			// Reset UI
			const footer = document.getElementById("dialogFooter");
			if (footer) footer.style.display = "flex";
			const chatContainer = document.getElementById("chatInputContainer");
			if (chatContainer) chatContainer.style.display = "none";
			const nextBtn = document.getElementById("nextMessage");
			if (nextBtn) nextBtn.textContent = "Next";
		}, 300);
	}

	isShowing() {
		return this.isActive;
	}
}

let planetTutor = null;

function getPlanetTutor() {
	if (!planetTutor) {
		planetTutor = new PlanetTutor();
	}
	return planetTutor;
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", () => {
		if (!planetTutor) planetTutor = new PlanetTutor();
	});
} else {
	if (!planetTutor) planetTutor = new PlanetTutor();
}

export { getPlanetTutor };