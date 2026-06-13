# ARCHITECTURE — Terrarium Planet

## Overview

Browser-first, HTML5 Canvas + vanilla JS for v1. No framework dependencies. Designed to be built incrementally by AI coding agents (Antigravity) with clean module boundaries.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Rendering | PixiJS (WebGL, Canvas fallback) | Handles thousands of agent dots + smooth zoom |
| Simulation | Vanilla JS tick loop | Decoupled from render, deterministic |
| State | Plain JS objects + event bus | No framework overhead, easy for AI agents |
| UI Overlays | HTML/CSS over canvas | Sliders, ticker, post-mortem cards |
| Persistence | localStorage | Save planet state, myth history |
| Build | Vite | Fast dev server, zero-config bundling |
| Deploy | Vercel | Consistent with Afsal's existing stack |

---

## Directory Structure

```
terrarium-planet/
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── MEMORY.md
│   └── CLAUDE.md
├── prompts/
│   ├── 01-planet-setup-screen.md
│   ├── 02-simulation-engine.md
│   ├── 03-myth-engine.md
│   ├── 04-render-canvas.md
│   ├── 05-zoom-system.md
│   ├── 06-intervention-tools.md
│   ├── 07-postmortem-screen.md
│   └── 08-ui-overlays.md
├── src/
│   ├── main.js               ← Entry point
│   ├── simulation/
│   │   ├── SimEngine.js      ← Master tick loop
│   │   ├── Planet.js         ← Planet state + sliders
│   │   ├── Agent.js          ← Individual human agent
│   │   ├── Settlement.js     ← Settlement / faction logic
│   │   ├── CivEvents.js      ← Emergent event generator
│   │   └── Conditions.js     ← Slider → survival logic
│   ├── myth/
│   │   ├── MythEngine.js     ← Core myth generation
│   │   ├── MythTemplates.js  ← Named legend templates
│   │   └── ReligionSystem.js ← Faction belief systems
│   ├── render/
│   │   ├── Renderer.js       ← PixiJS master renderer
│   │   ├── PlanetView.js     ← Top-down planet canvas
│   │   ├── ZoomController.js ← Zoom level manager
│   │   └── AgentSprites.js   ← Dot rendering + LOD
│   ├── ui/
│   │   ├── SetupScreen.js    ← Slider UI
│   │   ├── Ticker.js         ← Event stream overlay
│   │   ├── PostMortem.js     ← Death card
│   │   └── InterventionBar.js← Intervention buttons
│   ├── state/
│   │   ├── GameState.js      ← Master state object
│   │   ├── EventBus.js       ← Cross-module events
│   │   └── SaveManager.js    ← localStorage persistence
│   └── utils/
│       ├── Random.js         ← Seeded RNG
│       ├── NameGen.js        ← Procedural names (people, places, myths)
│       └── MathUtils.js
├── assets/
│   ├── fonts/
│   ├── sounds/               ← Ambient + event sounds (v2)
│   └── sprites/
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

---

## Core Systems

### 1. Simulation Engine (SimEngine.js)
```
Fixed tick rate: 20 ticks/sec (simulation time)
Render rate: 60fps (decoupled)
1 tick = ~1 year of civilization time (compressed)

Each tick:
  1. Update agent positions + states
  2. Check survival conditions (Conditions.js)
  3. Generate emergent events (CivEvents.js)
  4. Feed events to MythEngine
  5. Check death conditions
  6. Emit render update
```

### 2. Planet State (Planet.js)
```javascript
{
  sliders: {
    atmosphere: 0-100,    // maps to O2/N2 mix
    water: 0-100,         // surface water coverage
    heat: 0-100,          // temperature band
    gravity: 0-100,       // surface gravity
    starDistance: 0-100,  // habitable zone position
    soil: 0-100           // nutrient richness
  },
  era: 'ancient' | 'modern',
  tick: Number,           // current simulation tick
  population: Number,
  settlements: Settlement[],
  agents: Agent[],
  myths: Myth[],
  isAlive: Boolean,
  deathCause: String | null
}
```

### 3. Myth Engine (MythEngine.js)

The myth engine is the heart of the game. Every intervention and major event is processed through it.

```
Input:  EventType + EventData + CivilizationState
Output: MythEntry { name, legend, believers, icon }

Pipeline:
  1. Classify event (natural / divine / anomaly)
  2. Select template bank based on civ tech level
  3. Fill template with procedural names + context
  4. Assign to faction or civilization-wide belief
  5. Age myth over time (grows, mutates, schisms)
```

**Example myth entries:**
- `{ name: "The Screaming Sky", legend: "In the 40th year, the Void God hurled fire from the heavens...", believers: 847 }`
- `{ name: "The Silent Watcher", legend: "The creator has abandoned us. We are an experiment left to rot...", believers: 2103 }`
- `{ name: "The Edge Heresy", legend: "Brother Solenne claims the world has walls. She has been burned.", believers: 12 }`

### 4. Zoom System (ZoomController.js)

```
Level 0: Planet view      — full disk, continents, weather
Level 1: Region view      — terrain, settlement clusters
Level 2: Village view     — named settlements, population counts
Level 3: Person view      — named individual, role, current belief
```

Zoom triggered by scroll wheel or pinch. LOD system drops agent detail at Level 0-1 for performance.

### 5. Conditions System (Conditions.js)

Maps slider values to survival outcomes. Not real chemistry — abstracted for gameplay feel.

| Slider | Safe Zone | Below | Above |
|---|---|---|---|
| Atmosphere | 35-65 | Suffocation collapse | Toxic pressure death |
| Water | 20-80 | Desert extinction | Flood extinction |
| Heat | 30-70 | Frozen stasis | Thermal runaway |
| Gravity | 25-75 | Drift apart (can't build) | Crushed (can't grow) |
| Star Distance | 30-70 | Frozen dark | Scorched |
| Soil | 20-100 | Starvation | (no upper limit penalty) |

---

## Event Bus

All cross-module communication uses a simple pub/sub:

```javascript
EventBus.on('intervention:meteor', (data) => { ... })
EventBus.on('sim:settlement_formed', (data) => { ... })
EventBus.on('myth:created', (data) => { ... })
EventBus.on('planet:death', (cause) => { ... })
```

---

## Render Pipeline

```
SimEngine (tick) → GameState (updated) → Renderer.render()
                                          ├── PlanetView.draw()     (PixiJS)
                                          ├── AgentSprites.draw()   (PixiJS, LOD-aware)
                                          └── UI overlays           (HTML/CSS, not canvas)
```

UI overlays (ticker, sliders, intervention bar) are HTML positioned over the canvas — not drawn on canvas. This keeps the UI reactive and the canvas fast.

---

## Performance Targets

| Metric | Target |
|---|---|
| Agents on screen | Up to 2,000 dots at planet view |
| Tick rate | Stable 20/sec at max population |
| Zoom transition | < 300ms |
| First render | < 2 sec on load |

Spatial partitioning (grid-based) for agent collision/proximity checks. Agent LOD: at planet view, agents are single pixels grouped by settlement. At village view, individual dots. At person view, named card.

---

## Save / Load

```javascript
// Auto-save every 60 ticks to localStorage
SaveManager.save({
  planet: GameState.planet,
  myths: GameState.myths,
  tick: GameState.tick,
  runHistory: GameState.runHistory  // last 5 runs for post-mortem comparison
})
```

---

## Build & Deploy

```bash
npm install
npm run dev      # localhost:5173
npm run build    # dist/
vercel deploy    # push to Vercel
```
