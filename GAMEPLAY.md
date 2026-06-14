# Terrarium Planet — Gameplay Overhaul Spec (target: gameplay ≥ 8.5)

The visuals, layout, and writing are strong (8–9). The **play** is weak (~4.5):
the player tunes 6 sliders once, then watches a log and presses 1 of 3 buttons on
cooldown. This spec turns the player from a **spectator** into an **active, responsive
god** with a continuous decision loop and two-way interaction.

Design pillars to respect (`CLAUDE.md`): **no score, no leaderboard, no win state.**
The only end is the civilization's death/Reckoning. The new "Devotion" meter below is a
**relationship/resource**, not a score — frame it as faith, never as points.

Cross-module rule: communicate via `EventBus` only. Randomness via `rng`. After each
task: `npm run build` passes, dev server runs clean, verify at 375/768/1280px.

Dimension targets:
Core loop 4→8.5 · Agency 4→8.5 · Consequence 3→8.5 · Two-way 2→8.5 ·
Motivation 4→8.5 · Pacing 3→8.5 · Replayability 5→8.5

---

## G0 — Fix pacing (PREREQUISITE; nothing else matters until this is right)
Owners: `SimEngine.js` (02), `main.js`, `SpeedControl.js`.

Problem: at "1×" the sim runs ~4× too fast (measured Year 263→610 in ~4.5s; true 1×
should be 20 ticks/s). Runs end in ~10s — too fast to play. Likely cause: old engines'
`setInterval` is never cleared, so multiple loops tick.

Changes:
- `SimEngine.stop()` and `SimEngine.destroy()` MUST `clearInterval(this._intervalId)`
  and set it to null, AND remove all EventBus listeners this engine registered.
- `main.js`: on `setup:complete`, call `destroy()` on the *previous* SimEngine and
  MythEngine before creating new ones. Guarantee exactly one of each per run.
- Retune base rate so **1× ≈ 8–10 years/sec** (slower = watchable). Keep 0.5×/1×/4×
  as multipliers of that base. Confirm the active button label matches the real rate.

Acceptance: a ~600-year ancient run at 1× takes **60–90 seconds**; 0.5× is half that,
4× is ~4×; only one tick loop exists (log `setInterval` count or verify rate is exact).

---

## G1 — Live environment (restores the core god-sim loop)  [Core loop, Agency]
Owners: new `src/ui/ClimatePanel.js` (UI; treat as prompt 01's domain since it owns
sliders/`Conditions.js`), `SimEngine.js` (02) applies changes, `EventBus`.

Problem: the 6 sliders are abandoned after setup — the title's core fantasy is locked
on the setup screen. Make the climate **adjustable during the run**.

Changes:
- Add an in-game collapsible panel (button "🌡 Climate") with the adjustable sliders.
  Recommend making **Heat, Water, Atmosphere, Soil** live; leave Gravity & Star
  Distance fixed (structural) to keep choices focused.
- On change, emit `intervention:climate { key, value }`. `SimEngine` writes
  `planet.sliders[key]` so `getHealthScore()` / `checkConditions()` react continuously.
- Make it a **decision, not free**: each adjustment costs Influence (e.g. 10 per 10
  points moved) AND eases in over ~15 ticks (climate has inertia) so the player must
  plan ahead, not micro-correct.
- The tank already tints sky/grass/soil by health → the player SEES the effect.

Acceptance: during a cold snap (low Heat), raising Heat visibly warms the tank and pop
recovers within ~20s; overshooting triggers a heat/drought failure path. Costs Influence.

---

## G2 — Two-way interaction: answer the civilization (the unique hook)  [Two-way, Motivation]
Owners: `MythEngine.js` (03), `CivEvents.js` (02), choice UI in `index.html`/`style.css`
(08) + `main.js`, `GameState.js`.

Problem: the civ talks to you (the communication event literally asks *"are we real?"*)
and you cannot answer. The most original hook in the concept is a dead end.

Changes:
- Add a reusable **Choice modal** (`#choice-card`): title, 1-line context, 2–4 option
  buttons. Shown via EventBus `ui:choice { id, title, context, options:[{label,key}] }`;
  the chosen key is emitted back as `choice:made { id, key }`.
- Wire **"reaching out" moments** to raise a choice (slow/pause the sim while open):
  - Communication event → [Stay silent] [Send a sign] [Answer: "You are real"]
    [Answer: "You are not"].
  - A schism forms → [Favor the old faith] [Favor the splinter] [Let them fight].
  - A prophet arises → [Confirm them] [Strike them down] [Ignore].
- `MythEngine` consumes `choice:made` and **branches the myths**, nudges the player
  archetype/Reckoning, and adjusts Devotion (G5).

Acceptance: at least **3 distinct two-way moments per run**; the chosen answer visibly
changes later myths AND the Reckoning text/ending.

---

