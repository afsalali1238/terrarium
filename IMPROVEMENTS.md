# Terrarium Planet — Improvement Spec (target: ≥8.5 in every category)

This is an implementation-ready brief for an AI coding agent. Each task lists the
**file(s) to edit** (respect the ownership map in `CLAUDE.md`), the **change**, and
**acceptance criteria** you can verify in the browser preview. Do tasks in priority
order (P0 → P1 → P2). After each task: `npm run build` must pass and the dev server
must run with no console errors.

Cross-module rule: communicate via `src/state/EventBus.js` only. Never import the
simulation layer into the render layer or vice-versa. All randomness uses
`src/utils/Random.js` (`rng`), never `Math.random()`.

Current scores → target:
IA/Layout 4→8.5 · Mobile 2→8.5 · Onboarding 5→8.5 · Agency 6→8.5 · Visual 8→9 ·
Narrative 9→9 · Engineering 6→8.5 · Shareability 4→8.5 · Accessibility 5→8.5

---

## P0 — Layout & Mobile (unblock everything)

### T1. Make the ticker stop covering the terrarium  (owner: 08 — `Ticker.js`, `index.html`, `style.css`)
The terrarium tank is the main view; the ticker currently overlaps ~45% of it on
desktop and ~85% on mobile. A collapse toggle (`#ticker-toggle`, `.collapsed`) was
already added to `Ticker.js` — finish the job in CSS/HTML.

Changes:
- In `index.html`, ensure `#ticker-overlay` contains a visible toggle button
  `#ticker-toggle` (label "▢ Log" / "▣ Log") and the scroll container `#ticker-scroll`.
- In `style.css`:
  - Default desktop: `#ticker-overlay` is a **narrower right rail** (max-width: 340px,
    width: 30vw) with a **semi-transparent** background (`rgba(8,8,24,0.72)`) and
    `backdrop-filter: blur(3px)` so the tank shows through.
  - `.collapsed #ticker-scroll { display:none }` and collapsed width shrinks to just
    the toggle button (~120px), pinned top-right below the view-toggle.
  - The tank (`#planet-canvas`) always fills the viewport; the ticker floats above it.
- Default the ticker to **collapsed on first load** so new players see the tank first.

Acceptance:
- On desktop, with the ticker expanded, you can still see the right third of the tank
  (people/buildings) through the translucent panel.
- Clicking the toggle collapses the ticker to a small chip; the full tank is visible.
- No layout shift of the intervention bar or stats bar when toggling.

### T2. Responsive / mobile layout  (owner: 08 — `style.css`, `index.html`; coordinate with 04 `TerrariumView.js`)
At 375px the game is unplayable: ticker covers the tank, the intervention bar
overflows (BLESS HARVEST clipped), stats + speed controls are cut off.

Changes:
- Add a `@media (max-width: 720px)` block in `style.css`:
  - `#ticker-overlay`: becomes a **bottom sheet** — full width, height ~32vh, anchored
    above the intervention bar; collapsed by default (peek of 1 line). Tank gets the
    top ~68vh.
  - `#intervention-bar`: `flex-wrap: wrap` OR horizontal scroll; buttons shrink
    (`min-width:0; flex:1`); never clip a button off-screen.
  - `#planet-stats` and `#speed-control`: shrink font to 11px, reduce padding, keep
    fully on-screen (use `max-width: calc(100vw - 16px)`).
  - `#view-toggle` (currently created in `Renderer.js` — see T11): top-right, smaller.
- In `TerrariumView.js`, in `layout()`, when `this.w < 720` raise `groundY` to
  `h * 0.78` is wrong for bottom-sheet; instead keep tank in the top region — read the
  available canvas height. Confirm people/buildings render inside the visible band.

Acceptance:
- At 375×812: tank fully visible on top, every intervention button reachable, stats
  and speed controls fully on-screen, ticker swipes/expands from the bottom.
- At 768px (tablet) and 1280px (desktop): no regressions.

---

## P1 — Onboarding, Agency, Shareability, Tank polish

