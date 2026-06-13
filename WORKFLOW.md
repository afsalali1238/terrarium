# WORKFLOW.md — Terrarium Planet
**How this project gets built, phase by phase.**

---

## Phase 0 — Prototype (Week 1–2)
**Tool:** Fable  
**Goal:** Clickable demo of the 5-screen loop. No code. Validate the feel.

### Deliverables
- [ ] Screen 1: Planet Shop / Onboarding
- [ ] Screen 2: Slider Setup (6 sliders + era selector)
- [ ] Screen 3: Watch Screen (static planet, mock ticker, 3 intervention buttons)
- [ ] Screen 4: Post-Mortem card (1 failure example)
- [ ] Screen 5: Retry screen

### Done When
Player can click through the full loop in under 5 minutes and understand the concept without explanation.

---

## Phase 1 — Core Engine (Week 3–4)
**Tool:** Antigravity / Claude  
**Goal:** Simulation runs. No visuals yet. Verify in console.

### Build Order
1. `game-state.js` — state shape + localStorage
2. `slider-engine.js` — habitability math
3. `myth-templates.js` — 20 templates minimum
4. `event-templates.js` — 30 ticker strings minimum
5. `era-configs.js` — ancient config only
6. `myth-engine.js` — seed, age, stage
7. `event-generator.js` — emit strings
8. `simulation.js` — full tick loop

### Done When
Running `simulation.tick()` 3000 times in console produces:
- Population growth curve
- Settlement names
- Myth seeds aging into religions
- Extinction event with cause identified

---

## Phase 2 — First Visual (Week 5–6)
**Tool:** Antigravity / Claude  
**Goal:** See the planet. Dots move. Ticker streams.

### Build Order
1. `index.html` + `main.js` skeleton
2. `planet-view.js` — PixiJS canvas, LOD dots
3. `setup-screen.js` — sliders, era picker, start button
4. `watch-screen.js` — canvas + ticker panel
5. `postmortem-screen.js` — failure card
6. Wire navigation: setup → watch → postmortem → setup

### Done When
Player can:
1. Set sliders
2. Click Start
3. Watch dots appear and multiply (or die)
4. See ticker events stream
5. See post-mortem when civilization dies
6. Click Retry and go back to sliders

---

## Phase 3 — Myth Engine Live (Week 7–8)
**Tool:** Antigravity / Claude  
**Goal:** Interventions work. Myths appear in ticker. Myth Log is readable.

### Build Order
1. Intervention buttons wired to `myth-engine.seed()`
2. Myth aging visible in ticker (seed → legend → religion → canon)
3. `myth-log.js` — scrollable journal of all myths
4. Religion names generated and shown in ticker

### Done When
Player drops a meteor, waits 500 in-game years, and can read:
- The original event (seed)
- The legend that formed
- The religion name
- That it's now in their holy book

---

## Phase 4 — Zoom Levels (Week 9–10)
**Tool:** Antigravity / Claude  
**Goal:** Zoom from planet to a named person.

### Build Order
1. `zoom-controller.js`
2. `region-view.js` — terrain tiles, faction borders
3. `village-view.js` — buildings, named settlement
4. `person-panel.js` — HTML overlay, named human, their beliefs

### Done When
Player can click the planet → zoom to a region → click a settlement → see a named person and what religion they follow (one you created).

---

## Phase 5 — Simulation Hypothesis Arc (Week 11–12)
**Tool:** Antigravity / Claude  
**Goal:** All 3 layers unlock. Discovery Ending fires.

### Build Order
1. Philosophy layer events (year 500+)
2. Science layer events (year 1500+)
3. Discovery ending (year 3000+) — simulation pause, message appears

### Done When
A run reaching year 3000+ triggers the Olen IX moment. The screen pauses. The message appears inside the game world.

---

## Phase 6 — Polish & v1 Release (Week 13–16)
**Goal:** Browser-playable, shareable link.

### Tasks
- [ ] Visual polish — planet health states, biome colors
- [ ] Post-mortem: extinction myths (what the humans believed killed them)
- [ ] Modern era content (second era)
- [ ] Myth Log screenshot export (share button → PNG)
- [ ] Mobile responsive (read-only watch, no interaction)
- [ ] Vercel deploy

---

## Prompting Strategy for AI Agents

### Per-File Prompt Template
When asking an AI agent to build a file, always provide:

```
Context: [paste relevant section of CLAUDE.md]
File to build: [filename]
Depends on: [list dependencies already built]
Inputs: [what data comes in]
Outputs: [what this file exports]
Core logic: [paste relevant architecture section]
Do not: [list things to avoid]
Test by: [how to verify it works]
```

### Session Start Protocol
Every new agent session starts with:
1. Read MEMORY.md — understand current project state
2. Read CLAUDE.md — understand rules
3. Read ARCHITECTURE.md — understand the system
4. Ask: "Which phase are we on? Which file are we building?"

---

## Handoff Checklist (Between Sessions)
After each build session, update MEMORY.md:
- [ ] Which files were completed
- [ ] Which files are in progress
- [ ] Any decisions made (add to Decisions Log)
- [ ] Any open questions discovered
- [ ] Current system status

---

## Testing Protocol

### After Each File
- Paste file into browser console or Vite dev server
- Run the manual test described in ARCHITECTURE.md Build Order
- Confirm output matches expected before moving to next file

### After Each Phase
- Full loop walkthrough: setup → watch → intervention → myth → death → postmortem → retry
- Check: does every intervention produce a myth seed?
- Check: does the ticker always have `[Year N]` prefix?
- Check: does postmortem always identify the failed slider?