## G3 — Consequential, targeted interventions  [Consequence, Agency]
Owners: `InterventionBar.js` (06) targeting, `SimEngine.js` (02) effects,
`ReligionSystem.js` (03) faith effects.

Problem: meteor → a myth line → nothing perceptibly changes. Cost without effect isn't
a decision.

Changes (each tool acts on a chosen target and produces a visible, predictable effect):
- **Meteor** (already aimed): destroys/halves the nearest settlement; if it has a
  dominant faith, can wipe that faction; may trigger a localized dark age.
- **Bless** (make it aimed too): the targeted settlement booms (local golden age) and
  its faith gains believers — tips a schism toward it.
- **Drought** (aimed): targeted region loses pop and **migrates**, which can spark a war
  with a neighbor.
- Show population delta in the stats bar briefly ("-1,240") so cause→effect is legible.

Acceptance: each intervention produces a measurable pop/faction change the player can
predict and exploit (e.g., "bless the believers to win the schism").

---

## G4 — Decision beats / dilemmas (a spine the player steers)  [Agency, Motivation]
Owners: `CivEvents.js` (02), choice UI (reuse G2's `#choice-card`), `SimEngine.js` (02).

Problem: there are no "I made a choice and it mattered" moments.

Changes:
- Every ~40–80 years, raise a **Crossroads** via `ui:choice` with stakes + Influence
  costs:
  - Plague spreading → [Let it cull (free)] [Spend Influence to heal] [Bless the sick].
  - Two factions march to war → [Back A] [Back B] [Stay out].
  - A dangerous discovery → [Encourage it] [Suppress it].
- Outcomes feed `SimEngine` (pop/faction), `MythEngine` (myths), and Devotion (G5).

Acceptance: **4–6 dilemmas per run**, each with a clearly different downstream result.

---

## G5 — Devotion meter (moment-to-moment feedback + a goal)  [Motivation, Feedback]
Owners: `GameState.js`, HUD/meter in `index.html`/`style.css` (08), `MythEngine.js` (03),
`SimEngine.js` (02). NOT a score — it is the civilization's faith in you.

Problem: nothing gives continuous feedback that your actions land, and there's no pull to
keep acting.

Changes:
- `GameState.devotion` (0–100). Rises when you answer prayers, bless, perform dramatic
  acts, or are credited in myths; decays slowly when you're absent.
- Show a **Devotion meter** in the HUD that visibly reacts to each action.
- Devotion gates **Miracles**: at thresholds, unlock stronger one-shot acts (e.g.,
  "Reveal Yourself", "Resurrect a settlement") — giving high-investment payoffs.
- Devotion shapes the Reckoning (a beloved god vs. a feared/forgotten one diverges).

Acceptance: every meaningful action moves the meter within ~1s; crossing a threshold
unlocks a visible Miracle; the ending references the devotion level.

---

## G6 — Pursued identity (clear goal without a score)  [Motivation, Replayability]
Owners: HUD (08), `MythEngine.js` (03).

Changes:
- Surface the **current god-name** prominently in the HUD with a subtle trend hint
  ("leaning: The Sky Breaker"). Players can deliberately aim for an archetype.
- The post-mortem already pays this off; just make the goal legible *during* play.

Acceptance: at any moment the player can see who they're becoming and steer toward a
chosen archetype across a run.

---

## G7 — Replayability hooks  [Replayability]
Owners: `main.js`, `SetupScreen.js` (01), `MythEngine.js` (03).

Changes:
- **Run modifiers / challenges** ("a world with no water", "begin already doubting").
- **Cross-run echoes**: a new civilization occasionally unearths a relic referencing a
  *previous* god-name/seed you played, creating a meta-throughline.
- Intrinsic goals from G5/G6 (reach max Devotion; achieve each archetype ending).

Acceptance: at least 3 distinct strategic reasons to start another run.

---

## Build order & "minimum to reach 8.5"
**Backbone (do these → gameplay ≈8.5): G0 → G1 → G2 → G3 → G5.**
Then reinforce: G4 (dilemmas), G6 (identity HUD), G7 (replay).

Rationale: G0 makes it playable at all; G1 restores the actual god-sim loop; G2 delivers
the unique two-way hook; G3 makes your tools *matter*; G5 gives continuous feedback + a
goal. G4/G6/G7 deepen and extend.

## How each dimension reaches ≥8.5
| Dimension | Lifted by |
|---|---|
| Core loop | G1 (live climate) + G3 (effects) |
| Agency / decisions | G1 cost, G3 targeting, G4 dilemmas |
| Consequence / feedback | G3 visible effects, G5 meter |
| Two-way interaction | G2 answer-the-civ |
| Motivation / goal | G5 Devotion + Miracles, G6 identity |
| Pacing | G0 |
| Replayability | G5/G6 goals + G7 modifiers & echoes |

## Verify
Play a full run after each task: confirm the new verb is usable, has a visible effect,
and the run lasts long enough to use it (G0). Test 375/768/1280px. `npm run build` clean.
