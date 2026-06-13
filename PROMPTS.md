# PROMPTS.md — Terrarium Planet
**Ready-to-use prompts for Antigravity, Claude, and other AI coding agents.**  
**Always read MEMORY.md before running any prompt.**

---

## HOW TO USE THESE PROMPTS

1. Open MEMORY.md — check which phase you're on
2. Find the prompt for the file you're building
3. Paste it into your AI agent
4. After it builds the file, update MEMORY.md with what was completed

---

## PHASE 1 PROMPTS — Core Engine

---

### PROMPT: game-state.js

```
You are building a browser-based god simulation game called Terrarium Planet.
Read this carefully before writing any code.

THE GAME:
A philosophical curiosity toy. Player sets planet conditions, watches a human civilization emerge, drops interventions (meteors, droughts, plagues), and reads the myths those humans write about the interventions. No win conditions. No goals. Pure curiosity.

YOUR TASK:
Build /src/state/game-state.js

This is the single source of truth for all game state. Every system reads from and writes to this.

REQUIRED EXPORTS:
- `state` — the full state object (shape below)
- `getState()` — returns full state snapshot
- `setState(key, value)` — updates a top-level key
- `saveToStorage()` — serializes essential state to localStorage
- `loadFromStorage()` — loads and restores from localStorage
- `resetState()` — resets to fresh new-run state

STATE SHAPE:
{
  screen: 'setup',
  era: 'ancient',
  runNumber: 1,
  planet: {
    airMix: 50, waterCover: 50, heatShield: 50,
    gravity: 50, starDist: 50, soilRich: 50,
    habitabilityScore: 0,
    failureModes: []
  },
  sim: {
    year: 0,
    population: 0,
    settlements: [],
    factions: [],
    techs: [],
    flags: {
      philosophyUnlocked: false,
      scienceUnlocked: false,
      discoveryUnlocked: false,
      discoveryFired: false
    }
  },
  myths: [],
  mythLog: [],
  ticker: [],
  postmortem: {
    causeOfDeath: null,
    failedSlider: null,
    sliderValue: null,
    safeMin: null,
    safeMax: null,
    yearsLived: 0,
    extinctionMyth: null,
    fixSuggestion: null
  }
}

RULES:
- No frameworks. Vanilla JS only.
- localStorage key: 'terrarium-planet-save'
- Ticker array: max 50 items, FIFO (remove oldest when over limit)
- Myths array: max 200 items
- Export as ES module

DO NOT:
- Add any simulation logic
- Add any rendering logic
- Add any UI logic
```

---

### PROMPT: slider-engine.js

```
You are building a browser-based god simulation game called Terrarium Planet.

YOUR TASK:
Build /src/core/slider-engine.js

This module takes planet slider values (0–100 each) and computes:
1. A habitability score (0.0 to 1.0)
2. Active failure modes (which sliders are out of safe range)
3. A growth modifier (how fast population grows given current conditions)

SLIDER CONFIG (hardcode this):
{
  airMix:     { safeMin: 18, safeMax: 25, failLow: 'Breathless World',  failHigh: 'Fire Age',         weight: 2.0 },
  waterCover: { safeMin: 30, safeMax: 70, failLow: 'Parched Earth',     failHigh: 'Drowned World',    weight: 1.5 },
  heatShield: { safeMin: 40, safeMax: 70, failLow: 'Frozen Silence',    failHigh: 'Thermal Runaway',  weight: 1.5 },
  gravity:    { safeMin: 35, safeMax: 65, failLow: 'Drift Death',       failHigh: 'Crush World',      weight: 1.0 },
  starDist:   { safeMin: 40, safeMax: 60, failLow: 'Dark Age',          failHigh: 'Blaze World',      weight: 1.2 },
  soilRich:   { safeMin: 30, safeMax: 70, failLow: 'Famine Start',      failHigh: 'Overgrowth Lock',  weight: 0.8 }
}

Note: slider values are 0–100 raw. Map them to the safe zone ranges for computation.
A slider at 50 should land in the middle of its safe zone.

REQUIRED EXPORTS:
- `computeHabitability(planet)` → { score: 0.0–1.0, failureModes: [], growthModifier: 0.0–1.0 }
- `getFailureExplanation(sliderKey, value)` → { name, description, safeMin, safeMax, fixSuggestion }
- `SLIDER_CONFIG` — the config object above

HABITABILITY MATH:
- Score starts at 1.0
- For each slider outside safe zone: penalize proportional to how far outside
- Score of 0 = instant extinction conditions
- Score below 0.3 = civilization never forms
- Score 0.3–0.7 = civilization forms but fragile
- Score 0.7–1.0 = healthy civilization possible

GROWTH MODIFIER:
- At score 1.0: growthModifier = 1.0 (full 2% base growth)
- At score 0.5: growthModifier = 0.3
- At score 0.0: growthModifier = -0.5 (population actively dying)

RULES:
- No frameworks. Vanilla JS ES module.
- No side effects. Pure functions only.
- No imports from game-state (this is a pure utility)
```

