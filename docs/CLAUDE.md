# CLAUDE.md — Terrarium Planet v0.2

Read this fully before writing a single line of code. This file defines the soul of the project.

---

## The One Rule That Overrides Everything

**This game is a trap, not a toy.**

The player enters thinking they are the god. By the end, they are questioning whether they are the simulation. Every technical decision, every UX choice, every line of copy exists to serve this inversion. If a feature doesn't move the player toward that moment — cut it or subordinate it to one that does.

---

## What This Project Is

A browser-based philosophical god-simulation. Players tune environmental sliders to create conditions for life, watch a civilization emerge on a 2D planet, poke it with interventions, and read the myths the civilization writes about those interventions. Late-game: the civilization detects the container. The player's 5th run: the question flips.

**It is a philosophical trap disguised as a curiosity toy.**

---

## Stack (never deviate without explicit instruction)

- **Rendering:** PixiJS v7 (WebGL, canvas fallback)
- **Simulation:** Vanilla JS — no React, no Vue, no framework
- **UI Overlays:** Plain HTML + CSS positioned over canvas
- **State:** Plain JS objects + EventBus (see `src/state/EventBus.js`)
- **Build:** Vite
- **Deploy:** Vercel
- **No TypeScript** — plain JS only

---

## File Ownership — One Agent, One File

| Prompt | Files owned |
|---|---|
| 00-bootstrap | EventBus.js, GameState.js, Random.js, NameGen.js, MathUtils.js, SaveManager.js |
| 01-planet-setup-screen | SetupScreen.js, FinetuningScreen.js, Planet.js, Conditions.js |
| 02-simulation-engine | SimEngine.js, Agent.js, Settlement.js, CivEvents.js |
| 03-myth-engine | MythEngine.js, MythTemplates.js, ReligionSystem.js |
| 04-render-canvas | Renderer.js, PlanetView.js, AgentSprites.js |
| 05-zoom-system | ZoomController.js, PersonCard.js |
| 06-intervention-tools | InterventionBar.js |
| 07-postmortem-screen | PostMortem.js |
| 08-ui-overlays | Ticker.js, SpeedControl.js, index.html, global CSS |

---

## Core Rules

### The Trap Rules (most important — read first)

- The player's name in myths is NEVER shown to the player until the post-mortem. Let them discover it.
- The guaranteed tick-25 myth MUST fire regardless of civilization state. It is hardcoded. Not emergent.
- Communication events (humans writing to the player) use a DIFFERENT visual treatment — magenta, larger, addressed outward. Never mix them with regular ticker events.
- The 5th-run meta message appears AFTER retry buttons, with a 3-second delay. Retry button is disabled for 5 seconds while it's visible. This is intentional friction.
- The fine-tuning interstitial (4 seconds, real physics facts) is NOT skippable in v1. The player must sit with it.

### Simulation Rules

- Tick rate is **20 ticks/second** — never couple simulation to render speed
- 1 tick ≈ 1 civilization year
- All randomness uses `src/utils/Random.js` (seeded RNG) — never `Math.random()` directly
- Death is permanent within a run
- Population cap: 10,000. Above that: aggregate simulation

### Myth Engine Rules (the soul of the game)

- Every intervention MUST produce at least one myth entry within 5 ticks
- Myths have three waves: immediate (tick 0–5), legend (tick 30–50), religion (tick 80+)
- Player name evolves: The Absent One / Sky Breaker / Generous Hand / Capricious One / Redeemer
- Myths surface in ticker BEFORE any stat update — they are the primary feedback
- Myth entries use gold left border. ALWAYS. Non-negotiable.
- Communication entries (humans addressing the player) use magenta. ALWAYS.

### Ticker Visual Hierarchy (enforced, not optional)

```
myth / religion:      gold left border (#ffcc44), italic text
player name glows:    500ms brightness pulse on the line
war / death:          red left border (#ff4444)
communication:        magenta (#ff44ff), 14px font (larger), addressed format
routine events:       no border, dim text (#6868a8)
```

### Rendering Rules

- UI overlays are HTML/CSS — NEVER draw UI on canvas
- Canvas is for planet, agents, terrain only
- Zoom levels: 0 (planet), 1 (region), 2 (village), 3 (person)
- At zoom 3: PersonCard shows name, role, beliefs, religion membership

### State Rules

- All state in `src/state/GameState.js`
- Cross-module events via EventBus ONLY
- Auto-save every 60 ticks to localStorage key `terrarium_planet_save`
- Run count tracked in localStorage key `terrarium_planet_runs` — used for 5th-run trap

---

## What NOT To Do

- ❌ No score, points, leaderboard
- ❌ No multiplayer
- ❌ No real chemistry values (abstracted sliders)
- ❌ No direct agent control
- ❌ No win state
- ❌ No React/Vue/Angular
- ❌ No Math.random() — use seeded RNG
- ❌ Do NOT explain the simulation hypothesis in UI text. Engineer the feeling. Never lecture.
- ❌ Do NOT make the fine-tuning interstitial skippable in v1
- ❌ Do NOT let the player choose their name in myths — it must be derived from behavior

---

## Speed Control (new in v0.2)

SimEngine must support speed multipliers: 0 (pause), 0.5x, 1x, 4x.
Spacebar = pause/resume. +/- keys = speed up/down.
Speed state lives in GameState.simSpeed.
Ticker freezes on pause. Interventions queue on pause and execute on resume.

---

## Naming Conventions

```javascript
// Files: PascalCase
SimEngine.js, MythEngine.js, FinetuningScreen.js, PersonCard.js

// Events
'intervention:meteor' / 'intervention:drought' / 'intervention:bless'
'sim:settlement_formed' / 'sim:civ_event' / 'sim:guaranteed_myth'
'myth:created' / 'myth:evolved' / 'myth:schism'
'religion:formed'
'planet:death'
'zoom:changed' / 'zoom:agent_focused'
'player:name_changed'
'communication:outbound'   // humans addressing the player — special treatment
'meta:fifth_run'           // triggers the 5th-run message

// State
gameState.planet.sliders.atmosphere
gameState.myths[0].believers
gameState.simSpeed          // 0 | 0.5 | 1 | 4
gameState.followedAgent     // Agent | null
gameState.runCount          // loaded from localStorage
```

---

## Visual Design

- Background: deep space `#080818`
- Planet colors: green-blue (healthy) → orange (stressed) → grey (dying) → near-black (dead)
- Myth entries: gold `#ffcc44` — always
- Communication entries: magenta `#ff44ff` — always
- Player name glow: white pulse, 500ms
- Death: planet drains to black over 2 seconds. Silence. Then post-mortem rises.
- Font: Space Mono (ticker, scientific) / Inter (UI chrome)
- Fine-tuning screen: white text on pure black. Nothing else. Full attention.

---

## When You're Unsure

1. Ask: does this feature serve the trap? If no — deprioritize.
2. Check ARCHITECTURE.md for system design
3. Check MEMORY.md for decisions already made
4. Do the simpler thing, leave a TODO, document in MEMORY.md

---

## Running the Project

```bash
npm install
npm run dev      # localhost:5173
npm run build    # dist/
```
