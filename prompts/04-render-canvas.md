# PROMPT 04 — Render Canvas

## Context
Read `docs/CLAUDE.md` and `docs/ARCHITECTURE.md` before starting.
This prompt owns: `src/render/Renderer.js`, `src/render/PlanetView.js`, `src/render/AgentSprites.js`

Do NOT touch simulation logic. Render only what `GameState` exposes. All data comes from `EventBus.on('sim:tick')`.

---

## Task

Build the visual planet — the thing the player stares at. A 2D top-down circular planet rendered in PixiJS. Thousands of tiny agent dots. Living terrain. The terrarium you can't stop watching.

---

## Renderer.js

Master renderer. Owns the PixiJS app instance.

```javascript
import * as PIXI from 'pixi.js'

class Renderer {
  constructor(canvasEl, eventBus) {
    this.app = new PIXI.Application({
      view: canvasEl,
      backgroundColor: 0x080818,
      resizeTo: window,
      antialias: true
    })
    this.planetView = new PlanetView(this.app)
    this.agentSprites = new AgentSprites(this.app)
    this.zoomLevel = 0   // 0-3
  }

  init() {
    // Set up PixiJS stage layers (order matters):
    // Layer 0: planet disk + terrain (bottom)
    // Layer 1: agent dots
    // Layer 2: settlement labels (HTML overlay, not canvas)
    // Layer 3: zoom highlight ring
  }

  onSimTick(state) {
    // Called 20x/sec via EventBus
    // Update planet health color
    // Update agent positions
    // Update settlement markers
  }
}
```

---

## PlanetView.js

Draws the planet disk and terrain. The most visually important element.

### Planet Disk

Circular mask — everything renders inside it. Radius: 40% of min(viewport width, viewport height).

```
Planet disk layers (bottom to top):
1. Base color — determined by health score
2. Terrain texture — procedural noise (simplex or value noise)
3. Water bodies — blue patches based on water slider
4. Settlement glow — soft colored halos where settlements exist
5. Atmosphere rim — subtle glow around the disk edge
6. Cloud layer — slowly drifting white sprites (optional, v2)
```

### Planet Color States

```javascript
const PLANET_COLORS = {
  healthy:   { base: 0x1a6b3a, water: 0x1a4a8a, atmo: 0x4488ff },  // green-blue
  stressed:  { base: 0x8b5e1a, water: 0x5a3a1a, atmo: 0xff8833 },  // orange-brown
  dying:     { base: 0x3a3a3a, water: 0x1a1a2e, atmo: 0x883333 },  // grey-red
  dead:      { base: 0x111111, water: 0x080808, atmo: 0x220000 },   // near black
}
```

Health score → color interpolation:
- 0.8–1.0: healthy
- 0.5–0.8: lerp healthy → stressed
- 0.2–0.5: lerp stressed → dying
- 0.0–0.2: dying → dead

### Terrain Generation

On planet creation (not every tick — static):
```
Use simplex noise to generate a height map
Height > 0.6 → land (brown/green)
Height 0.3–0.6 → coast (sandy)
Height < 0.3 → water (blue)
Water slider value shifts the threshold (high water = more ocean)
```

### Settlement Glows

For each settlement in state:
- Small soft radial gradient at settlement position
- Color based on settlement's dominant myth/religion:
  - No myth: `#ffffff22` (white, faint)
  - Fire myth (meteor): `#ff440044` (orange)
  - Water myth (drought): `#4488ff44` (blue)
  - Abundance myth (bless): `#44ff8844` (green)
  - Absence myth (inactive player): `#88888844` (grey)

---

## AgentSprites.js

Renders agents as dots. LOD (level of detail) based on zoom level.

### LOD System

```
Zoom Level 0 (planet):
  - Don't render individual agents
  - Render settlement clusters as glowing blobs
  - 1 blob per settlement, size = log(population)

Zoom Level 1 (region):
  - Render agent dots as 2px circles
  - Color = settlement faction color
  - No labels

Zoom Level 2 (village):
  - Render agent dots as 4px circles
  - Hover shows name + role
  - Settlement name floats above cluster

Zoom Level 3 (person):
  - Target agent highlighted with 8px circle + ring
  - Info card rendered in HTML overlay (not canvas)
  - Other agents still visible as 2px dots
```

### Agent Colors

```javascript
const ROLE_COLORS = {
  settler:  0xaaaaaa,   // grey
  builder:  0x8888ff,   // blue
  priest:   0xffaa00,   // gold
  wanderer: 0xff88aa,   // pink
}
```

### Performance

- Use `PIXI.ParticleContainer` for agent dots — much faster than individual sprites
- Spatial grid: 20x20 grid over planet surface, agents bucketed by cell
- At zoom 0-1: skip individual agent updates, only update settlement blobs
- Cap rendered agents: max 500 individual dots. Above that, aggregate into settlement blobs.

---

## What the Player Sees (visual narrative)

**Healthy young planet:**
Green-blue disk. A few glowing clusters. Tiny grey dots drifting between them.

**Growing civilization:**
More clusters. Orange glow where a war is happening. Gold dots (priests) moving between settlements.

**After a meteor:**
A dark scar on the surface. Orange flash fades over 10 ticks. Settlement glow at impact site dims.

**Dying planet:**
Colors drain. Grey replaces green. Clusters shrink. Eventually just a dark disk with a few stubborn dots.

**Dead planet:**
Near-black disk. Atmosphere rim gone. Still. Then the post-mortem card rises.

---

## EventBus

```javascript
// Listen
EventBus.on('sim:tick', state => renderer.onSimTick(state))
EventBus.on('zoom:changed', level => renderer.setZoom(level))
EventBus.on('intervention:meteor', data => renderer.showMeteorImpact(data))
EventBus.on('intervention:drought', data => renderer.showDroughtOverlay(data))
EventBus.on('planet:death', () => renderer.playDeathSequence())
```

---

## Output

A PixiJS renderer that:
1. Draws a circular planet with procedural terrain
2. Updates planet color based on health score in real time
3. Renders agent dots with LOD — fast at scale
4. Shows settlement glows colored by dominant myth
5. Plays a death sequence when the planet dies
6. Never drops below 60fps at 500 agents