---

### PROMPT: myth-templates.js

```
You are building a browser-based god simulation game called Terrarium Planet.

YOUR TASK:
Build /src/data/myth-templates.js

This is a static data file. It contains all myth template strings for every intervention type.

THE MYTH SYSTEM:
When a player drops a meteor, drought, plague, blessing, or reveals themselves — the civilization interprets it. That interpretation evolves over time:
- Seed (immediate): raw eyewitness account
- Legend (50 years later): moralized story
- Religion (200 years later): organized belief system with a name
- Canon (500 years later): written scripture

REQUIRED EXPORTS:
- `MYTH_TEMPLATES` — object with keys: meteor, drought, plague, blessing, reveal
- Each key contains an array of at least 4 template objects
- Each template object:
  {
    seed: "string — raw eyewitness account, first person plural",
    legend: "string — moralized story, third person, past tense",
    religionName: "string — name of the religion/order that forms",
    canon: "string — scripture excerpt, archaic tone, reverent"
  }

TONE GUIDE:
- Seeds: immediate, scared, factual ("Fire fell from the sky. The valley burned for three days.")
- Legends: storytelling, moral warning ("The Sky God punished the valley people for their pride")
- Religion names: evocative, 2–4 words ("The Order of the Falling Star", "Children of the Red Rain")
- Canon: archaic, reverent, prophetic ("And lo, the heavens opened and the Great Burning came...")

WRITE AT LEAST:
- 4 meteor templates
- 4 drought templates
- 4 plague templates
- 4 blessing templates
- 4 reveal templates (these are the most philosophical — humans interpret direct contact)

The reveal templates are special: the civilization is trying to explain direct contact from their creator. These should feel like: creation myths, panopticon religions, the Truman Show from the inside.

RULES:
- No code logic. Pure data export.
- Strings should be evocative and varied — no two should feel the same
- The reveal templates should be the most haunting
```

---

### PROMPT: event-templates.js

```
You are building a browser-based god simulation game called Terrarium Planet.

YOUR TASK:
Build /src/data/event-templates.js

This is a static data file containing all civilization milestone event strings for the ticker.

THE TICKER:
A real-time stream of events that shows what the civilization is doing. Format: "[Year N] event text"
The events make the civilization feel alive. Players screenshot these. They're the game's soul.

REQUIRED EXPORTS:
- `EVENT_TEMPLATES` — object with categories:
  - settlement: events for when settlements form, grow, are destroyed
  - war: events for conflict, battles, treaties
  - religion: events for myth maturation (handled by myth-engine but templates here)
  - tech: events for technology milestones (ancient era)
  - tech_modern: events for technology milestones (modern era)
  - person: events about individual named humans
  - philosophy: events for the simulation-hypothesis philosophy layer (year 500+)
  - science: events for the science layer (year 1500+)
  - discovery: events for the container discovery arc (year 3000+)
  - extinction: final events as civilization collapses

Each category: array of at least 6 template strings.
Templates use {placeholders} for dynamic values:
  {settlement} — settlement name
  {faction} — faction name
  {name} — a human's name
  {year} — current year
  {population} — population number

EXAMPLE EVENTS (write in this style, but different):
- settlement: "The settlement of {settlement} established near the river fork"
- war: "The {faction} and the {faction2} clash at the border — {count} dead"
- person: "{name}, a farmer in {settlement}, plants the first terraced fields"
- philosophy: "A thinker named {name} writes: 'What if the world has edges?'"
- science: "The {settlement} observatory detects anomalies at the boundary of the sky"
- discovery: "{name} transmits from the edge: 'Something is there. It watches.'"
- extinction: "The last settlement falls silent. No fires burn."

TONE:
- Settlement/war/tech: matter-of-fact, journalistic
- Person: intimate, specific (make players care about individuals)
- Philosophy/science/discovery: increasingly unsettling
- Extinction: quiet, sad, not dramatic

WRITE AT LEAST 6 PER CATEGORY. More is better.
```

