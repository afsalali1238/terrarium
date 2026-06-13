# PROMPT 00 — Project Bootstrap

## Context
Read `docs/CLAUDE.md`, `docs/ARCHITECTURE.md`, and `docs/MEMORY.md` before starting.
This prompt is run FIRST, before any other prompt. It sets up the project skeleton.

---

## Task

Create the project scaffold — all empty files with correct exports, the EventBus, GameState, utility files, and Vite config. No logic yet. Just the skeleton that all other prompts will fill in.

---

## What to Create

### package.json
```json
{
  "name": "terrarium-planet",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "pixi.js": "^7.4.0"
  },
  "devDependencies": {
    "vite": "^5.0.0"
  }
}
```

### vite.config.js
```javascript
export default {
  base: './',
  build: {
    outDir: 'dist'
  }
}
```

### src/state/EventBus.js
Simple pub/sub. All cross-module communication goes through here.

```javascript
const listeners = {}

export const EventBus = {
  on(event, callback) {
    if (!listeners[event]) listeners[event] = []
    listeners[event].push(callback)
  },
  off(event, callback) {
    if (!listeners[event]) return
    listeners[event] = listeners[event].filter(cb => cb !== callback)
  },
  emit(event, data) {
    if (!listeners[event]) return
    listeners[event].forEach(cb => cb(data))
  },
  clear() {
    Object.keys(listeners).forEach(k => delete listeners[k])
  }
}
```

### src/state/GameState.js
```javascript
export const GameState = {
  planet: null,          // Planet instance (set on setup:complete)
  myths: [],             // all myths this run
  interventionLog: [],   // all player interventions
  runHistory: [],        // last 5 completed runs (for post-mortem comparison)
  isRunning: false,
  currentZoom: 0,
  focusedAgent: null,
  focusedSettlement: null
}
```

### src/utils/Random.js
Seeded RNG — all randomness in the sim goes through this.

```javascript
export class Random {
  constructor(seed) {
    this.seed = seed ?? Date.now()
    this._state = this.seed
  }

  // Returns 0-1 float
  next() {
    // Mulberry32 algorithm — fast, good distribution
    this._state |= 0
    this._state = this._state + 0x6D2B79F5 | 0
    let t = Math.imul(this._state ^ this._state >>> 15, 1 | this._state)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }

  // Returns int between min and max (inclusive)
  int(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min
  }

  // Returns random item from array
  pick(arr) {
    return arr[this.int(0, arr.length - 1)]
  }
}

// Global instance (re-seeded on each new planet)
export let rng = new Random()

export function reseedRng(seed) {
  rng = new Random(seed)
}
```

### src/utils/NameGen.js
Procedural name generator. Used by agents, settlements, myths, religions.

```javascript
import { rng } from './Random.js'

const SYLLABLES = ['al','var','sel','mor','fen','tar','kael','dun','ori','ves','thal','ren','sev','aen','mir']
const SUFFIXES_PERSON = ['of the', 'from', 'the', 'of']
const SUFFIXES_PLACE = ['Crossing', 'Hold', 'Reach', 'Fen', 'Hollow', 'Shore', 'Rise', 'Watch', 'Moor', 'Gate']
const RELIGION_PREFIXES = ['The', 'Order of', 'Faith of', 'Cult of', 'Brotherhood of', 'The Way of']
const RELIGION_SUBJECTS = ['Sky', 'Fire', 'Absence', 'Watcher', 'Void', 'Flame', 'Rain', 'Edge', 'Ash', 'Provider', 'Silence']

export const NameGen = {
  syllable() { return rng.pick(SYLLABLES) },

  humanName() {
    const first = this.syllable() + this.syllable()
    const first_cap = first.charAt(0).toUpperCase() + first.slice(1)
    const prep = rng.pick(SUFFIXES_PERSON)
    const place = this.settlementName()
    return `${first_cap} ${prep} ${place}`
  },

  settlementName() {
    const root = (this.syllable() + this.syllable())
    const root_cap = root.charAt(0).toUpperCase() + root.slice(1)
    return `${root_cap}'s ${rng.pick(SUFFIXES_PLACE)}`
  },

  religionName() {
    return `${rng.pick(RELIGION_PREFIXES)} ${rng.pick(RELIGION_SUBJECTS)}`
  },

  mythName(interventionType) {
    const METEOR_NAMES = ['The Screaming Sky', 'The Falling Mountain', 'The Fire Above', 'The Sky Break', 'The Ash Day']
    const DROUGHT_NAMES = ['The Great Dry', 'The Empty River', 'The Silence of Rain', 'The Thirst Year']
    const BLESS_NAMES = ['The Generous Season', 'The Full Year', 'The Provider\'s Touch', 'The Golden Harvest']
    const GENERIC = ['The Watching', 'The Absence', 'The Long Wait', 'The Stillness']

    if (interventionType === 'meteor') return rng.pick(METEOR_NAMES)
    if (interventionType === 'drought') return rng.pick(DROUGHT_NAMES)
    if (interventionType === 'bless') return rng.pick(BLESS_NAMES)
    return rng.pick(GENERIC)
  }
}
```

### src/utils/MathUtils.js
```javascript
export const lerp = (a, b, t) => a + (b - a) * t
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v))
export const dist = (x1, y1, x2, y2) => Math.sqrt((x2-x1)**2 + (y2-y1)**2)
export const mapRange = (v, inMin, inMax, outMin, outMax) =>
  outMin + (v - inMin) / (inMax - inMin) * (outMax - outMin)
