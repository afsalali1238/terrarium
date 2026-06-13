# PROMPT 06 — Intervention Tools

## Context
Read `docs/CLAUDE.md` and `docs/ARCHITECTURE.md` before starting.
This prompt owns: `src/ui/InterventionBar.js`

Emits events consumed by: SimEngine.js, MythEngine.js, Renderer.js

---

## Task

Build the intervention bar — the three tools the player uses to poke their terrarium. These are not weapons. They are curiosity instruments. The player uses them to see what happens, not to win.

---

## InterventionBar.js

HTML overlay fixed to the bottom of the screen (over the canvas).

### Layout

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│   [☄️ METEOR]     [🌵 DROUGHT]     [✨ BLESS HARVEST]      │
│   Send fire       Dry the rain     Feed them well          │
│   from above      for a season     for one harvest         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

- Fixed bottom center
- Each tool: icon + label + subtitle
- Cooldown state: tool greys out + shows timer after use
- Disabled state: when no settlements exist yet ("Seed life first")
- Visible at all zoom levels

---

## The Three Tools

### ☄️ METEOR

**Trigger:** Player clicks. Then clicks a point on the planet to aim.

**Cooldown:** 30 ticks (not usable again for 30 sim years)

**Simulation effects:**
- Destroys all agents within 15px radius of impact (instant death)
- Creates a "scar" terrain feature (dark mark) at impact site
- Reduces soil richness in surrounding area for 20 ticks
- Triggers `intervention:meteor` event with impact coords

**Renderer effects:**
- Bright flash at impact (white → orange → dark, 1 second)
- Scar mark appears and slowly fades over 50 ticks
- Camera shakes briefly (screen shake 200ms)

**Myth Engine response (guaranteed):**
- Tick 0: immediate event in ticker — "Fire fell from the sky above [settlement/region]"
- Tick 5-15: first myth entry created
- Tick 30-50: named religion or cult forms if settlement survived
- Tick 80+: the legend is fully codified — prophets, rituals, scripture

**Aim mode UI:**
- Click Meteor → cursor changes to crosshair
- Planet surface shows subtle targeting ring following cursor
- Click to confirm impact location
- Press ESC to cancel

---

### 🌵 DROUGHT

**Trigger:** Player clicks. Applies to a region (no targeting needed — affects nearest large settlement cluster).

**Cooldown:** 20 ticks

**Simulation effects:**
- Reduces water availability in affected region for 15 ticks
- Birth rate drops 40% in affected settlements during drought
- "Famine events" can trigger in CivEvents during active drought
- If drought overlaps with heat > 70: accelerates dying state

**Renderer effects:**
- Affected region terrain slowly shifts toward sandy/brown
- Water bodies in region shrink visually
- Settlement glows dim slightly
- Returns to normal after 15 ticks

**Myth Engine response:**
- Tick 0: "The rains stopped above [region]. The river [name] shrank to mud."
- Tick 10-20: water-prayer revival event, elders speaking of punishment
- Tick 30-50: water-keeper priests emerge, rationing rituals form
- If player then sends Bless Harvest: "The rains returned. The priests claimed credit."

---

### ✨ BLESS HARVEST

**Trigger:** Player clicks. No targeting — applies globally to all settlements.

**Cooldown:** 25 ticks

**Simulation effects:**
- Birth rate increases 60% for 10 ticks
- Death rate decreases 30% for 10 ticks
- Population boom follows
- Tech advancement accelerates slightly

**Renderer effects:**
- Subtle golden shimmer washes across the planet surface (particle effect)
- Settlement glows brighten and pulse once
- Planet base color shifts slightly warmer for 5 ticks

**Myth Engine response:**
- Tick 0: "An unprecedented harvest filled every storehouse in [settlement]."
- Tick 10-20: Gratitude myths form — "The Generous Hand touched our soil"
- Tick 30+: Shrine-building events, abundance faith grows
- If player then sends drought: "The Generous Hand has withdrawn. The Absence Sect forms."

---

## Cooldown UI

```javascript
// Each button shows cooldown countdown
// Visual: button darkens, timer text shows "Ready in: 12"
// When ready: button brightens, subtle pulse animation to catch eye

// Cooldown stored in ticks (not real seconds)
// Display as: "Ready in: X years"  (1 tick = 1 year)
```

---

## Intervention Log

Every intervention is logged for the Myth Engine's player-name derivation:

```javascript
// Appended to GameState.interventionLog on each use
{
  type: 'meteor' | 'drought' | 'bless',
  tick: Number,
  targetX: Number | null,
  targetY: Number | null,
  nearestSettlement: String
}
```

---

## Empty State

Before any life exists (tick < 10 or population = 0):
- All three buttons visible but faded
- Tooltip on hover: "Seed life before intervening"
- No click functionality

---

## EventBus

```javascript
// Emit on each intervention
EventBus.emit('intervention:meteor', { x, y, tick, nearestSettlement })
EventBus.emit('intervention:drought', { region, tick })
EventBus.emit('intervention:bless', { tick })
```

---

## Output

An intervention bar that:
1. Shows 3 tools with icons, labels, subtitles
2. Meteor has aim mode (click → target → confirm)
3. Each tool has cooldown timer in ticks
4. Emits correct events to SimEngine + MythEngine + Renderer
5. Logs every use for player-name derivation
6. Disabled gracefully before life exists
7. Always visible regardless of zoom level
