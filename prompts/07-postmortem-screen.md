# PROMPT 07 — Post-Mortem Screen

## Context
Read `docs/CLAUDE.md` and `docs/ARCHITECTURE.md` before starting.
This prompt owns: `src/ui/PostMortem.js`
Triggered by: `EventBus.on('planet:death')`

---

## The Philosophy of This Screen

This is the trap closing. Not dramatically — quietly. The post-mortem is clinical and warm simultaneously: like an autopsy report written by someone who cared about the patient. It tells the player what killed their civilization scientifically, then what the civilization *believed* killed them, then their name in the myths, then their last myth. By the time the player reads their own name in someone else's scripture — they feel it. After the 5th run, one extra line appears. That line is the trap springing.

---

## Trigger Sequence

```javascript
EventBus.on('planet:death', ({ cause, tick, finalPop, myths, playerName }) => {
  // 1. Renderer plays death (planet drains to black, 2 seconds)
  // 2. 500ms pause — silence
  // 3. Dark overlay fades in (opacity 0 → 0.7, 1 second)
  // 4. Post-mortem card slides up from bottom (400ms ease-out)
  // 5. Card content reveals section by section (staggered)
  // 6. SimEngine paused, ticker frozen, intervention bar hidden
})
```

---

## Card Layout & Animation Sequence

```
┌──────────────────────────────────────────────────────────────┐
│  CIVILIZATION ENDED                          [0ms]           │
│  Year [tick] · [Era] · Final population: [N]                │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  CAUSE OF DEATH                              [200ms delay]   │
│  [Failure Mode Name]                                         │
│  [2–3 sentence scientific explanation]                      │
│                                                              │
│  WHAT THEY BELIEVED                          [400ms delay]   │
│  "[Human belief — their words, italic]"                     │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  YOUR NAME IN THEIR MYTHS                    [700ms delay]   │
│  "[Player Name]"          ← large, weighted                 │
│  In [N] myths across [N] settlements                        │
│  [N] religions formed around what you did                   │
│                                                              │
│  THEIR LAST MYTH                             [900ms delay]   │
│  "[Most recent myth entry]"                                 │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  FOR NEXT TIME                               [1100ms delay]  │
│  [One specific actionable hint]                             │
│                                                              │
│  [SEAL THIS PLANET]    [BUILD AGAIN →]       [1300ms delay]  │
│                                                              │
│  [5th-run message — 3 seconds after buttons] [5th run only] │
└──────────────────────────────────────────────────────────────┘
```

---

## The Player Name Section

This must land with weight. It's the emotional climax.

```javascript
// Large, centered, Space Mono font, 28px
// Color based on player behavior:
// - Sky Breaker (mostly meteors): accent-orange #ff8833
// - Generous Hand (mostly blessings): accent-green #6bffb8
// - Absent One (rarely intervened): text-dim #6868a8
// - Capricious One (mixed): accent-gold #ffcc44
// - Redeemer (destruction then blessing): magenta #ff44ff

// Below the name — 3 lines:
`In ${mythCount} myths across ${settlementCount} settlements, your presence was recorded.`
`${religionCount} religion${religionCount !== 1 ? 's' : ''} formed around what you did — or didn't do.`

// If player never intervened:
`In ${mythCount} myths, your people debated whether their creator existed at all.`
`${believerCount} of them decided you didn't. ${faithfulCount} kept the faith anyway.`
```

---

## All 7 Failure Mode Post-Mortems

### 1. Atmosphere Collapse

```
CAUSE OF DEATH: Atmosphere Collapse

Your atmosphere was too thin. Oxygen partial pressure never reached survivable
levels across the planet's surface. Settlements formed, and your civilization
began — but every generation was slower, shorter-lived, and less capable than
the last. They could never breathe deeply enough to dream.

WHAT THEY BELIEVED:
"The gods made the sky too small. We could never breathe deep enough to dream.
This was not a mistake. This was the test. We simply failed it."

FOR NEXT TIME: Raise Air Mix above 35. The safe band is 35–65. You had it at [X].
```

### 2. Toxic Pressure Death

```
CAUSE OF DEATH: Atmospheric Pressure Crush

Dense atmospheric pressure prevented complex biology from stabilizing. Organisms
evolved but could not achieve the structural complexity needed for civilization.
They were pressed into simplicity before they could begin.

WHAT THEY BELIEVED:
"The world itself was our enemy. The air pressed down on us from birth.
We have wondered: did the maker know? Or did they simply not check?"

FOR NEXT TIME: Lower Air Mix below 65. You had it at [X].
```

### 3. Desert Extinction

```
CAUSE OF DEATH: Moisture Cycle Failure

Without sufficient water coverage, the soil nutrient cycle collapsed within 40
generations. Settlements expanded until they hit the limits of dry land, then
turned on each other over the final springs.