```

### src/state/SaveManager.js
```javascript
const SAVE_KEY = 'terrarium_planet_save'

export const SaveManager = {
  save(state) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        runHistory: state.runHistory?.slice(-5) ?? [],
        lastSliders: state.planet?.sliders ?? null,
        savedAt: Date.now()
      }))
    } catch(e) { console.warn('Save failed', e) }
  },

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch(e) { return null }
  },

  clear() {
    localStorage.removeItem(SAVE_KEY)
  }
}
```

### src/main.js
Entry point. Wires all systems together.

```javascript
import { EventBus } from './state/EventBus.js'
import { GameState } from './state/GameState.js'
import { SaveManager } from './state/SaveManager.js'
import { SetupScreen } from './ui/SetupScreen.js'
import { Ticker } from './ui/Ticker.js'
import { InterventionBar } from './ui/InterventionBar.js'
import { PostMortem } from './ui/PostMortem.js'
import { Renderer } from './render/Renderer.js'
import { SimEngine } from './simulation/SimEngine.js'
import { MythEngine } from './myth/MythEngine.js'
import { ZoomController } from './render/ZoomController.js'

// Init UI
const setupScreen = new SetupScreen(document.getElementById('screen-setup'), EventBus)
const ticker = new Ticker(document.getElementById('ticker-overlay'), EventBus)
const interventionBar = new InterventionBar(document.getElementById('intervention-bar'), EventBus)
const postMortem = new PostMortem(document.getElementById('postmortem-overlay'), EventBus)

// Init render
const canvas = document.getElementById('planet-canvas')
const renderer = new Renderer(canvas, EventBus)
const zoomController = new ZoomController(renderer, GameState, EventBus)

// Wire setup → game start
EventBus.on('setup:complete', (config) => {
  // Switch screens
  document.getElementById('screen-setup').classList.remove('active')
  document.getElementById('screen-game').classList.add('active')

  // Init planet
  const { Planet } = await import('./simulation/Planet.js')
  const { reseedRng } = await import('./utils/Random.js')
  reseedRng(Date.now())

  GameState.planet = new Planet(config)
  GameState.myths = []
  GameState.interventionLog = []
  GameState.isRunning = true

  // Start systems
  const simEngine = new SimEngine(GameState.planet, EventBus)
  const mythEngine = new MythEngine(GameState.planet, EventBus)
  renderer.init(GameState.planet)
  simEngine.start()
})

// Wire planet death → postmortem
EventBus.on('planet:death', (data) => {
  GameState.isRunning = false
  // Save run to history
  const save = SaveManager.load() ?? { runHistory: [] }
  save.runHistory.push({ ...data, myths: GameState.myths.slice(-10) })
  SaveManager.save({ ...GameState, runHistory: save.runHistory })
})

// Load saved data on boot
const saved = SaveManager.load()
if (saved?.lastSliders) {
  setupScreen.prefillSliders(saved.lastSliders)
}
```

---

## Empty Stub Files to Create

Create these as empty stubs with correct export signatures. Prompts 01-08 will fill them in.

- `src/simulation/SimEngine.js` — `export class SimEngine { constructor(planet, eventBus) {} start(){} pause(){} stop(){} }`
- `src/simulation/Planet.js` — `export default class Planet { constructor(config) {} }`
- `src/simulation/Agent.js` — `export class Agent { constructor(x,y,settlement) {} }`
- `src/simulation/Settlement.js` — `export class Settlement { constructor(x,y,tick) {} }`
- `src/simulation/CivEvents.js` — `export function generateEvent(planet) { return null }`
- `src/simulation/Conditions.js` — `export function checkConditions(sliders) { return {alive:true} }`
- `src/myth/MythEngine.js` — `export class MythEngine { constructor(planet, eventBus) {} }`
- `src/myth/MythTemplates.js` — `export const TEMPLATES = {}`
- `src/myth/ReligionSystem.js` — `export class Religion { constructor(mythSource) {} }`
- `src/render/Renderer.js` — `export class Renderer { constructor(canvas, eventBus) {} init(){} }`
- `src/render/PlanetView.js` — `export class PlanetView { constructor(app) {} }`
- `src/render/AgentSprites.js` — `export class AgentSprites { constructor(app) {} }`
- `src/render/ZoomController.js` — `export class ZoomController { constructor(renderer, state, eventBus) {} }`
- `src/ui/SetupScreen.js` — `export class SetupScreen { constructor(el, eventBus) {} }`
- `src/ui/Ticker.js` — `export class Ticker { constructor(el, eventBus) {} }`
- `src/ui/InterventionBar.js` — `export class InterventionBar { constructor(el, eventBus) {} }`
- `src/ui/PostMortem.js` — `export class PostMortem { constructor(el, eventBus) {} }`

---

## Output

A runnable (blank) project that:
1. `npm install` works
2. `npm run dev` serves without errors (blank screens, no logic yet)
3. All file paths match ARCHITECTURE.md exactly
4. EventBus, GameState, Random, NameGen, MathUtils, SaveManager are fully implemented
5. main.js wiring is complete — just waiting for stubs to be filled in
