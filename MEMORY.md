# MEMORY.md — Terrarium Planet

This file is the living memory of the project. Every significant decision, pivot, or resolved question gets logged here with a date and reason. AI agents read this before making architectural decisions.

---

## Decisions Log

### 2025 — Project Conception

**[DECIDED] Core metaphor is terrarium, not god-sim**
The game is a curiosity toy. The player has no objectives. They are an observer who occasionally pokes. This affects every design decision — no scoring, no win state, no missions.

**[DECIDED] The Myth Engine is the primary feedback loop**
Not population numbers. Not resource bars. The player's main feedback is reading what the humans write about them. All interventions must generate myths. Stats are secondary.

**[DECIDED] Simulation hypothesis is progressive (3 stages)**
- Stage 1: Humans write myths about interventions (flavor)
- Stage 2: Humans scientifically detect anomalies (mid game)
- Stage 3: Humans prove the container — fourth wall crack (late game)
This unlocks based on civilization advancement, not player action.

**[DECIDED] Short compressed runs, not long-burn**
Each civilization runs 20-30 min real time. Compressed time scale. Encourages retry and experimentation. The terrarium metaphor is preserved by the *quality* of attention, not the *duration*.

**[DECIDED] All zoom levels simultaneously available**
Planet → region → village → named person. The terrarium magic requires the ability to zoom from the cosmic to the personal. Player gets attached at all levels simultaneously.

**[DECIDED] Era selection locks aesthetic AND ruleset**
Ancient era: swords, plagues, oral myths, slow tech. Modern era: nukes, climate events, internet myths, fast collapse. Not just cosmetic — different event sets, different intervention types.

**[DECIDED] Sliders are abstracted, not scientifically accurate**
0-100 scale. Safe zones clearly marked. Wrong values produce named failure modes for post-mortem. No real chemistry. Makes it accessible while feeling scientific.

**[DECIDED] Platform priority: Browser first → Mobile → Steam**
Consistent with Afsal's existing Vercel stack. No native dependencies in v1.

**[DECIDED] No framework — vanilla JS + PixiJS**
AI agent compatibility. Clean module boundaries. No build complexity. PixiJS only for canvas rendering performance.

**[DECIDED] Player's name in myths evolves procedurally**
Never fixed. Depends on behavior:
- Inactive → "The Absent One" / "The Silent Watcher"  
- Destructive → "The Sky Breaker" / "The Bringer of Fire"
- Generous → "The Generous Hand" / "The Provider"
- Mixed → "The Capricious One" / "The Dreamer"

---

## Open Questions (unresolved)

**[OPEN] Does civilization death archive the planet?**
Option A: Planet is gone, post-mortem only.
Option B: "Graveyard" of past planets the player can visit.
Option C: The post-mortem IS the graveyard (static snapshot).
*Leaning toward C for v1 simplicity.*

**[OPEN] What happens when Stage 3 triggers?**
When humans prove the container — is that a special ending, a new loop, or just another event in the ticker? This is the most philosophically important moment in the game. Needs careful design.
*Defer to v2.*

**[OPEN] Sound design**
Ambient space drone? Event-triggered sounds? Silence?
*Defer to v2.*

**[OPEN] Mobile-specific interaction model**
Zoom via pinch. Interventions via tap. Ticker placement on small screens.
*Design when PWA wrapper begins.*

---

## Discarded Ideas

**[DISCARDED] Multiplayer / shared universe**
"Everybody buys a planet" was the original idea — players' planets coexist. Discarded because: adds enormous complexity, kills the intimate terrarium feeling, and the philosophical payoff (am I also in one?) works best as a solo experience.

**[DISCARDED] Win state**
Early brainstorm included a "win" if civilization reaches Stage 3 discovery. Discarded — winning kills the curiosity toy feeling. Death is the only end state.

**[DISCARDED] Player controls individual agents**
Considered letting player "possess" a human. Discarded — breaks the terrarium metaphor. You are above the container, not inside it. (Or are you? That's the question.)

---

## v1 Scope (locked)

Build these and nothing else for v1:

1. Planet setup screen — 6 sliders + era selection
2. 2D top-down planet canvas with PixiJS
3. Agent simulation — population dots, emergent settlements
4. Civilization event ticker
5. Zoom system (4 levels)
6. 3 intervention tools: Meteor, Drought, Bless Harvest
7. Myth Engine v1 — interventions generate named legends
8. Death + post-mortem card
9. Restart flow

---

## Future Features Backlog (not v1)

- Religion system with named gods, temples, schisms
- War system with named battles
- Tech progression visible on planet
- Myth Engine v2 — books, prophecies, art artifacts
- Stage 2 + 3 container discovery
- Named character lineages
- Multiple saved planet slots
- Sound design
- Mobile PWA
- Steam release
