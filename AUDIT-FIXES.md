# Terrarium Planet — Audit Fix Plan (handoff)

Derived from the multi-disciplinary panel audit (composite ~6.8/10, propped up by a
9/10 narrative). The gameplay backbone (G0–G7) is in. This plan closes the gaps the
audit flagged: **flat difficulty, half-consequential systems, HUD clutter, unverified
mobile/save-load, and a concurrency-bug trail.**

Format per task: **owner file(s)** (respect `CLAUDE.md` ownership), **change**,
**acceptance criteria**. Communicate via `EventBus` only; randomness via `rng`; no
score/win-state (design pillar). After each task: `npm run build` clean + verify in
the browser at 375 / 768 / 1280px.

> ALREADY DONE (do not redo): Devotion now biases the Reckoning —
> `getResolution(archetype, devotion)` in `CivEvents.js` is wired through
> `SimEngine._reckoningBeat` (passes `GameState.devotion`). The audit's #1 fix is
> complete. This plan builds on it.

> PROCESS (read first): **one agent edits the code at a time.** Every bug in the last
> sessions (intervention crash, ticker freeze, dilemma spam, duplicate ClimatePanel)
> came from two agents writing the same files concurrently. Use the other agent for
> review/planning, not simultaneous editing.

---

## P0 — Critical (the game is too easy and half-consequential)

### A1. Difficulty & failure pressure  (owner: 02 `SimEngine.js`, `CivEvents.js`, `Conditions.js`)
**Problem (audit Core Loop + Systems):** the dominant strategy is *do nothing* — civs
survive to the Reckoning almost automatically, so interventions are optional flavor.
There is no tension.
**Change:** introduce a survival pressure the player must actively manage. Recommended
(pick 1–2, keep legible):
- **Climate drift:** every ~50 ticks, nudge 1–2 sliders a few points toward a random
  edge. Left alone, the world drifts out of the safe zone and into a failure cause.
  The live Climate panel (G1) becomes a thing you must *tend*, not set-and-forget.
- **Stability/unrest meter:** wars, plagues, dark ages raise unrest; high unrest risks
  a collapse event. Blessings / answered prayers lower it.
- **Carrying-capacity events:** famines/overpopulation crashes that demand a response.
**Acceptance:** an untouched run has a meaningful chance of dying *before* the Reckoning
(e.g., 30–50%); a *played* run can avert it. Surviving should feel earned, not default.

### A2. Make Devotion matter *during* play (not just the ending)  (owner: 06 `InterventionBar.js` / `DevotionMeter.js` (08), 02 `SimEngine.js`, 03 `MythEngine.js`)
**Problem (audit Systems):** Devotion drives the ending now, but mid-run it's inert —
the Miracle is narrative-only and low Devotion has no teeth.
**Change:**
- **Miracle with real effect:** "Reveal Yourself" (devotion ≥80) should *do* something
  — e.g., instantly avert the current failure/unrest, or resurrect a destroyed
  settlement, or grant a golden age — then spend Devotion. Emit a real sim effect, not
  just a myth.
- **Low-Devotion penalty:** below ~15, faith collapses — religions lose believers,
  unrest rises, the civ may stop sending prayers/communication. Being forgotten should
  hurt.
- Surface Devotion's current *effect* in its tooltip ("Worshipped: your Miracle is
  ready; the faithful obey").
**Acceptance:** spending a Miracle visibly changes the sim; neglected Devotion produces
a worse run; the meter feels like a lever, not a readout.

---

## P1 — Important (integrity + clarity)

### A3. Verify save/load integrity + lock the driver  (owner: `SaveManager.js`, `main.js`)
**Problem (audit Technical):** autosave fires every 60 ticks but **resume-on-load is
unverified**; the recent bug trail came from concurrent edits.
**Change:** confirm (or implement) load-on-boot: a saved run restores planet, tick,
sliders, myths, influence, devotion, epoch. Add a "Continue" affordance if a save
exists. Add a 6-line pre-push smoke checklist (run starts, intervene without crash,
choice opens/closes, reckoning reaches postmortem, share copies, mobile loads).
**Acceptance:** reloading mid-run restores it; the smoke checklist passes before any push.

### A4. Consolidate the HUD + re-verify mobile  (owner: 08 `index.html`, `style.css`; coordinate with the UI components)
**Problem (audit UX):** corners are crowded — stats (TL), Devotion (below), Identity
HUD, Climate + Whole-Planet toggles (TR), speed (BL), interventions (bottom), ticker.
Mobile at 375px is historically broken and unverified.
**Change:** unify the top status row (Year · Pop · Influence · Devotion · Identity)
into one coherent bar; group the two top-right toggles; bump base font to ≥13px.
Re-test 375px end-to-end (tank visible, every button reachable, no overflow).
**Acceptance:** ≤2 visual clusters per screen corner; full playthrough works at 375px.

---

## P2 — Polish

### A5. Mid-game cause→effect legibility  (owner: 04 `TerrariumView.js`, 08 `Ticker.js`/`main.js`)
Floating "+1,240 / −820" population deltas on interventions and major events; make each
intervention's *outcome* (not just its myth) a distinct ticker line so the player reads
the consequence. (audit Core Loop "watch-and-wait".)

### A6. Restyle the "Whole Planet" globe to match the tank  (owner: 04 `PlanetView.js`)
Draw it as a glass sphere with the same star field so it reads as the *same game*, not a
flat top-down map. (audit Art.)

### A7. Reckoning flavor by Devotion  (owner: 03 `MythTemplates.js`, `MythEngine.js`)
Add a short "beloved / feared / forgotten" line to the Reckoning text keyed off final
Devotion, so the ending reflects the *relationship*, not just transcend/collapse.

### A8. First-run discoverability  (owner: 08 + `main.js`)
One-time coach-marks the first time the Climate panel / Devotion meter / a dilemma
appears ("Tend the climate", "Their faith in you", "Your choice will be remembered").
Slider-effect hints in the setup wizard. (audit First-Time Experience.)

### A9. Replay completion goal  (owner: 07 `PostMortem.js` / setup screen)
A small "endings seen" / "archetypes achieved" tracker to give intrinsic replay pull.
(audit Retention.)

---

## Build order
1. **A1** (difficulty) — biggest design lift; everything else matters more once survival is real.
2. **A2** (Devotion teeth) — completes the relationship→consequence loop.
3. **A3** (save/load + driver discipline) — stop shipping regressions.
4. **A4** (HUD + mobile).
5. **A5–A9** polish.

## Producer note
**Freeze new features after A1/A2.** The game is past MVP and slightly over-scoped; the
remaining value is in *balance, consequence, and polish*, not additions.

## If you only do ONE thing
**A1 — give the world real failure pressure.** Difficulty is the missing tension that
makes every other system (climate, interventions, devotion, choices) actually matter.