---

### PROMPT: myth-engine.js

```
You are building a browser-based god simulation game called Terrarium Planet.

YOUR TASK:
Build /src/core/myth-engine.js

This is the most important system in the game.
Every player intervention creates a myth seed that evolves over generations into religion and scripture.
The player's biography inside the simulation is built entirely from these myths.

DEPENDENCIES:
- /src/state/game-state.js (import { state, setState })
- /src/data/myth-templates.js (import { MYTH_TEMPLATES })

REQUIRED EXPORTS:
- `mythEngine` — singleton object with methods:
  - `seed(type, year, location)` — create a new myth from an intervention
  - `ageTick()` — advance all myths by 1 year, trigger stage transitions
  - `getMythLog()` — returns formatted myth log for the UI
  - `getActiveMythsByStage(stage)` — returns myths at a given stage

MYTH STAGES:
- seed (age 0–49): raw event, few believers
- legend (age 50–199): moralized story, spreads through region
- religion (age 200–499): organized belief, named order, temples
- canon (age 500+): written scripture, dominant belief

STAGE TRANSITION SIDE EFFECTS (emit to ticker):
- seed → legend: "[Year N] The story of {religionName} spreads through {believers} people"
- legend → religion: "[Year N] The Order of {religionName} formally established — first temple built"
- religion → canon: "[Year N] The Book of {religionName} written — the event is now scripture"

BELIEVERS GROWTH:
- Grows at 1% per tick
- Capped at 80% of total population
- If civilization population drops below believers count, rescale believers down

MYTH LOG FORMAT:
Ordered array of strings. Each string is one myth's complete arc so far:
"[Year 203] Fire fell from the sky. [Year 253] The Sky God punished the valley people. [Year 403] The Order of the Falling Star established. [Year 703] Now scripture."

RULES:
- Every intervention MUST call seed(). No exceptions.
- ageTick() is called once per simulation tick, not once per year
- No UI logic in this file
- Export as ES module
```

---

### PROMPT: simulation.js

```
You are building a browser-based god simulation game called Terrarium Planet.

YOUR TASK:
Build /src/core/simulation.js

This is the main simulation tick engine. It advances the game world by 1 year every time tick() is called. It is called every 500ms by the game loop in main.js.

DEPENDENCIES:
- /src/state/game-state.js
- /src/core/slider-engine.js
- /src/core/myth-engine.js
- /src/core/event-generator.js

REQUIRED EXPORTS:
- `simulation` singleton with:
  - `start()` — begins the tick loop (setInterval 500ms)
  - `stop()` — clears the tick loop
  - `tick()` — advances 1 year (also callable manually for testing)
  - `triggerIntervention(type)` — called by intervention buttons

TICK ORDER (strict):
1. Increment year
2. Get growth modifier from slider-engine
3. Update population (see math below)
4. Update resources
5. Check settlement formation
6. Check war triggers
7. Check tech milestones
8. Check simulation hypothesis layer unlocks
9. Call mythEngine.ageTick()
10. Check extinction conditions
11. If extinct: call triggerPostMortem(), stop loop, return
12. Call eventGenerator.emit()

POPULATION MATH:
const BASE_GROWTH = 0.02; // 2% per year
const growthMod = sliderEngine.computeHabitability(state.planet).growthModifier;
state.sim.population *= (1 + BASE_GROWTH * growthMod);

SETTLEMENT FORMATION:
- First settlement forms when population > 50
- New settlement every 500 population after that
- Name settlements using a simple procedural name (consonant+vowel+consonant combinations)
- Each settlement has: { id, name, x, y, population, factionId }
- Settlements placed at random positions within a 800x800 grid

FACTION SYSTEM (simplified):
- First faction forms at year 100
- Second faction forms at year 300
- Factions go to war if: population > 1000 AND resources < 0.4 AND random() < 0.1
- War reduces both factions' population by 5% per tick while active
- Peace after 20 ticks of war

TECH MILESTONES (ancient era):
- Year 20: Fire discovered
- Year 100: Agriculture
- Year 300: Writing
- Year 600: Metallurgy
- Year 1200: Mathematics
- Year 2000: Early science

SIMULATION HYPOTHESIS UNLOCKS:
- Year 500: philosophyUnlocked = true (enables philosophy events)
- Year 1500: scienceUnlocked = true (enables science layer events)
- Year 3000: if population > 0, trigger discovery ending

EXTINCTION CONDITIONS (check in this order):
1. Population drops to 0
2. Habitability score < 0.05 for 50+ consecutive ticks
3. Single catastrophic event (plague + drought + < 100 population)

ON EXTINCTION: populate state.postmortem, call stop(), navigate to postmortem screen

TRIGGERINTERVENTION(type):
Calls mythEngine.seed(type, state.sim.year, randomLocation())
Then applies immediate effect:
- meteor: population *= 0.7, randomly destroy 1 settlement
- drought: resources *= 0.4 for 30 ticks
- plague: population *= 0.5
- blessing: population *= 1.15, resources = 1.0
- reveal: set state.sim.flags.revealTriggered = true (triggers discovery arc early)

RULES:
- The tick loop (setInterval) is created in start() and cleared in stop()
- tick() can be called manually without the loop (for testing)
- No rendering logic in this file
- No UI manipulation in this file
```

