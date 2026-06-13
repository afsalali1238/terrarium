# PRD — Terrarium Planet
**Version:** 0.1  
**Status:** Pre-production  
**Owner:** Afsal / Kasper Technologies  

---

## 1. Vision

> You set up conditions for life, watch humans emerge, poke them out of curiosity, and the payoff is reading the myths and religions they write about *you* — until they die, and you start over knowing you'll become a god again.

Terrarium Planet is a **philosophical curiosity toy** disguised as a god-simulation game. It is not about winning. It is about watching, poking, and feeling something when a civilization writes a religion about your meteor. The deepest payoff: late-game humans begin to suspect — and eventually prove — they are inside a container.

---

## 2. The Problem It Solves

Most god-sims (Spore, The Universim, WorldBox) are either too mechanical (objectives, win states) or too shallow (no meaning behind the chaos). Nothing on the market gives a player the *terrarium owner feeling* — pure curiosity, no agenda, just watching emergent life and occasionally disrupting it to see what happens — while layering in a philosophical gut-punch about the nature of reality.

---

## 3. Target Audience

- **Primary:** 18–35, curious, philosophically inclined, enjoys games like RimWorld, Dwarf Fortress, Alto's Odyssey
- **Secondary:** Casual players who want a "desk toy" game — something ambient and beautiful to check in on
- **Tertiary:** Educators using it to teach astrobiology, fine-tuning, emergence

---

## 4. Core Loop

```
SETUP → SEED → WATCH → POKE → READ MYTHS → (DISCOVERY EVENT) → DEATH → RESTART
```

| Phase | What happens | Player feeling |
|---|---|---|
| **Setup** | Tune 6 sliders (atmosphere, water, heat, gravity, star distance, soil) | Anticipation |
| **Seed** | Choose era (Ancient / Modern), drop humans | Curiosity |
| **Watch** | Civilization emerges — settlements, factions, wars, tech | Wonder |
| **Poke** | Drop meteor, plague, new species, drought out of curiosity | Mischief |
| **Read Myths** | Humans write legends about your intervention | Awe / guilt |
| **Discovery** | [Late game] Humans detect the container | Existential dread |
| **Death** | Civilization collapses. Post-mortem card shown | Guilt + curiosity |
| **Restart** | New planet, new conditions, new story | Compulsion |

---

## 5. The Three Pillars

### Pillar 1 — The Myth Engine
Every player intervention gets interpreted by the civilization and woven into their religion, history, and folklore. This is the **primary feedback loop** — not stats, not scores.

- Drop a meteor → 3 generations later: *"The Screaming Sky Cult"* sacrifices goats to the Void God
- Send a plague → A prophet arises claiming it was divine punishment for the King's vanity
- Do nothing for 200 years → Humans develop a theology of an *absent, indifferent creator*

### Pillar 2 — Fine-Tuning as Onboarding
The slider setup is not the game — it's the **entry ritual**. Getting it wrong and watching a slow extinction teaches the player viscerally how precise the conditions for life must be. This is the simulation-hypothesis idea made playable: the universe had to get everything *exactly right* for you to exist.

### Pillar 3 — The Container Discovery (Progressive Unlock)
Three stages, unlocked by civilization advancement:

| Stage | What happens |
|---|---|
| **Myth** | Humans write legends about unexplained interventions |
| **Science** | Humans detect "anomalies" at the edge of the world — philosophers debate |
| **Discovery** | One human proves the container. Civilization fractures. Some worship the container. Some try to escape. |

---

## 6. Feature List

### MVP (v1)
- [ ] Planet setup screen — 6 environmental sliders with visual feedback
- [ ] Era selection — Ancient / Modern (locks aesthetic + event set)
- [ ] 2D top-down planet canvas (HTML5 Canvas or PixiJS)
- [ ] Agent simulation — population dots with emergent settlement formation
- [ ] Civilization event ticker — real-time stream of emergent events
- [ ] Zoom system — planet → region → village → named person
- [ ] 3 intervention tools — Meteor, Drought, Bless Harvest
- [ ] Myth Engine v1 — interventions generate named legends in the ticker
- [ ] Death + Post-mortem card — shows what failed, what the humans believed
- [ ] Restart flow — carry-over hint from last run

### v2
- [ ] 5+ intervention tools
- [ ] Religion system — named gods, temples, schisms
- [ ] War system — faction conflict with named battles
- [ ] Tech progression — visible advancement across eras
- [ ] Myth Engine v2 — human-generated books, prophecies, art
- [ ] Stage 2 container discovery — philosophical debate events

### v3
- [ ] Stage 3 container discovery — fourth wall crack
- [ ] Named characters with lineages
- [ ] Multiple planet slots (save states)
- [ ] Mobile-optimized UI

---

## 7. Non-Goals (explicitly out of scope)
- Multiplayer / shared universe
- Real chemistry simulation (sliders are abstracted, not scientifically accurate)
- Winning or scoring
- Player-controlled individual units

---

## 8. Success Metrics
- **Engagement:** Average session > 15 min
- **Retention:** Player restarts at least 3 times in first session
- **Emotional:** Player screenshots a myth and shares it
- **Philosophical:** Player messages "this made me think about my own reality"

---

## 9. Platforms
- **v1:** Browser (HTML5) — instantly playable, no install
- **v2:** Mobile (PWA wrapper → native)
- **v3:** Steam / desktop (Electron or native port)

---

## 10. Open Questions
1. Does the player get a "name" in the myths? (The Absent One, The Sky Breaker, etc.)
2. What happens when humans successfully "escape" the container — is that a win state or a new loop?
3. Should failed planets be "archived" so the player can revisit their graveyards?