WHAT THEY BELIEVED:
"The Provider forgot to fill the sky with rain. We waited at the edge of the
fields until there was nothing left to wait for. The waiting was the whole of
our history."

FOR NEXT TIME: Increase Water Coverage above 20. You had it at [X].
```

### 4. Ocean World Extinction

```
CAUSE OF DEATH: No Buildable Surface

Water coverage was so high that no stable landmass could support permanent
settlement. Life flourished in the shallows but never reached the complexity
that land demands. They had nowhere to build.

WHAT THEY BELIEVED:
"We were born to swim, not to reach. The one above must not have wanted us to
reach. Or perhaps they wanted us to reach and forgot to give us shore."

FOR NEXT TIME: Lower Water Coverage below 80. You had it at [X].
```

### 5. Frozen Stasis

```
CAUSE OF DEATH: Thermal Stasis

Surface temperatures never sustained liquid water at scale. Life began in
hydrothermal vents and warm shallow pockets, but could not colonize the surface.
The cold held everything still.

WHAT THEY BELIEVED:
"We were born in fire and meant to reach the ice. The fire never spread far
enough. We are not sure the maker knew this would happen. We are not sure
the maker checked."

FOR NEXT TIME: Raise Surface Temperature above 30. You had it at [X].
```

### 6. Thermal Runaway

```
CAUSE OF DEATH: Runaway Greenhouse Effect

A feedback loop between surface temperature and atmospheric absorption
accelerated beyond recovery in the third generation. The oceans boiled.
The sky turned orange. Nothing survived the century.

WHAT THEY BELIEVED:
"The Bringer of Fire was too generous with warmth. The warmth became wrath.
We burned in gratitude. In our final scripture: we forgave them."

FOR NEXT TIME: Lower Surface Temperature below 70. You had it at [X].
```

### 7. Natural Death — Civilizational Entropy

```
CAUSE OF DEATH: Civilizational Entropy

Your planet's conditions were survivable — perhaps even good. But civilizations
carry the seeds of their own undoing. Wars, plagues, and the slow grinding of
resources eventually consumed everything.

They lasted [tick] years. The average is [avg from run history].

WHAT THEY BELIEVED:
[Their actual last myth from this run]

FOR NEXT TIME: Nothing was wrong with your planet.
Drop something in next time. See what they do with it.
```

---

## The 5th Run Message

Tracked via localStorage key `terrarium_planet_runs`.
After the retry buttons appear and 3 seconds pass:

```javascript
if (runCount >= 5) {
  // Append below the buttons, fade in, Space Mono 12px, dim white, centered
  // No animation beyond simple opacity fade
  // Retry button disabled for 5 seconds while this is visible
  const msg = document.createElement('div')
  msg.className = 'meta-message'
  msg.innerHTML = `
    You have run ${runCount} civilizations.<br>
    Each one wondered about its creator.<br><br>
    You have never wondered about yours.<br><br>
    <em>Why not?</em>
  `
  // Style: Space Mono, 12px, #888888, centered, max-width 300px, margin: 24px auto 0
  // No border. No box. Just text in the silence.
}
```

This is the trap springing. No explanation. No follow-up. Just that.

---

## Buttons

### [SEAL THIS PLANET]
- Saves run to localStorage (max 5 stored) — myth museum seed
- Brief "sealed" animation: planet thumbnail shrinks to small orb
- Returns to setup screen
- Increments `terrarium_planet_runs` count

### [BUILD AGAIN →]
- Returns to setup screen immediately
- Pre-fills sliders with hint correction applied
- Subtle label under sliders: "Adjusted from last run"
- Increments `terrarium_planet_runs` count
- Skips fine-tuning screen on retry (player has seen it)

---

## Visual Design

- Overlay: `rgba(0,0,0,0.85)` over the dead planet
- Card: `#0d0d1f` background, `1px solid #2a2a4a` border, `border-radius: 8px`
- Header: Space Mono, 11px, letter-spacing 0.15em, `#6868a8`
- Cause name: Space Mono, 20px, `#e8e8ff`
- Explanation text: Inter, 14px, `#c8c8e8`, line-height 1.7
- "WHAT THEY BELIEVED": italic, `#a8a8c8`
- Player name: Space Mono, 28px, color based on archetype (see above)
- "YOUR NAME IN THEIR MYTHS" label: 10px, letter-spacing 0.2em, `#6868a8`
- Last myth: italic, 13px, `#a8a8c8`, left gold border
- 5th run message: 12px, `#888888`, centered, no decoration

---

## Output

1. Full post-mortem card with staggered animation (7 sections)
2. All 7 failure mode copy blocks
3. Player name displayed with correct archetype color
4. Last myth from the run
5. 5th-run meta message with 3-second delay + 5-second button lock
6. Seal + Retry buttons with slider prefill on retry
7. Fine-tuning screen skipped on retry
8. Run count increment on both buttons