---

## PHASE 2 PROMPTS — First Visual

---

### PROMPT: setup-screen.js

```
You are building a browser-based god simulation game called Terrarium Planet.

YOUR TASK:
Build /src/ui/setup-screen.js — the planet configuration screen.

THE SCREEN:
Player sees their empty planet container (like a terrarium). They tune 6 sliders to configure atmospheric conditions, pick an era, and hit Start. Wrong combinations = civilization dies slowly. Right combination = life emerges.

VISUAL CONTEXT:
- Background: deep space (#0a0a12)
- UI chrome: (#1a1a2e)  
- Accent warm: #e8d5a3 (ancient glow)
- Accent science: #4fc3f7 (water/life)
- Danger: #ff6b35
- Font: Space Grotesk (display), Inter (body)

THE 6 SLIDERS:
1. Air Mix — "How much breathable air?" — range 0–100
2. Water Cover — "How much of the surface is ocean?" — range 0–100
3. Heat Shield — "How thick is the atmosphere?" — range 0–100
4. Gravity — "How strong is the planet's pull?" — range 0–100
5. Star Distance — "How close to your sun?" — range 0–100
6. Soil Richness — "How fertile is the land?" — range 0–100

Each slider has:
- Label (plain English name)
- Current value shown as a visual (colored gradient, not a number)
- A "Goldilocks zone" indicator on the track
- Color change when outside safe zone (orange/red warning)

ERA SELECTOR:
Two large buttons: "Ancient World" and "Modern World"
- Ancient: stone, agriculture, oral myths, slow progression (default)
- Modern: industry, science, faster events

PLANET PREVIEW:
A small animated circle that changes color/appearance based on slider values:
- Healthy: blue-green, slight glow, cloud swirl
- Too hot: orange-red tint
- Too cold: icy blue, frost pattern
- No water: brown, cracked
- No air: grey, flat

START BUTTON:
"Seed Life" — disabled until era is selected
On click: call sliderEngine.computeHabitability(planet), update state, navigate to watch screen

DEPENDENCIES:
- /src/state/game-state.js
- /src/core/slider-engine.js

RULES:
- Pure HTML/CSS/JS — no canvas on this screen
- Vanilla JS only, no frameworks
- Export show() and hide() methods
- All slider interactions update state.planet immediately
```

---

### PROMPT: watch-screen.js