### T3. First-run onboarding that establishes the fantasy  (owner: 08 `index.html`/`style.css` + `src/main.js`)
A new player is dropped into the tank with no idea they are the unseen watcher.

Changes:
- Add a one-time overlay `#intro-card` shown on the first `setup:complete` of a session
  (track `localStorage 'terrarium_seen_intro'`). Three short lines, fade in/out, with a
  "Begin watching" button:
  1. "They cannot see you."
  2. "Watch them live. Occasionally, reach in."
  3. "They will write legends about what you do."
- After dismissal, pulse the intervention bar once (add `.hint-pulse` class for 2s).
- Wire in `main.js`: on `setup:complete`, if intro not seen, show `#intro-card`.

Acceptance:
- First ever run shows the intro; subsequent runs do not.
- After dismiss, the three intervention buttons briefly pulse.

### T4. Intervention economy → real decisions  (owner: 06 `InterventionBar.js` + 02 `SimEngine.js` via EventBus + `GameState.js`)
Right now interventions are just cooldowns; there's no trade-off. Add a shared,
slowly-recharging resource ("Influence").

Changes:
- `GameState.influence` (0–100), starts at 100. Recharges +1 every sim tick via a
  `SimEngine` emit or a `Ticker`/`main` listener on `sim:tick` (keep it in one place;
  simplest: `InterventionBar` listens to `sim:tick` and increments).
- Each intervention has a cost: meteor 60, drought 35, bless 45. Disable a button when
  `influence < cost`; show cost in the button sublabel ("Send fire · 60").
- Add an Influence meter to `#planet-stats` (owner 08 for the markup if needed; the
  value can be rendered by `InterventionBar` into a dedicated element).
- Keep existing cooldowns as a short anti-spam window (e.g., 8 ticks) on top of cost.

Acceptance:
- Spending influence visibly drains the meter; it refills over time.
- You cannot fire a meteor right after a bless if influence is too low — a genuine choice.

### T5. Shareable post-mortem (growth loop)  (owner: 07 `PostMortem.js`; seed support in `src/utils/Random.js` + 01 `SetupScreen.js`)
The payoff "they wrote legends about me" has no share path.

Changes:
- Seed: ensure each run has a visible numeric seed. In `SetupScreen`/`main`, generate a
  seed (or let the player paste one) and call `reseedRng(seed)`; store on
  `GameState.seed`. Show the seed on the post-mortem.
- On `PostMortem`, add two buttons:
  - "Copy my legend" → `navigator.clipboard.writeText(...)` with a templated card:
    ```
    🌍 Terrarium Planet
    They called me "{playerName}".
    {finalPop>0? ...} — Year {tick}, {causeName}.
    Their last myth: "{lastMyth}"
    Seed: {seed} · play: <url>
    ```
  - "Replay this seed" → emits `ui:nav_setup { seed }` so the next run is identical.
- Confirm copy worked with a small inline "Copied!" state.

Acceptance:
- Clicking "Copy my legend" puts a readable multi-line summary on the clipboard.
- "Replay this seed" starts a new run that produces the same civilization.

### T6. Spread people across the full tank width  (owner: 04 `TerrariumView.js`)
People cluster on the left; the populated area is exactly what the ticker hides.

Changes:
- In `_reconcilePeople` / `_zoneFor`, distribute settlement zones across the **full
  usable width** (already partly done) and ensure figures from the first settlement
  don't all stack at one x. Add slight per-figure x jitter and varied `zoneHalf`.
- Cap visible figures higher when wide (≤60 on desktop), fewer on mobile (≤24).

Acceptance:
- With pop > 2000 the figures are spread edge-to-edge, not bunched on the left.

### T7. Richer bless / drought / plague feedback in the tank  (owner: 04 `TerrariumView.js`)
Meteor is dramatic; the others are too subtle.

Changes:
- Bless: stronger golden light wash from the top for the duration, figures do a small
  periodic hop, a few crops/flowers (tiny green sprites) sprout on the ground.
- Drought: shift grass to brown, draw cracks on the soil surface, dim the figures'
  movement (already slowed), add dust motes.
