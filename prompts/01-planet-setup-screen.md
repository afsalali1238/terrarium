# PROMPT 01 — Planet Setup Screen + Fine-Tuning Interstitial

## Context
Read `docs/CLAUDE.md` and `docs/ARCHITECTURE.md` before starting.
This prompt owns: `src/ui/SetupScreen.js`, `src/ui/FinetuningScreen.js`, `src/simulation/Planet.js`, `src/simulation/Conditions.js`

---

## The Philosophy of This Screen

This is the first move in the trap. The player comes in thinking "I'm setting up my game." What's actually happening: they are learning, physically and emotionally, how precise existence has to be. Most will fail their first 3 setups. That failure is the teaching. Do not make it easy. Do not make it forgiving. Precision is the point.

---

## Part 1: FinetuningScreen.js

Before the sliders ever appear — a 4-second interstitial. Full screen. Black background. White text only. Cannot be skipped in v1.

```javascript
export class FinetuningScreen {
  constructor(el, eventBus) {
    this.el = el
    this.eventBus = eventBus
  }

  show() {
    // Full screen black overlay, white monospace text, centered
    // Text fades in line by line:
    //   Line 1 (0.5s delay): "The cosmological constant is precise to 1 part in 10¹²⁰."
    //   Line 2 (1.5s delay): "The strong nuclear force is precise to 1 part in 100."
    //   Line 3 (2.5s delay): "You are about to try to replicate this."
    //   Line 4 (3.2s delay): "You will fail many times."
    //   Line 5 (3.7s delay): "That is the point."
    // After 4.5 seconds total: fade out, emit 'finetuning:complete'
  }
}
```

Visual spec:
- Background: pure `#000000` (not the space color — pure black for contrast)
- Font: Space Mono, 16px, white `#ffffff`, centered, `max-width: 500px`, `line-height: 2`
- Each line fades in with `opacity: 0 → 1` over 400ms
- No skip button in v1
- After all lines visible: 1 second pause, then fade to space color, emit `finetuning:complete`

---

## Part 2: SetupScreen.js

Appears after `finetuning:complete`. The player is now primed.

### Header

```
[planet preview — 150px circle]

Configure Your Planet

Every civilization that ever lived got exactly this right.
```

The subtitle is the trap echoing: they got it right because they had to. The player is about to learn why.

### 6 Environmental Sliders

Each slider has:
- Label (plain English, Space Mono)
- Range 0–100, step 1
- Visual safe zone indicator: green band painted on track using CSS linear-gradient
- Current value display (updates live)
- Warning text: red below safe zone, orange above safe zone
- The safe zone band should be clearly visible — it's the game's first teacher

| key | Label | Safe Zone | Below | Above |
|---|---|---|---|---|
| atmosphere | Air Mix | 35–65 | "Too thin — nothing to breathe" | "Too dense — toxic pressure" |
| water | Water Coverage | 20–80 | "Desert world — no moisture cycle" | "Ocean world — no land to build on" |
| heat | Surface Temperature | 30–70 | "Frozen — life cannot start" | "Scorched — thermal runaway" |
| gravity | Surface Gravity | 25–75 | "Too light — atmosphere drifts away" | "Too heavy — nothing can grow tall" |
| starDistance | Distance from Star | 30–70 | "Too far — frozen dark" | "Too close — radiation strips the surface" |
| soil | Soil Richness | 20–100 | "Barren rock — nothing to eat" | (no upper penalty — more soil always helps) |

**Life Probability Indicator** (new in v0.2):
A single number below all sliders: `LIFE PROBABILITY: 73%`
Updates live as sliders move. Color: green (>60%), amber (30–60%), red (<30%).
This number teaches the player that every slider matters — moving one crashes the score.

### Era Selection

Two cards below the sliders:

```
⚔  ANCIENT ERA                    🏙  MODERN ERA
Oral myths · stone to iron         Industry · nuclear · fast collapse
Plagues spread by rumor            Internet conspiracies
Civilizations last 300–800 yrs     Civilizations last 80–200 yrs
```

Selected state: subtle green border glow. Unselected: dim border.

### Seed Life Button

- Disabled until era is selected
- Label: "Seed Life →"
- On click: emits `EventBus.emit('setup:complete', planetConfig)`
- Does NOT show a loading screen — game starts immediately, first dot appears within 1 second

### Planet Preview (150px circle)

Updates live based on slider health score:
- All safe: blue-green, slight glow
- 1–2 out: orange, no glow
- 3+ out: grey
- Extreme values: near-black, slight red tinge

---

## Planet.js

```javascript
export default class Planet {
  constructor(config) {
    this.sliders = {
      atmosphere: config.atmosphere ?? 50,
      water: config.water ?? 50,
      heat: config.heat ?? 50,
      gravity: config.gravity ?? 50,
      starDistance: config.starDistance ?? 50,
      soil: config.soil ?? 50
    }
    this.era = config.era
    this.tick = 0
    this.population = 0
    this.settlements = []
    this.agents = []
    this.myths = []
    this.religions = []
    this.interventionLog = []
    this.isAlive = true
    this.deathCause = null
    this.guaranteedMythFired = false  // tracks the tick-25 guaranteed myth
    this.techLevel = 0                // 0-5, drives container discovery unlock
    this.communicationSent = false    // has the "communicate with player" event fired
  }

  getHealthScore() {
    // Returns 0.0–1.0 based on slider proximity to safe zones
    // Used by planet preview and renderer for color state
  }

  getLifeProbability() {
    // Returns 0–100 integer for the setup screen indicator
    // Each slider contributes proportionally based on distance from safe zone midpoint
  }
}
```

---

## Conditions.js

```javascript
export const SAFE_ZONES = {
  atmosphere:   [35, 65],
  water:        [20, 80],
  heat:         [30, 70],
  gravity:      [25, 75],
  starDistance: [30, 70],
  soil:         [20, 100]
}

export function checkConditions(sliders) {
  // Returns { alive: Boolean, failureCause: String | null }
  // Check each slider — if any is outside safe zone AND population > 0, flag for death
  // Death is not instant: planet degrades over 10 ticks before dying
  // This gives the player time to see the decline and understand why
}

export function getFailurePostmortem(cause, sliders, myths, playerName) {
  // Returns full postmortem object — see prompt 07 for copy
  // playerName is derived by MythEngine — passed in here for post-mortem card
}
```

**All 7 failure modes** (copy in prompt 07):
1. Atmosphere Collapse
2. Toxic Pressure Death
3. Desert Extinction
4. Ocean World Extinction (new — water too high)
5. Frozen Stasis
6. Thermal Runaway
7. Natural Death (conditions fine — civilizational entropy)

---

## Output

1. FinetuningScreen — 4-second, unskippable, white-on-black real physics facts
2. SetupScreen — 6 sliders with live safe zone indicators + life probability %
3. Era selection — two cards, Ancient vs Modern
4. Planet preview — live color update
5. Seed Life button — disabled until era picked
6. Planet.js — state object with guaranteedMythFired + techLevel + communicationSent flags
7. Conditions.js — degradation over 10 ticks before death (not instant)