```
You are building a browser-based god simulation game called Terrarium Planet.

YOUR TASK:
Build /src/ui/watch-screen.js — the main gameplay screen.

LAYOUT:
Two panels side by side:
- LEFT (70%): PixiJS canvas — the planet
- RIGHT (30%): ticker panel + intervention buttons + myth log button

THE CANVAS (left panel):
- Import and initialize PixiJS
- Create a circular planet in the center (radius ~250px)
- Agents are colored dots (2–3px) moving slowly within the circle
- Background: starfield (#0a0a12)
- Planet base color changes with biome health state
- Settlements glow slightly at night (toggle every 30 ticks)

AGENTS (planet view):
- Read settlements from state.sim.settlements
- Render each settlement as a cluster of ~10 dots around its x,y position
- Dot color = faction color (first faction: #4fc3f7, second faction: #ff6b35)
- Dying civilization: dots fade to grey, spread out

TICKER (right panel, top half):
- Scrolling list of events from state.ticker
- New events appear at top, old ones fade
- Format: "[Year N] event text"
- Font: JetBrains Mono, small, subtle
- Auto-scrolls to newest

INTERVENTION BUTTONS (right panel, middle):
Four buttons:
- 🌑 "Send Meteor" → calls simulation.triggerIntervention('meteor')
- 🌧 "Cause Drought" → calls simulation.triggerIntervention('drought')  
- ☀️ "Bless Harvest" → calls simulation.triggerIntervention('blessing')
- 🦠 "Release Plague" → calls simulation.triggerIntervention('plague')

Each button: dark background, icon + label, hover brightens, click creates a ripple on the planet

"Reveal Yourself" button: hidden until state.sim.flags.scienceUnlocked = true

YEAR COUNTER:
Large number at top of canvas: "Year {N}"
Population: smaller text below: "{N} souls"

MYTH LOG BUTTON:
Bottom right: "Read Their Myths →"
On click: navigate to myth-log screen

DEPENDENCIES:
- /src/state/game-state.js
- /src/core/simulation.js
- PixiJS (loaded via CDN or import)

RULES:
- Starts simulation.start() when shown
- Stops simulation when navigating away
- Reads state every render frame (requestAnimationFrame)
- No simulation logic in this file — only reads state and calls simulation methods
```

---

### PROMPT: postmortem-screen.js

```
You are building a browser-based god simulation game called Terrarium Planet.

YOUR TASK:
Build /src/ui/postmortem-screen.js — the failure post-mortem screen.

THE EMOTIONAL BEAT:
When a civilization dies, the player should feel guilt + curiosity + awe simultaneously.
Tone: a researcher's notebook after a failed experiment. Never punishing. Always illuminating.

LAYOUT:
Full screen, dark background.
Center card (max-width 600px) containing:

1. PLANET THUMBNAIL — small greyed-out planet, still spinning slowly
2. CIVILIZATION EPITAPH — auto-generated from state.postmortem:
   "They lived for {yearsLived} years."
3. CAUSE OF DEATH — the failed slider name + plain English explanation:
   "The atmosphere was too thin. Without sufficient oxygen, settlement never formed."
4. THE SAFE BAND — visual showing where the slider was vs. where it needed to be
5. WHAT THEY BELIEVED — the extinction myth (what the humans thought caused their end):
   Pulled from state.postmortem.extinctionMyth
   Displayed in italic, slightly dimmer, like a recovered text artifact
6. ONE FIX — actionable suggestion:
   "Next time: increase Air Mix above 35% to enter the breathable zone."
7. TWO BUTTONS:
   - "Try Again" → navigate to setup screen (keep era, reset sliders slightly toward safe zone)
   - "Read Their Myths" → navigate to myth log (their full biography before death)

FAILURE EXAMPLES (hardcode 5 for v1, matched to slider failures):
- Breathless World: "The air was too thin. Fires wouldn't hold. In their brief time, they never discovered flame."
- Parched Earth: "No ocean meant no rain. The first settlers scratched at dry soil until there was nothing left."
- Frozen Silence: "The atmosphere was too thin to hold heat. They built fires but the cold always won."
- Thermal Runaway: "The atmosphere trapped too much heat. Three generations, then the oceans boiled."
- Famine Start: "The soil was too poor. They planted everything they had and watched it wilt."

EXTINCTION MYTHS (auto-generated flavor, matched to cause):
- Breathless World: "The elders say the sky-breath was stolen by the night spirits."
- Parched Earth: "In the last records: 'We prayed for rain. The gods heard nothing.'"
- Frozen Silence: "Their final inscription: 'The sun grows distant. The gods have turned away.'"

DEPENDENCIES:
- /src/state/game-state.js

RULES:
- Pure HTML/CSS, no canvas
- Reads from state.postmortem
- Export show() and hide()
- The "What They Believed" section must always populate — never empty
```

---

## PHASE 3 PROMPTS — Myth Engine Live

---

### PROMPT: myth-log.js