- Plague: tint affected figures sickly green before some fall; a faint haze.

Acceptance:
- Each of the three interventions produces a clearly distinct, visible tank reaction
  lasting several seconds.

---

## P2 — Visual consistency, Engineering, Accessibility, Audio

### T8. Make the "Whole Planet" view consistent with the tank  (owner: 04 `PlanetView.js`, `Renderer.js`)
The globe looks like a different game. Either restyle it as a **"terrarium from
outside"** (a glass sphere/dome with the tank visible inside) or frame it as a small
inset "world map." Recommended: draw the globe inside a glass-sphere highlight + the
same star background so the art language matches.

Acceptance: toggling to Whole Planet no longer feels like a different app.

### T9. Audio (owner: new `src/audio/AudioManager.js` + wire in `main.js` via EventBus)
Add a tiny WebAudio ambient layer (no asset files; synthesize tones).

Changes:
- Ambient drone that shifts with `planet:health` (calm → tense as it dies).
- One-shot cues on `intervention:meteor` (impact), `intervention:bless` (chime),
  `myth:created` (soft), `planet:death` (low). A mute toggle in the UI, default ON but
  start muted until first user gesture (autoplay policy).

Acceptance: sound responds to events; a mute button works; no autoplay console errors.

### T10. Accessibility pass  (owner: 08 `style.css`, `index.html`; 06 `InterventionBar.js`; SpeedControl)
- Bump base font to ≥13px; ticker routine entries ≥12px.
- Don't rely on color alone: prefix ticker entries with a glyph (🜂 myth, ⚔ war,
  ✦ birth, ☄ intervention) so meaning survives color-blindness.
- Keyboard: `M`/`D`/`B` trigger the three interventions; `Tab` order through buttons;
  add `aria-label`s to icon-only buttons (`#view-toggle`, `#ticker-toggle`, speed btns).
- Ensure intervention buttons are ≥44px tall touch targets.

Acceptance: keyboard-only play works; buttons have labels; text passes a quick contrast
check; meaning is not color-only.

### T11. Engineering cleanup  (owners as noted)
- **De-dupe the person card.** The same markup exists in `ZoomController.updatePersonCard`
  (05) and `TerrariumView._showPersonCard` (04). Extract a shared helper
  `src/ui/PersonCard.js` (new, owner 08 or a small util) that both call with an agent.
- **Move the view-toggle button into HTML/CSS.** It's currently created imperatively in
  `Renderer.js` with an inline style string. Add `<button id="view-toggle">` to
  `index.html` and style in `style.css` (owner 08); `Renderer` only toggles text/visibility.
- **Bundle split.** Add `build.rollupOptions.output.manualChunks` in `vite.config` to
  split PixiJS into its own chunk (first-load perf). Confirm `npm run build` succeeds.
- **Dead-weight guard.** `AgentSprites`/`PlanetView` only matter in the globe view; they
  already skip work when hidden — confirm `Renderer.onSimTick` doesn't update them while
  `viewMode === 'terrarium'` (it shouldn't).

Acceptance: no duplicated person-card code; `view-toggle` defined in HTML/CSS; build
produces a separate pixi chunk; no console errors.

### T12. Narrative top-up (owner: 02 `CivEvents.js`, 03 `MythTemplates.js`)
Add 3–4 more ambient variants per epoch and 2 more variants to the recurring
`anomaly`/philosophy lines so long runs don't repeat verbatim. (Narrative is already
strong; this just protects it at length.)

Acceptance: a 2000-tick run shows noticeably less repetition in routine lines.

---

## Suggested order
1. T1, T2 (layout + mobile) — biggest experience lift.
2. T3, T5 (onboarding + shareability) — sets up the fantasy and the growth loop.
3. T4, T6, T7 (agency + tank polish) — depth and feedback.
4. T8–T12 (consistency, audio, a11y, cleanup, narrative).

## How to verify each task
Run the dev server, step the setup wizard, and use the browser preview to confirm the
acceptance criteria. Always test at 375px (mobile), 768px (tablet), 1280px (desktop).
`npm run build` must pass with no errors after every task.
