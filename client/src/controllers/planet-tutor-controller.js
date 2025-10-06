// controllers/planet-tutor-controller.js

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

    // Check if already exists
    if (document.getElementById("planet-tutor")) {
      console.log("Tutor UI already exists, reusing...");
      this.tutorElement = document.getElementById("planet-tutor");
      return;
    }

    // Create tutor container
    this.tutorElement = document.createElement("div");
    this.tutorElement.id = "planet-tutor";
    this.tutorElement.className = "planet-tutor hidden";
    this.tutorElement.style.cssText = `
          position: fixed;
          bottom: 20px;
          right: 20px;
          display: flex;
          gap: 15px;
          align-items: flex-end;
          z-index: 10000;
          transition: all 0.3s ease;
        `;

    this.tutorElement.innerHTML = `
                <div class="tutor-avatar" style="
                  width: 100px;
                  height: 100px;
                  background: rgba(0, 20, 40, 0.9);
                  border: 2px solid #00ffff;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  overflow: hidden;
                  box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
                ">
                    <img src="../assets/astro.gif" alt="Space Tutor" class="tutor-gif" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'">
                </div>
                <div class="tutor-dialog" style="
                  background: rgba(0, 20, 40, 0.95);
                  border: 2px solid #00ffff;
                  border-radius: 15px;
                  padding: 0;
                  min-width: 400px;
                  max-width: 500px;
                  box-shadow: 0 0 30px rgba(0, 255, 255, 0.3);
                  backdrop-filter: blur(10px);
                  overflow: hidden;
                ">
                    <div class="dialog-header" style="
                      background: linear-gradient(135deg, #001a33, #003366);
                      padding: 15px 20px;
                      display: flex;
                      justify-content: space-between;
                      align-items: center;
                      border-bottom: 1px solid #00ffff;
                    ">
                        <span class="tutor-name" style="
                          color: #00ffff;
                          font-family: 'Orbitron', 'Courier New', monospace;
                          font-weight: bold;
                          font-size: 16px;
                          text-shadow: 0 0 10px rgba(0, 255, 255, 0.8);
                          letter-spacing: 2px;
                        ">ASTRO GUIDE</span>
                        <button class="dialog-close" id="closeTutor" style="
                          background: transparent;
                          border: none;
                          color: #00ffff;
                          font-size: 24px;
                          cursor: pointer;
                          width: 30px;
                          height: 30px;
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          border-radius: 50%;
                          transition: all 0.2s;
                        ">×</button>
                    </div>
                    <div class="dialog-content" id="tutorMessage" style="
                      padding: 20px;
                      color: #ffffff;
                      font-family: 'Arial', sans-serif;
                      font-size: 16px;
                      line-height: 1.6;
                      min-height: 100px;
                      max-height: 300px;
                      overflow-y: auto;
                    ">
                        Welcome, space explorer!
                    </div>
                    <div class="chat-input-container" id="chatInputContainer" style="
                      display: none;
                      padding: 15px 20px;
                      border-top: 1px solid rgba(0, 255, 255, 0.3);
                      background: rgba(0, 10, 20, 0.5);
                    ">
                        <div style="display: flex; gap: 10px;">
                            <input type="text" id="chatInput" placeholder="Ask me anything about this planet..." style="
                              flex: 1;
                              padding: 10px;
                              background: rgba(0, 20, 40, 0.8);
                              border: 1px solid #00ffff;
                              border-radius: 5px;
                              color: #ffffff;
                              font-family: 'Arial', sans-serif;
                              font-size: 14px;
                            ">
                            <button class="dialog-btn" id="sendChatBtn" style="
                              padding: 10px 20px;
                              background: linear-gradient(135deg, #00ffff, #0088ff);
                              color: #001a33;
                              border: none;
                              border-radius: 5px;
                              font-family: 'Orbitron', 'Arial', sans-serif;
                              font-weight: bold;
                              font-size: 14px;
                              cursor: pointer;
                              transition: all 0.3s;
                              box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
                            ">Send</button>
                        </div>
                    </div>
                    <div class="dialog-footer" id="dialogFooter" style="
                      padding: 15px 20px;
                      display: flex;
                      gap: 10px;
                      justify-content: flex-end;
                      border-top: 1px solid rgba(0, 255, 255, 0.3);
                      background: rgba(0, 10, 20, 0.5);
                    ">
                        <button class="dialog-btn" id="nextMessage" style="
                          padding: 10px 20px;
                          background: linear-gradient(135deg, #00ffff, #0088ff);
                          color: #001a33;
                          border: none;
                          border-radius: 5px;
                          font-family: 'Orbitron', 'Arial', sans-serif;
                          font-weight: bold;
                          font-size: 14px;
                          cursor: pointer;
                          transition: all 0.3s;
                          box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
                        ">Next</button>
                        <button class="dialog-btn secondary" id="skipTutor" style="
                          padding: 10px 20px;
                          background: transparent;
                          border: 2px solid #00ffff;
                          color: #00ffff;
                          border-radius: 5px;
                          font-family: 'Orbitron', 'Arial', sans-serif;
                          font-weight: bold;
                          font-size: 14px;
                          cursor: pointer;
                          transition: all 0.3s;
                        ">Skip</button>
                    </div>
                </div>
            `;

    document.body.appendChild(this.tutorElement);
    console.log(
      "Tutor UI element created and appended to body:",
      this.tutorElement
    );

    // Add event listeners
    const closeBtn = document.getElementById("closeTutor");
    const skipBtn = document.getElementById("skipTutor");
    const nextBtn = document.getElementById("nextMessage");
    const sendChatBtn = document.getElementById("sendChatBtn");
    const chatInput = document.getElementById("chatInput");

    console.log("Buttons found:", { closeBtn, skipBtn, nextBtn, sendChatBtn });

    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        console.log("Close button clicked");
        this.hide();
      });
    }

    if (skipBtn) {
      skipBtn.addEventListener("click", () => {
        console.log("Skip button clicked");
        this.enterChatMode();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        console.log("Next button clicked");
        this.showNextMessage();
      });
    }

    if (sendChatBtn) {
      sendChatBtn.addEventListener("click", () => {
        this.sendChatMessage();
      });
    }

    if (chatInput) {
      chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.sendChatMessage();
        }
      });
    }

    console.log("Event listeners attached successfully");
  }

  createChatSound() {
    // Create a simple chat beep sound using Web Audio API
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      console.warn("Web Audio API not supported");
      return;
    }

    this.audioContext = new AudioContext();
    console.log("Audio context created");
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
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + 0.1
      );

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.1);
    } catch (error) {
      console.warn("Could not play chat sound:", error);
    }
  }

  getPlanetStory(planetData) {
    console.log("Getting planet story for:", planetData);
    const stories = {
      // Default stories based on planet types
      "Hot Jupiter": [
        `Welcome to ${planetData.name}! This massive gas giant orbits extremely close to its star.`,
        `The temperatures here can exceed 1000°C, hot enough to vaporize metals!`,
        `Despite the extreme heat, these planets are fascinating laboratories for studying atmospheric dynamics.`,
        `Interestingly, Hot Jupiters are thought to have migrated inward from cooler regions of their solar systems.`,
      ],
      "Super Earth": [
        `You've arrived at ${planetData.name}, a Super-Earth exoplanet!`,
        `These planets are larger than Earth but smaller than Neptune, with masses up to 10 times Earth's.`,
        `Some Super-Earths might have conditions suitable for life, making them prime targets in our search.`,
        `The gravity here would be significantly stronger than what you're used to on Earth!`,
      ],
      "Neptune-like": [
        `This is ${planetData.name}, a Neptune-like ice giant!`,
        `These planets have thick atmospheres of hydrogen and helium surrounding icy cores.`,
        `Winds on Neptune-like planets can reach supersonic speeds of over 2,000 km/h!`,
        `The beautiful blue color comes from methane in the atmosphere absorbing red light.`,
      ],
      Terrestrial: [
        `Welcome to ${planetData.name}, a rocky terrestrial planet!`,
        `These Earth-like planets have solid surfaces and are prime candidates for habitability.`,
        `Terrestrial planets form in the inner regions of solar systems where it's warm enough for rocky materials.`,
        `This planet could potentially harbor conditions similar to early Earth!`,
      ],
      "Gas Giant": [
        `You're now orbiting ${planetData.name}, a majestic gas giant!`,
        `These massive planets are mostly composed of hydrogen and helium with no solid surface.`,
        `Gas giants play a crucial role in shaping their solar systems' architecture.`,
        `The powerful magnetic fields here would put Earth's to shame!`,
      ],
      "Earth-like": [
        `Welcome to ${planetData.name}, an Earth-like world!`,
        `This planet shares similarities with our home world, making it incredibly interesting to study.`,
        `Scientists are particularly excited about planets like this in the search for extraterrestrial life.`,
        `The conditions here might allow for liquid water on the surface!`,
      ],
    };

    // Get planet type or use default
    const planetType = planetData.type || "Gas Giant";
    const story = stories[planetType] || stories["Gas Giant"];

    // Add specific planet data
    const customStory = [...story];

    if (planetData.distance) {
      customStory.push(
        `This world is located ${planetData.distance} from Earth.`
      );
    }

    if (planetData.radius) {
      customStory.push(`Its radius is approximately ${planetData.radius}.`);
    }

    console.log("Generated story with", customStory.length, "messages");
    return customStory;
  }

  show(planetData) {
    console.log("=== SHOW METHOD CALLED ===");
    console.log("Planet data received:", planetData);
    console.log("Tutor initialized?", this.initialized);
    console.log("Tutor element exists?", this.tutorElement);
    console.log("Is active?", this.isActive);

    // Make sure UI is initialized
    if (!this.initialized || !this.tutorElement) {
      console.error("Tutor UI not initialized yet!");
      // Try to initialize now
      this.init();
      // Wait a bit and try again
      setTimeout(() => this.show(planetData), 100);
      return;
    }

    if (this.isActive) {
      console.log("Tutor already active, skipping");
      return;
    }

    this.currentPlanet = planetData;
    this.isActive = true;
    this.messageIndex = 0;
    this.chatMode = false;
    this.chatHistory = [];
    this.messages = this.getPlanetStory(planetData);

    console.log("Messages prepared:", this.messages);

    // Resume audio context if needed
    if (this.audioContext && this.audioContext.state === "suspended") {
      this.audioContext.resume();
      console.log("Audio context resumed");
    }

    // Show tutor - FORCE visibility with inline styles
    console.log("Showing tutor element...");

    this.tutorElement.classList.remove("hidden");
    this.tutorElement.classList.add("active");

    // Force display with inline styles
    this.tutorElement.style.display = "flex";
    this.tutorElement.style.opacity = "1";
    this.tutorElement.style.transform = "translateY(0)";
    this.tutorElement.style.pointerEvents = "all";
    this.tutorElement.style.visibility = "visible";

    console.log("Tutor element should now be visible");

    // Show first message with typewriter effect
    console.log("Showing first message");
    this.showMessage(this.messages[0]);
  }

  showMessage(message) {
    console.log("Showing message:", message);
    const messageElement = document.getElementById("tutorMessage");
    if (!messageElement) {
      console.error("Message element not found!");
      return;
    }

    messageElement.textContent = "";

    let charIndex = 0;

    // Clear any existing interval
    if (this.typewriterInterval) {
      clearInterval(this.typewriterInterval);
    }

    this.typewriterInterval = setInterval(() => {
      if (charIndex < message.length) {
        messageElement.textContent += message[charIndex];
        charIndex++;

        // Play sound every few characters
        if (charIndex % 3 === 0) {
          this.playChatSound();
        }
      } else {
        clearInterval(this.typewriterInterval);
        this.typewriterInterval = null;
      }
    }, 50);
  }

  showNextMessage() {
    console.log("Show next message called, current index:", this.messageIndex);
    this.messageIndex++;

    if (this.messageIndex < this.messages.length) {
      this.showMessage(this.messages[this.messageIndex]);
      this.playChatSound();
    } else {
      // End of messages - enter chat mode
      console.log("Story finished, entering chat mode");
      this.enterChatMode();
    }

    // Update button text
    const nextBtn = document.getElementById("nextMessage");
    if (this.messageIndex >= this.messages.length - 1) {
      nextBtn.textContent = "Ask Questions";
    }
  }

  enterChatMode() {
    console.log("Entering chat mode");
    this.chatMode = true;

    // Hide story navigation buttons
    const footer = document.getElementById("dialogFooter");
    if (footer) {
      footer.style.display = "none";
    }

    // Show chat input
    const chatContainer = document.getElementById("chatInputContainer");
    if (chatContainer) {
      chatContainer.style.display = "block";
    }

    // Show welcome message for chat
    const messageElement = document.getElementById("tutorMessage");
    if (messageElement) {
      // Clear typewriter interval
      if (this.typewriterInterval) {
        clearInterval(this.typewriterInterval);
      }

      messageElement.innerHTML = `
            <div style="margin-bottom: 10px; padding: 10px; background: rgba(0, 255, 255, 0.1); border-radius: 5px;">
              <strong style="color: #00ffff;">Story Complete!</strong><br>
              <span style="color: #aaa; font-size: 14px;">Now you can ask me anything about ${this.currentPlanet.name} or exoplanets in general!</span>
            </div>
          `;
    }

    // Focus input
    const chatInput = document.getElementById("chatInput");
    if (chatInput) {
      chatInput.focus();
    }
  }

  async sendChatMessage() {
    const chatInput = document.getElementById("chatInput");
    const messageElement = document.getElementById("tutorMessage");

    if (!chatInput || !messageElement) return;

    const userMessage = chatInput.value.trim();
    if (!userMessage) return;

    // Add user message to display
    this.addMessageToDisplay("You", userMessage, true);
    chatInput.value = "";

    // Show loading indicator
    this.addMessageToDisplay("ASTRO", "Thinking...", false, true);

    try {
      // Call your Flask API
      const response = await fetch("http://127.0.0.1:5000/api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          planet: this.currentPlanet.name,
        }),
      });

      const data = await response.json();

      // Remove loading indicator
      const loadingMsg = messageElement.querySelector(".loading-message");
      if (loadingMsg) {
        loadingMsg.remove();
      }

      // Add bot response
      this.addMessageToDisplay("ASTRO", data.content, false);
      this.playChatSound();
    } catch (error) {
      console.error("Error calling chatbot API:", error);

      // Remove loading indicator
      const loadingMsg = messageElement.querySelector(".loading-message");
      if (loadingMsg) {
        loadingMsg.remove();
      }

      // Fallback response
      this.addMessageToDisplay(
        "ASTRO",
        "I'm having trouble connecting to my knowledge base. Please make sure the Flask server is running on http://127.0.0.1:5000",
        false
      );
    }
  }

  addMessageToDisplay(sender, message, isUser, isLoading = false) {
    const messageElement = document.getElementById("tutorMessage");
    if (!messageElement) return;

    const msgDiv = document.createElement("div");
    msgDiv.className = isLoading ? "loading-message" : "";
    msgDiv.style.cssText = `
          margin-bottom: 10px;
          padding: 10px;
          background: ${isUser ? "rgba(0, 136, 255, 0.2)" : "rgba(0, 255, 255, 0.1)"
      };
          border-left: 3px solid ${isUser ? "#0088ff" : "#00ffff"};
          border-radius: 5px;
          animation: ${isLoading ? "pulse 1.5s infinite" : "none"};
        `;

    msgDiv.innerHTML = `
          <strong style="color: ${isUser ? "#0088ff" : "#00ffff"
      };">${sender}:</strong><br>
          <span style="color: #fff; font-size: 14px;">${message}</span>
        `;

    messageElement.appendChild(msgDiv);
    messageElement.scrollTop = messageElement.scrollHeight;
  }

  hide() {
    console.log("Hide method called");
    if (!this.isActive) {
      console.log("Tutor not active, skipping hide");
      return;
    }

    // Clear typewriter effect
    if (this.typewriterInterval) {
      clearInterval(this.typewriterInterval);
      this.typewriterInterval = null;
    }

    this.tutorElement.classList.remove("active");
    this.tutorElement.style.opacity = "0";
    this.tutorElement.style.transform = "translateY(50px)";

    setTimeout(() => {
      this.tutorElement.classList.add("hidden");
      this.tutorElement.style.display = "none";
      this.isActive = false;
      this.chatMode = false;
      this.currentPlanet = null;
      this.chatHistory = [];

      // Reset UI
      const footer = document.getElementById("dialogFooter");
      if (footer) footer.style.display = "flex";

      const chatContainer = document.getElementById("chatInputContainer");
      if (chatContainer) chatContainer.style.display = "none";

      // Reset button text
      const nextBtn = document.getElementById("nextMessage");
      if (nextBtn) nextBtn.textContent = "Next";

      console.log("Tutor hidden");
    }, 300);
  }

  isShowing() {
    return this.isActive;
  }
}

// Create singleton instance after DOM is ready
let planetTutor = null;

// Function to get the tutor instance
function getPlanetTutor() {
  console.log("getPlanetTutor called, current instance:", planetTutor);

  if (!planetTutor) {
    console.log("Tutor not ready, creating now...");
    planetTutor = new PlanetTutor();
    console.log("Tutor created:", planetTutor);
  }

  return planetTutor;
}

// Try to initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM loaded via event, creating Planet Tutor singleton...");
    if (!planetTutor) {
      planetTutor = new PlanetTutor();
    }
  });
} else {
  console.log("DOM already loaded, creating Planet Tutor singleton...");
  if (!planetTutor) {
    planetTutor = new PlanetTutor();
  }
}

// Export
export { getPlanetTutor };
