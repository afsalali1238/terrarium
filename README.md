# Terrarium Planet

> The simulation hypothesis isn't a concept you explain to players. It's a trap you build. They walk in looking for a god game. They leave questioning whether they're in one.

---

## What This Is

A browser-based philosophical god-simulation. You tune a planet, seed it with humans, watch them build a civilization, poke it with meteors and droughts, and read the myths and religions they write about your interventions. Late game: they detect the container. After your 5th run: the question flips.

**It is a philosophical trap disguised as a curiosity toy.**

---

## The Trap (how it works)

| Step | What player thinks | What's actually happening |
|---|---|---|
| Setup | "I'm configuring my game" | Learning how precise existence has to be |
| Watch | "I'm watching my civilization" | Forming attachment to something they control |
| Myths | "They wrote a legend about my meteor" | Feeling what it means to be an unaware creator |
| Run 5+ | "This is a clever game" | "What if I'm the simulated one?" |

---

## Build Order

Run these prompts in order, one session each:

```
prompts/00-bootstrap.md          → Project scaffold + utilities
prompts/01-planet-setup-screen.md → Fine-tuning screen + sliders + conditions
prompts/02-simulation-engine.md  → Tick loop + agents + guaranteed myth
prompts/03-myth-engine.md        → Legends + religions + player name
prompts/04-render-canvas.md      → PixiJS planet + terrain + agent dots
prompts/05-zoom-system.md        → Planet → region → village → person
prompts/06-intervention-tools.md → Meteor + drought + bless
prompts/07-postmortem-screen.md  → Death card + 5th-run message
prompts/08-ui-overlays.md        → Ticker + speed control + index.html
```

Before each session: give the agent `docs/CLAUDE.md` + the relevant prompt file.

---

## Docs

- `docs/PRD.md` — full product spec + trap mechanic design
- `docs/CLAUDE.md` — rules for AI agents (read before touching code)
- `docs/ARCHITECTURE.md` — system design + directory structure
- `docs/MEMORY.md` — all decisions recorded with reasons

---

## Stack

PixiJS v7 · Vanilla JS · HTML/CSS overlays · Vite · Vercel

```bash
npm install
npm run dev     # localhost:5173
npm run build   # dist/
```

---

## The Six Trap Mechanics

1. **Fine-tuning interstitial** — real physics facts, unskippable, before first setup
2. **Guaranteed tick-25 myth** — "something made this world" — hardcoded, every run
3. **The follow mechanic (Asha)** — named agent, player can follow her entire life
4. **Communication events** — humans write to the player. Player cannot respond.
5. **5th-run message** — "You have never wondered about yours. Why not?"
6. **Substrate Easter egg** — hidden. v2. Discovered, never announced.
