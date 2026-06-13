# FABLE-SPEC.md — Terrarium Planet Prototype
**Complete frame-by-frame specification for the Fable clickable demo.**  
**Hand this directly to a Fable designer. No questions needed.**

---

## Overview

5 screens. ~12 frames total. One clickable loop: Setup → Watch → Fail → Post-Mortem → Retry.
The demo should be completable in under 5 minutes.

---

## Visual System

### Colors
- `#0a0a12` — background (deep space)
- `#1a1a2e` — UI card / panel surface
- `#2a2a4e` — elevated surface / button resting
- `#e8d5a3` — warm accent (ancient civilization glow)
- `#4fc3f7` — cool accent (water, life, science)
- `#ff6b35` — danger / intervention orange
- `#7bc67e` — life / growth green
- `#ffffff` at 10% opacity — subtle borders

### Typography
- Display / Headers: **Space Grotesk** (Google Fonts), Bold
- Body / Labels: **Inter**, Regular
- Ticker / data readout: **JetBrains Mono**, Regular

### Planet States (the circular planet element)
- Healthy: blue-green gradient, subtle cloud ring, soft glow
- Too cold: icy grey-blue, frost texture overlay
- Too hot: orange-red, shimmer effect
- No water: dusty brown, cracked surface lines
- Dead: flat grey, no glow, slight desaturation of whole screen

---

## Screen 1 — Planet Shop / Onboarding
**Frame count: 1**  
**Purpose:** First impression. Player "buys" their planet. Sets the tone.