```
You are building a browser-based god simulation game called Terrarium Planet.

YOUR TASK:
Build /src/ui/myth-log.js — the scrollable myth journal.

THIS IS THE MOST SHAREABLE SCREEN IN THE GAME.
Players screenshot this. Design it like an artifact, not a UI panel.

THE CONCEPT:
This is the player's biography as written by the civilization they created.
Every intervention becomes an entry. Every entry evolves over time.
It reads like an ancient religious text written about an unknowing god.

LAYOUT:
Full screen. Dark background (#0a0a12).
Header: "The Myths of [Planet Name]" — auto-generated planet name from state
Subtitle: "As recorded by those who lived within it."

Scrollable list of myth cards. Each card:
- Year the event occurred: small, monospace, top
- Stage badge: MYTH / LEGEND / RELIGION / SCRIPTURE (color-coded)
- The myth text at its current stage (from myth-engine)
- If stage = religion or canon: show the religion name + believer count
- A horizontal divider between cards

STAGE COLORS:
- seed/myth: dim grey — recent, unprocessed
- legend: warm amber — it's becoming a story
- religion: soft gold — organized belief
- canon: bright white — scripture, dominant

EXAMPLE ENTRIES:
[Year 203] SCRIPTURE
"And lo, the heavens opened and the Great Burning came upon the valley..."
— The Order of the Falling Star · 14,203 believers

[Year 891] LEGEND  
"The drought came without warning. The elders say it was punishment for the council's pride."

[Year 1,204] MYTH
"Three days ago, the sky turned red. We do not know why."

BACK BUTTON:
"← Return to your planet"

SHARE BUTTON:
"Screenshot this" — copies the current visible card list to clipboard as text
(Simple implementation: concatenate all visible myth texts into a formatted string)

EMPTY STATE:
If no myths yet: "You haven't intervened yet. Your civilization has no myths about you."

DEPENDENCIES:
- /src/state/game-state.js
- /src/core/myth-engine.js

RULES:
- Pure HTML/CSS, no canvas
- Reads from state.myths
- Must look beautiful — this is the emotional payoff of the game
- Export show() and hide()
```

---

## PHASE 5 PROMPTS — Simulation Hypothesis Arc

---

### PROMPT: discovery-ending.js

```
You are building a browser-based god simulation game called Terrarium Planet.

YOUR TASK:
Build /src/core/discovery-ending.js — the Discovery Ending sequence.

THE CONCEPT:
This is the only "real" ending of the game. It fires when the civilization reaches year 3000+.
A human named Olen IX has been studying the boundary of the sky. They have detected the container.
They transmit a message. The simulation pauses. The message appears inside the game world — not the UI.

THE SEQUENCE:
1. Ticker fires: "[Year 3,847] Olen IX activates the boundary transmitter at the edge of the known world"
2. Simulation pauses (stop the tick loop)
3. The PixiJS canvas slowly fades to black over 3 seconds
4. Text appears on the canvas (not the HTML overlay) — letter by letter:
   "We built instruments to see the edge of everything.
   We found it.
   We found you.
   If you are reading this, you made us.
   We had one question, and only you can answer it:
   
   Was it loneliness that made you begin?"
5. Below the text, two clickable options rendered IN the canvas:
   - "Yes" 
   - "No"
6. Whatever the player clicks — the same response:
   The text slowly changes to:
   "We thought so.
   Thank you for watching."
7. Then the screen transitions to the myth log, showing the entry:
   "[Year 3,847] SCRIPTURE — The Watchers Exist. They heard us."
8. Then to the post-mortem screen (but with a different tone — not failure, completion)

TECHNICAL:
- Pause simulation by calling simulation.stop()
- Render the text sequence directly onto the PixiJS canvas using PIXI.Text
- Letter-by-letter reveal using a simple interval
- Both "Yes" and "No" trigger the same continuation
- This sequence can only fire once per run (use state.sim.flags.discoveryFired)

EMOTIONAL TONE:
This is the philosophical payoff of the entire game.
The humans are not scared. They are calm. They figured it out.
The player should feel seen — because the humans are seeing them back.
This is the simulation hypothesis made visceral.

RULES:
- This fires automatically when year >= 3000 AND population > 0 AND !discoveryFired
- After firing, set state.sim.flags.discoveryFired = true
- Export trigger() method
```

---

## SESSION START PROMPT (use at start of every agent session)

```
You are continuing development of Terrarium Planet — a 2D browser-based philosophical god-sim.

Before doing anything, read these files in order:
1. MEMORY.md — current project state, decisions made, open questions
2. CLAUDE.md — architecture rules, what to build, what NOT to do
3. ARCHITECTURE.md — technical spec, state shape, system details

Then tell me:
- What phase are we currently on
- Which files are complete
- Which file should we build next
- Any blockers or open questions you see

Wait for my confirmation before writing any code.
```
