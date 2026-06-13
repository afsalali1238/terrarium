# CLAUDE.md — Terrarium Planet

This file is read by AI coding agents (Claude, Antigravity, Cursor, etc.) before touching any code. Read it fully before writing a single line.

---

## What This Project Is

A browser-based philosophical god-simulation game. Players tune environmental sliders to create conditions for life, watch a civilization emerge on a 2D planet, poke it with interventions (meteors, plagues, blessings), and read the myths and religions the civilization writes about those interventions. The emotional payoff is watching humans form legends about *you*. The philosophical payoff: late-game humans discover they are inside a container.

**It is a curiosity toy, not a game with a win state.**

---

## Stack (never deviate without explicit instruction)

- **Rendering:** PixiJS v7 (WebGL, canvas fallback)
- **Simulation:** Vanilla JS — no React, no Vue, no framework
- **UI Overlays:** Plain HTML + CSS positioned over canvas
- **State:** Plain JS objects + EventBus (see `src/state/EventBus.js`)
- **Build:** Vite
- **Deploy:** Vercel
- **No TypeScript** — plain JS only for AI agent compatibility

---

## File Ownership — One Agent, One File

Each prompt in `/prompts/` owns specific files. Never modify files outside your prompt's scope. Cross-module communication goes through `EventBus.js` only — never import directly between simulation and render layers.

| Prompt | Files owned |
|---|---|
| 01-planet-setup-screen | `src/ui/SetupScreen.js`, `src/simulation/Planet.js`, `src/simulation/Conditions.js` |
| 02-simulation-engine | `src/simulation/SimEngine.js`, `src/simulation/Agent.js`, `src/simulation/Settlement.js`, `src/simulation/CivEvents.js` |
| 03-myth-engine | `src/myth/MythEngine.js`, `src/myth/MythTemplates.js`, `src/myth/ReligionSystem.js` |
| 04-render-canvas | `src/render/Renderer.js`, `src/render/PlanetView.js`, `src/render/AgentSprites.js` |
| 05-zoom-system | `src/render/ZoomController.js` |
| 06-intervention-tools | `src/ui/InterventionBar.js` |
| 07-postmortem-screen | `src/ui/PostMortem.js` |
| 08-ui-overlays | `src/ui/Ticker.js`, `index.html`, global CSS |

---

## Core Rules

### Simulation
- Tick rate is **20 ticks/second** — never couple simulation speed to render speed
- 1 tick = approximately 1 civilization year
- All randomness uses `src/utils/Random.js` (seeded RNG) — never use `Math.random()` directly
- Death is permanent within a run — no resurrection mechanics
- Population cap: 10,000 agents max. Above that, use aggregate simulation (factions, not individuals)

### Myth Engine (most important system)
- Every intervention MUST produce at least one myth entry within 5 ticks
- Myths age, mutate, and split into schisms over time
- Myth names are procedurally generated using `src/utils/NameGen.js`
- The player's "name" in myths is never fixed — it evolves based on what they did (The Absent One, The Sky Breaker, The Generous Hand)
- Myths are the primary UI feedback — they surface in the ticker before any stat does

### Rendering
- UI overlays (sliders, ticker, intervention bar, post-mortem) are HTML/CSS — **never draw UI on canvas**
- Canvas is for the planet, agents, terrain only
- Zoom levels: 0 (planet), 1 (region), 2 (village), 3 (person) — see `ZoomController.js`
- At zoom level 0: agents are 2px dots grouped by settlement color
- At zoom level 3: show a named card, not a dot

### State
- All state lives in `src/state/GameState.js` — single source of truth
- Cross-module events go through `EventBus.js` — never `import SimEngine from render layer`
- Auto-save every 60 ticks to localStorage key `terrarium_planet_save`

---

## What NOT To Do

- ❌ Don't add a score, points system, or leaderboard — this is not a competitive game
- ❌ Don't add multiplayer features of any kind
- ❌ Don't use real chemistry values — sliders are abstracted (0-100 scale) not scientifically accurate
- ❌ Don't let the player directly control individual agents — environment only
- ❌ Don't add a "win" state — the only end is civilization death
- ❌ Don't use React, Vue, Angular, or any component framework
- ❌ Don't use `Math.random()` — use the seeded RNG

---

## Naming Conventions

```javascript
// Files: PascalCase for classes, camelCase for utils
SimEngine.js, MythEngine.js, NameGen.js

// Classes: PascalCase
class MythEngine { }

// Events: namespace:action
'intervention:meteor'
'sim:settlement_formed'
'myth:created'
'planet:death'
'zoom:changed'

// State keys: camelCase
gameState.planet.sliders.atmosphere
gameState.myths[0].believers
```

---

## Visual Design Constraints

- Background: deep space — `#080818`
- Planet surface colors change based on slider health state (green/blue = healthy, orange/grey = stressed, black/red = dying)
- Font: monospace for the ticker (scientific log feel), humanist sans for UI chrome
- No gradients on UI chrome — flat, dark, precise
- Intervention buttons: icon-first, minimal label
- Post-mortem card: clinical but warm — think autopsy report written with empathy

---

## When You're Unsure

1. Check `ARCHITECTURE.md` for system design
2. Check `MEMORY.md` for decisions already made
3. Check the relevant `/prompts/` file for your specific task
4. If still unsure: do the simpler thing, leave a `// TODO:` comment, and document in `MEMORY.md`

---

## Running the Project

```bash
npm install
npm run dev      # Dev server at localhost:5173
npm run build    # Production build to dist/
```