### Layout
Full screen. Dark (#0a0a12).

Center: Large header text  
`"Every god starts with an empty container."`  
Subtext (Inter, small): `"Configure your world. Seed life. Watch what happens."`

Below: A large circular planet (empty, grey, slowly rotating) — the player's blank canvas.

Below planet: One large CTA button  
`"Open Your Planet"` → navigates to Screen 2

### Hotspots
- "Open Your Planet" button → Screen 2

### Transition
Fade in on load. Click → fade out, fade into Screen 2.

---

## Screen 2 — Environment Setup
**Frame count: 3** (default state, slider adjusted, ready to start)

### Frame 2A — Default Setup (all sliders at 50%)

**Layout: Two column**
- LEFT (55%): Planet preview (large circle, animated, responds to sliders)
- RIGHT (45%): Slider panel

**Planet preview:**
Shows a medium-health planet (blue-green, slightly muted)

**Slider panel (top):**  
Label: `"Configure your world"`

6 sliders, stacked vertically:
Each slider has:
- Icon (small, left)
- Plain English label (left)
- Track with **golden zone marker** (a highlighted segment showing safe range)
- Handle (circle, draggable)
- No numbers — visual only

```
💨  Air Mix          ████░░░░░░ [handle at 50%]   SAFE ZONE indicator
💧  Water Cover      ████░░░░░░
🌡  Heat Shield      ████░░░░░░
🌍  Gravity          ████░░░░░░
☀️  Star Distance    ████░░░░░░
🌱  Soil Richness    ████░░░░░░
```

**Era selector (below sliders):**  
Two large cards side by side:
- `🏺 Ancient World` — "Stone age. Oral myths. Slow progression."
- `⚡ Modern World` — "Industry. Science. Faster collapse."
Ancient selected by default (highlighted border).

**Start button (below era):**  
`"Seed Life"` — enabled, teal (#4fc3f7)

### Frame 2B — Slider Dragged Wrong (Air Mix too low)
Everything same as 2A, except:
- Air Mix slider: handle dragged far left
- Planet preview: shifts to grey-blue tinted (less oxygen visual)
- Air Mix track: turns orange
- Small warning badge appears below slider: `"Breathless Zone"`

### Frame 2C — Ready to Start (good settings)
Everything same as 2A, except:
- Planet preview: bright blue-green, glowing
- "Seed Life" button: pulses slightly

### Hotspots
- Any slider → Frame 2B (demonstrate wrong setting) or 2C (correct setting)
- Ancient World card → select it (Frame 2A)
- Modern World card → select it (same frame, different card highlighted)
- "Seed Life" → Screen 3

### Transitions
- Slider interaction → instant state update (same frame, element changes)
- "Seed Life" → planet zooms out, stars appear, transitions to Screen 3

---

## Screen 3 — Watch Screen
**Frame count: 4** (fresh start, healthy state, intervention, late civilization)

### Frame 3A — Fresh Start (Year 1)
**Layout: Two panel**
- LEFT (70%): Canvas — planet with no dots yet
- RIGHT (30%): Side panel

**Canvas (left):**
- Large circular planet (the same one from setup)
- Black starfield background
- Planet is bare — no settlements yet
- Year counter top-center: `"Year 1"`
- Population: `"0 souls"`

**Side panel (right):**  
Top section — Civilization Ticker:
```
[Year 1] Life begins.
```
(Just this one line. Empty below.)

Middle section — Intervention Buttons (greyed out, not yet active):
```
🌑 Send Meteor
🌧 Cause Drought
☀️ Bless Harvest
🦠 Release Plague
```

Bottom: `"Read Their Myths →"` (greyed out)

### Frame 3B — Healthy Civilization (Year 500)
**Canvas:**
- Planet glowing blue-green
- Small clusters of warm-tinted dots (settlements)
- Night side: tiny glowing points (settlement lights)
- Year: `"Year 500"`
- Population: `"12,483 souls"`

**Ticker (right):**
```
[Year 500] The Order of the Northern Winds established — first temple built
[Year 487] The Pale Faction and the River Clan sign the Reed Treaty
[Year 471] A philosopher named Vera writes of "the edge of all things"
[Year 453] Settlement "Korrath" reaches 2,000 inhabitants
[Year 441] Metallurgy discovered in the eastern settlements
[Year 410] The third great war ends — 8,400 dead
[Year 391] Settlement "Ardenmoor" established near the delta
...
```

**Intervention buttons: ACTIVE**
```
🌑 Send Meteor      [orange glow on hover]
🌧 Cause Drought
☀️ Bless Harvest
🦠 Release Plague
```

**"Read Their Myths →"** — active, warm glow

### Frame 3C — Post-Meteor (just after intervention)
**Canvas:**
- Bright flash ripple emanating from impact point
- Part of planet surface turned orange-red at impact zone
- Some dots (agents) scattered/removed from impact area

**Ticker:**
```
[Year 501] ★ INTERVENTION: A meteor strikes the southern region
[Year 501] 1,203 perish in the impact. Three settlements destroyed.
[Year 501] Survivors flee north. The factions mobilize.
[Year 500] The Order of the Northern Winds established...
```

### Frame 3D — Late Civilization / Philosophy Layer (Year 800)
**Canvas:**
- Planet slightly brighter, more dots, more settlement clusters
- Year: `"Year 847"`
- Population: `"34,201 souls"`

**Ticker:**
```
[Year 847] The High Priest of the Falling Star predicts a second meteor
[Year 831] Observatory built in Korrath — instruments pointed at the edge of the sky
[Year 822] The Book of the Falling Star written — now scripture
[Year 810] A thinker named Olen asks: "What if the world has walls?"
[Year 803] The Order of the Falling Star now has 14,203 believers
...
```

### Hotspots
- "Send Meteor" → Frame 3C
- "Read Their Myths →" → Screen 4 (Myth Log)
- Planet can be "clicked" (zoom in) → Screen 3D with a person panel overlay (bonus frame)

### Transitions
- Frame 3A → 3B: auto-advance (show a "time passing" animation — ticker fills up, dots appear)
- Intervention button click → instant frame 3C

---

## Screen 4 — Myth Log
**Frame count: 2** (early myths, late myths/scripture)

### Frame 4A — Early Myths

**Full screen. Dark background.**

Header: `"The Myths of Ardenmoor"`  
Subtext: `"As recorded by those who lived within it."`

Scrollable myth cards:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Year 501                    [MYTH]
"Fire fell from the sky. The valley burned for three days. 
We do not know why."
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Back button:** `"← Return to your planet"`

### Frame 4B — Later, With Scripture

Same layout, but first card is now SCRIPTURE:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Year 501                 [SCRIPTURE]
"And lo, the heavens opened and the Great Burning came
upon the valley, that the faithful might know the power
of that which watches from beyond the sky..."
— The Order of the Falling Star · 14,203 believers
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Year 501                    [LEGEND]
"The Sky God punished the valley people for their pride.
Three settlements burned. The survivors walked north."
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Share button:** `"Screenshot This"` (top right, subtle)

### Hotspots
- "← Return to your planet" → Screen 3 (Frame 3D)
- "Screenshot This" → static screenshot state (just for demo: same frame + "Copied!" toast)

---

## Screen 5 — Post-Mortem / Fail State
**Frame count: 2** (one failure type shown in detail, retry state)

### Frame 5A — Post-Mortem Card

**Full screen dark. Center card (max 600px wide):**

Top: Grey planet thumbnail (still, dark, dead)

`"They lived for 47 years."`

Cause section:
```
BREATHLESS WORLD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The atmosphere was too thin. Without sufficient oxygen,
settlements could not sustain fire. Without fire, there
was no warmth through winter.

They survived one generation. Then silence.
```

Safe band visual:
```
Air Mix
│░░░░░░[✗]░░░░░░│████████│░░░░░░░░░│
         your   safe zone →
         choice
```

What They Believed (italic, dimmer):
`"In the last inscription found: 'The sky-breath was stolen. We pray it returns.'"`

Fix suggestion:
`"Next time: increase Air Mix past the halfway point to enter the breathable zone."`

Two buttons:
- `"Try Again"` (primary, teal)
- `"Read Their Myths"` (secondary, ghost button)

### Frame 5B — Same as 5A but different failure (Parched Earth)
Shows "They lived for 23 years" — even shorter run.
Different failure text. Same layout.

### Hotspots
- "Try Again" → Screen 2 (Frame 2A — reset)
- "Read Their Myths" → Screen 4 (Frame 4A)

---

## Frame Count Summary

| Screen | Frames | Names |
|---|---|---|
| 1 — Onboarding | 1 | 1A |
| 2 — Setup | 3 | 2A, 2B, 2C |
| 3 — Watch | 4 | 3A, 3B, 3C, 3D |
| 4 — Myth Log | 2 | 4A, 4B |
| 5 — Post-Mortem | 2 | 5A, 5B |
| **TOTAL** | **12** | |

---

## Hotspot Map Summary

| From | Trigger | To |
|---|---|---|
| 1A | "Open Your Planet" | 2A |
| 2A | Slider drag wrong | 2B |
| 2A | Slider drag correct | 2C |
| 2A/2B/2C | "Seed Life" | 3A |
| 3A | Auto / time skip | 3B |
| 3B | "Send Meteor" | 3C |
| 3B/3C | "Read Their Myths" | 4A |
| 3D | — | stays 3D |
| 4A | scroll / time skip | 4B |
| 4A/4B | "← Return" | 3D |
| 5A | "Try Again" | 2A |
| 5A | "Read Their Myths" | 4A |

---

## Transitions

| Transition | Animation | Duration |
|---|---|---|
| 1A → 2A | Fade | 400ms |
| 2A → 3A | Planet zooms out to starfield | 800ms |
| 3A → 3B | Ticker fills, dots appear (simulate time) | 1s |
| 3B → 3C | Flash ripple from impact, instant | 300ms |
| Any → 4A | Slide up | 400ms |
| Any → 5A | Fade to dark, card fades in | 600ms |
| 5A → 2A | Fade | 400ms |

---

## Designer Notes

- The planet element should be the same component reused across all screens — it transforms, it doesn't replace
- The ticker is the heartbeat of the game — it must feel alive, not static (use scroll + subtle entry animations)
- The myth cards are the emotional hero — give them the most typographic care
- Every screen should feel like you're looking at something delicate inside a glass container
- The "Goldilocks zone" on sliders is the most important affordance — make it unmissable
