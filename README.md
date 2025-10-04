# Beyond Earth - Cosmic Journey

> An immersive 3D web experience that takes users on a journey from the edge of the cosmos, through atmospheric reentry, to exploring realistic exoplanets in a virtual cockpit.

---

## Features

### Main Journey (Cosmic Gateway)

- **Interactive scroll-based navigation** from deep space to Earth's atmosphere
- **Dynamic Camera Controller** with four phases: _Deep Space → Approaching Earth → Earth Orbit → Descent_
- **Procedurally generated starfield** with thousands of animated stars
- **Realistic Earth system**:
  - **High-resolution** surface, clouds, and atmosphere textures
  - **Satellites** orbiting Earth
- **Immersive audio system** that adapts to each phase _(deep space, descent, wind effects)_
- **Loading screen** with progress bar and logo
- **UI controller** showing the current journey phase

---

### Desert Scene

- **Realistic desert environment** with sand, rocks and spaceship
- **Interactive objects**: Click to focus camera on landmarks
- **Spaceship launch interaction** to transition into exoplanet exploration
- **Voiceover guidance** during the desert scene

---

### Exoplanet Exploration

#### Cockpit Experience
- **Immersive first-person cockpit view** with realistic interior
- **Glass windshield** with proper transparency and depth masking
- **Enhanced lighting system** with multiple sources for cockpit ambiance
- **Mouse-controlled head movement** with limits _(±60° yaw, ±45° pitch)_

#### Spaceship Controls
| Key | Action |
|-----|--------|
| **WASD** | Movement in all directions |
| **Arrow Keys** | Pitch and yaw rotation |
| **Q/E** | Roll rotation |
| **Space/Shift** | Vertical movement (up/down) |
| **Mouse** | First-person look-around |
| **T** | Target nearest planet |
| **I** | Scan planet |
| **Click** | Travel to planet |

**Physics Features**:
- Progressive acceleration with speed multiplier
- Velocity persistence with realistic damping
- Speed-based cockpit shake effects

#### Planet System (10+ Real Exoplanets)

**Featured worlds** include:
- **Kepler-442b** - _Super-Earth in habitable zone_
- **TRAPPIST-1e** - _Earth-like terrestrial planet_
- **Proxima Centauri b** - _Closest exoplanet to Earth_
- **Kepler-186f** - _Earth-sized planet in habitable zone_
- **HD 40307 g** - _Super-Earth candidate_
- **Gliese 667 Cc** - _Rocky planet in triple star system_
- **Kepler-62f** - _Super-Earth in habitable zone_
- **LHS 1140 b** - _Dense super-Earth_
- **K2-18b** - _Sub-Neptune with potential water vapor_
- **TOI 700 d** - _Earth-sized habitable zone planet_

#### Planet Data and Visualization

**Each planet includes comprehensive scientific data**:
- Mass and radius _(relative to Earth/Jupiter)_
- Surface temperature and conditions
- Atmospheric composition
- Distance from host star and Earth
- Discovery year and method
- **Habitability assessment**

**Visual features**:
- **Realistic surfaces**: rocky craters, gas bands, ice cracks, lava veins, ocean worlds
- **Habitable zone indicators** _(green scanning rings)_
- Dynamic rotation and floating motion effects
- Emissive lighting for atmospheric glow

#### Interactive Planet Tutor

- **AI Guide "Astro"** with animated avatar
- **Educational stories** with multi-message narratives for each planet type
- **Typewriter effect** for character-by-character text animation
- **Audio feedback** with futuristic scanning and targeting sounds
- **Interactive controls**: _Next, Skip, and Close buttons_

#### Enhanced HUD System

**Status display** includes:
- Real-time position _(x, y, z coordinates)_
- Current speed indicator
- Active target name
- Planet count discovered

**Additional UI elements**:
- Central **targeting crosshair**
- **Controls overlay** with on-screen reference guide _(auto-fades after 20s)_
- **Settings panel** accessible via gear icon
- **Audio indicator** for visual sound feedback

#### 3D Planet Info Panels

**Canvas-based information displays** with:
- **Two-column layout**:
  - **Left**: Data table _(type, mass, radius, temperature, distance, habitability, discovery year)_
  - **Right**: Stats overview with bar graphs
- **Visual enhancements**:
  - Gradient backgrounds with glowing borders
  - Color-coded values _(cyan labels, orange values)_
  - Habitable zone highlight
  - Animated fade-in effects
- _Press **TAB** to close panels_

---

