# PROMPT 05 — Zoom System

## Context
Read `docs/CLAUDE.md` and `docs/ARCHITECTURE.md` before starting.
This prompt owns: `src/render/ZoomController.js`

Depends on: Renderer.js (Prompt 04), GameState.js

---

## Task

Build the zoom system — the terrarium magic. The ability to go from watching a whole planet to reading one named person's beliefs. This is what makes the player feel like a god with a magnifying glass.

---

## ZoomController.js

```javascript
class ZoomController {
  constructor(renderer, gameState, eventBus) {
    this.currentLevel = 0      // 0=planet, 1=region, 2=village, 3=person
    this.targetX = 0           // world coords of zoom focus
    this.targetY = 0
    this.targetAgent = null    // Agent object if level 3
    this.targetSettlement = null
  }

  // Input handlers
  onScroll(delta, mouseX, mouseY) { }    // scroll wheel zoom
  onPinch(scale, centerX, centerY) { }  // mobile pinch
  onClick(x, y) { }                     // click to focus + zoom in

  // Zoom level transitions
  zoomTo(level, x, y) { }      // animated transition
  zoomOut() { }                 // go up one level

  // Returns current view data for renderer
  getViewport() { }
}
```

---

## The Four Zoom Levels

### Level 0 — Planet View
```
What player sees:
- Full planet disk fills ~70% of screen
- Settlement blobs glow on surface
- No individual agents visible
- Atmosphere rim visible
- Stars in background (static)

Interaction:
- Scroll up or click on planet surface → zoom to Level 1
- Click intervention buttons (always visible)
- Ticker visible on side

Transition in:
- Planet scales up from small dot (startup animation)
- Or pulls back from Level 1 (reverse zoom)
```

### Level 1 — Region View
```
What player sees:
- ~25% of planet surface fills viewport
- Terrain detail visible (forests, rivers, mountains as texture)
- Individual agent dots (2px) visible moving between settlements
- Settlement names float as HTML labels
- 3-5 settlements typically in view

Interaction:
- Scroll up → Level 2 (focuses on nearest settlement to cursor)
- Scroll down → Level 0
- Click settlement → Level 2 focused on that settlement

Transition:
- Smooth scale + pan (300ms ease-out)
- Planet edge fades as we zoom in
```

### Level 2 — Village View
```
What player sees:
- Single settlement fills most of viewport
- Agent dots are 4px, colored by role
- Settlement name large and visible
- Population count shown
- Dominant religion/myth shown as subtitle
- Small indicator of settlement "mood" (peaceful/tense/celebrating)

Interaction:
- Scroll up → Level 3 (focuses on hovered agent)
- Scroll down → Level 1
- Click agent dot → Level 3 focused on that agent
- Hover agent → tooltip: name + role

Transition:
- Settlement name animates in
- Agent dots resolve from blur as zoom settles
```

### Level 3 — Person View
```
What player sees:
- Focused agent highlighted (8px circle + animated ring)
- HTML overlay card slides in from right:

  ┌─────────────────────────────────┐
  │  SERA OF THE EASTERN FEN        │
  │  Priest · Age 34 · Vael's Cross │
  │                                 │
  │  Believes:                      │
  │  "The Sky Breaker watches us.   │
  │   The fire was a warning."      │
  │                                 │
  │  Member of:                     │
  │  The Screaming Sky Cult         │
  │  847 believers                  │
  │                                 │
  │  Last seen: spreading the       │
  │  Ash Rite to Eastern settlements│
  └─────────────────────────────────┘

- Other agents still visible as 2px dots in background
- Agent moves in real time even while card is shown

Interaction:
- Scroll down → Level 2
- Press ESC → Level 2
- Click different agent → switch card to that agent
- Card updates live as agent's beliefs change
```

---

## Transition Animations

```javascript
// All zoom transitions use the same easing
const ZOOM_DURATION = 300  // ms
const ZOOM_EASING = 'cubic-bezier(0.25, 0.1, 0.25, 1.0)'  // ease-out

// Scale values per level
const ZOOM_SCALES = {
  0: 1.0,    // full planet visible
  1: 4.0,    // region
  2: 16.0,   // village
  3: 32.0    // person
}
```

Zoom transition sequence:
1. Calculate target position (world coords of clicked point or settlement center)
2. Animate PixiJS stage scale + position simultaneously
3. At 150ms (midpoint): swap LOD level (agent dots resolve/derez)
4. At 300ms: emit `zoom:changed` with new level
5. If Level 3: trigger HTML card slide-in after 200ms delay

---

## Click-to-Zoom Targeting

When player clicks at Level 0 (on planet surface):
1. Convert screen coords → world coords
2. Find nearest settlement within 30px world radius
3. If found: zoom to Level 2, center on settlement
4. If not found: zoom to Level 1, center on click point

When player clicks at Level 1 (on agent dot):
1. Convert screen coords → world coords
2. Find nearest agent within 10px world radius
3. If found: zoom to Level 3, target that agent
4. If not found: zoom to Level 2, center on click point

---

## Back Navigation

```
Level 3 → 2: Scroll down, ESC, or back button
Level 2 → 1: Scroll down or back button
Level 1 → 0: Scroll down or back button

Back button: always visible bottom-left when zoom > 0
Label: "← [Level name]"  e.g. "← Planet View"
```

---

## EventBus

```javascript
// Emit
EventBus.emit('zoom:changed', { level, targetX, targetY, targetAgent, targetSettlement })
EventBus.emit('zoom:agent_focused', { agent })   // triggers person card

// Listen
EventBus.on('sim:tick', () => updateAgentPositions())  // keep targeted agent tracking fresh
```

---

## Output

A zoom controller that:
1. Handles scroll + click + pinch to zoom
2. Smooth 300ms animated transitions between all 4 levels
3. Correct LOD switching at each level boundary
4. Person card data passed correctly for HTML overlay
5. Back navigation always available
6. Never loses the player — zoom focus always makes spatial sense
