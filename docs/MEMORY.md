# MEMORY.md — Decisions Log
**Last updated:** v0.2

This file records every significant decision made during design and development. Read before making any new decision — the answer may already be here.

---

## Core Philosophy

**Decision:** The game is a trap, not a toy.
**Reason:** "The simulation hypothesis isn't a concept you explain to players. It's a trap you build. They walk in looking for a god game. They leave questioning whether they're in one." This is the north star. Every feature is evaluated against it.
**Implication:** Features that don't serve the inversion get cut or subordinated.

---

## The Trap Sequence

**Decision:** Six trap mechanics, triggered in sequence across a player's lifetime with the game.
1. Fine-tuning interstitial (first session, unskippable)
2. Guaranteed tick-25 myth (every run)
3. Asha/follow mechanic (every run, surfaces at tick 30–50)
4. Communication events (tech level 4+, once per run)
5. 5th-run meta message ("You have never wondered about yours")
6. Substrate Easter egg (hidden, v2)

**Reason:** The philosophical payload must be earned through experience, not told. Each trap mechanic creates the emotional precondition for the next one.

---

## Player Name System

**Decision:** Player name is NEVER chosen. Always derived from behavior. Never shown to the player until the post-mortem.
**Reason:** The surprise of reading your own name in the civilization's scripture is the payoff. If the player chose it, it's just a label. If it emerged from their behavior — it's a revelation.
**Names:** The Absent One (inaction) / The Sky Breaker (mostly meteors) / The Generous Hand (mostly blessings) / The Capricious One (mixed) / The Redeemer (destruction then blessing)

---

## Guaranteed Tick-25 Myth

**Decision:** Hardcoded. Fires regardless of civilization state. Not emergent.
**Text:** "The eldest among them tells the children: something made this world. We did not arrive here by accident."
**Reason:** Players need to feel seen by their civilization within 90 real seconds. Without this, the first 2 minutes of a run feel empty and players disengage before the emergent system produces anything interesting.
**Implementation:** `planet.guaranteedMythFired` flag. Fires once per run at tick 25–35.

---

## Fine-Tuning Interstitial

**Decision:** Unskippable in v1. 4 seconds. Real physics facts. Pure black background.
**Text:**
- "The cosmological constant is precise to 1 part in 10¹²⁰."
- "The strong nuclear force is precise to 1 part in 100."
- "You are about to try to replicate this."
- "You will fail many times."
- "That is the point."
**Reason:** Reframes the setup screen from "tutorial" to "touching something real." Players who fail early setups understand WHY immediately. Skipped on retry (player has seen it).

---

## Communication Events

**Decision:** Humans addressing the player directly render with completely different visual treatment — magenta, larger, FROM: format, horizontal rules above and below.
**Reason:** These are the most philosophically significant events in the game. They cannot be allowed to scroll past unnoticed in the ticker stream. They must stop the player cold.
**Text:** "FROM: The Academy of [Settlement], Year [tick]: If something watches — we are not asking to be saved. We are asking to be told the truth. We just want to know if we are real."
**Player cannot respond.** That is the point.

---

## Speed Control

**Decision:** Three speeds (0.5x, 1x, 4x) + pause. Spacebar = pause/resume.
**Reason:** Fixed tick rate creates pacing problems. Players disengage in the quiet middle (ticks 60–120 with no major events). 4x lets them skip forward. Pause lets them read a myth without missing the next one.
**Implementation:** `GameState.simSpeed` — SimEngine reads it each tick.

---

## 5th-Run Message

**Decision:** After 5th completed run, post-mortem shows: "You have run [N] civilizations. Each one wondered about its creator. You have never wondered about yours. Why not?"
**Timing:** 3-second delay after retry buttons appear. Retry button disabled for 5 seconds.
**Reason:** The trap closing. The player becomes the subject. No explanation. No follow-up. The question arrives and stays.
**Tracking:** localStorage key `terrarium_planet_runs` (incremented on both Seal and Retry).

---

## Death as Degradation

**Decision:** Death is not instant. When conditions fail, the planet degrades over 10 ticks before dying.
**Reason:** Instant death feels like a bug. Slow decline feels like tragedy. The player should have time to watch their civilization struggle before the end — it increases emotional investment in the post-mortem.

---

## Ticker Visual Hierarchy

**Decision (enforced, not optional):**
- Myth/religion: gold left border, italic, gold year color
- Communication: magenta, 3px border, larger font, FROM: format
- Player name mentioned: 500ms brightness pulse
- War/death: red left border
- Routine: no border, dim text

**Reason:** Without hierarchy, the most important events (myths) get lost in noise. The visual system tells the player where to look without explaining it.

---

## Asha — The Follow Mechanic

**Decision:** At tick 30–50, the ticker names a specific young agent and offers a "follow" option. The followed agent's life events appear in a secondary panel.
**Reason:** Players need someone to care about. The terrarium feeling is watching *one ant* as much as watching the colony. Asha's death (at age ~80 ticks) is the emotional peak of the game.
**Implementation:** `planet.guaranteedNotableBirth` flag. `GameState.followedAgent` reference.

---

## Sharing Mechanic

**Decision:** Every myth entry has a copy icon. Copies formatted text: myth + "I caused this by [intervention] in year [X]" + URL.
**Reason:** The sharing format makes the player the protagonist of their own share. "I caused this" is the hook. This is the game's organic growth mechanic.

---

## Tech Stack (locked)

- PixiJS v7 (rendering)
- Vanilla JS (simulation)
- HTML/CSS (UI overlays)
- Vite (build)
- Vercel (deploy)
- No TypeScript, no React/Vue

**Reason:** Chosen for AI agent compatibility, zero framework overhead, and instant browser shareability.

---

## What Is Not In Scope (v1)

- Multiplayer
- Score / leaderboard
- Win state
- Real chemistry (sliders are abstracted)
- Direct agent control
- Sound (v2)
- Substrate Easter egg (v2)
- Myth Museum persistent gallery (v2)
- Mobile PWA (v2)