## Data Viewer and Management

### Scientist Mode

- **Data table display** with paginated exoplanet database viewer
- **Column headers**: _Name, Type, Mass, Radius, Temperature, Atmosphere, Distance, Discovery Year, Habitability_
- **Advanced pagination**:
  - First/Previous/Next/Last page navigation
  - Page number buttons with ellipsis for large datasets
  - Items per page selector _(10, 25, 50, 100)_
  - "Showing X to Y of Z" indicator
- **Search and filter**:
  - Real-time search across all fields
  - Filter by planet type, habitability, discovery year
  - Sort by any column _(ascending/descending)_
- **Responsive design** that adapts to all screen sizes
- **Export options**: Download filtered data as JSON

### Custom Data Upload

- **JSON file support** for custom exoplanet datasets
- **Data validation** with automatic format checking
- **Required fields**:
  - name, type, position _(x, y, z)_
  - mass, radius, temperature
  - atmosphere, surface, orbital period
  - distance, host star, discovery info
  - habitability score
- **Galaxy generation**: Procedurally creates 3D positions if not provided
- **Preview mode** to review data before loading into exploration
- **Error handling** with clear feedback for invalid files

---

## Authentication and Security

### OTP-Based Authentication

- **Secure access** with email-based one-time password system
- **User flow**:
  1. Enter email address
  2. Receive **6-digit OTP code**
  3. Verify code to access scientist mode
  4. Session management for continued access
- **Rate limiting** for protection against brute force attempts
- **Email validation** with format checking and verification
- **Visual feedback**: _Loading states, success/error messages_

### Upload Authentication

- **Protected upload** requiring authentication for custom data
- **Session persistence** to remember authenticated users
- **Access control** restricting data modification to verified scientists
- **Secure file handling** to validate and sanitize uploaded JSON

---

## Technical Features

- **Three.js-powered 3D graphics** with advanced lighting and PBR materials
- **Procedural starfields** and instanced rendering for performance
- **Dynamic audio system** with spatial audio per scene
- **Responsive design** for desktop and mobile
- **LOD, frustum culling**, and adaptive quality for smooth performance
- **Modular architecture** _(controllers, utilities, loaders, data management)_
- **Modern JavaScript** with modules, classes, async/await

---

## Getting Started

### Prerequisites

- Modern **WebGL-enabled browser**
- Local server for asset loading

### Installation

```bash
git clone <repo-url>
cd beyond-earth
python -m http.server 5500
# OR
npx serve .
```

Visit **http://localhost:5500**

---

## Controls

### Cosmic Journey

- **Scroll** - Travel from deep space to Earth
- **M** - Toggle audio mute
- Automatic phase progression

### Exoplanet Explorer

| Key | Function |
|-----|----------|
| **Click canvas** | Enter cockpit |
| **ESC** | Exit cockpit |
| **WASD** | Move |
| **Arrow Keys** | Rotate |
| **Q/E** | Roll |
| **Mouse** | Look around |
| **Space/Shift** | Move up/down |
| **T** | Target nearest planet |
| **I** | Scan planet |
| **Click planet** | Travel |

---

## Technical Architecture

**Scene Controllers**: 
- `CosmicScene.js`, `EarthSystem.js`, `DesertSceneController.js`, `CameraController.js`

**Exoplanet System**: 
- `exoplanet-scene-controller.js`, `exoplanet-factory.js`, `cockpit-controls.js`, `planet-data-provider.js`

**Utilities**: 
- `StarField.js`, `AudioController.js`, `TransitionController.js`

**Data Management**: 
- `pagination-handler.js`, `planet-tutor-controller.js`, `texture-generator.js`

---

## Browser Support

- **Chrome, Edge, Firefox, Safari** _(with audio gesture)_
- **Mobile-friendly** _(touch adapted)_

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **No audio** | Click to unlock, press M, check permissions |
| **Poor performance** | Lower star count, reduce textures, disable shadows |
| **Controls not working** | Ensure pointer lock, check WebGL context |

---

## Future Enhancements

- VR support
- Multiplayer journeys
- Procedural planet surfaces
- Real-time exoplanet data integration
- Advanced atmospheric scattering
- Optimized touch controls

---

## Credits

- **Three.js** - rendering
- **NASA Exoplanet Archive** - scientific data
- **Web Audio API** - sound
- **Procedural assets** - textures and models

---

## License

Open-source under **MIT License**.

---

> **Experience the cosmos. Explore distant worlds. Journey Beyond Earth.**