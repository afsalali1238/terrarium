# PRD — Terrarium Planet
**Version:** 0.2 — The Trap Edition
**Status:** Pre-production
**Owner:** Afsal Ali

---

## The One Sentence That Defines This Game

> The simulation hypothesis isn't a concept you explain to players. It's a trap you build. They walk in looking for a god game. They leave questioning whether they're in one.

---

## 1. Vision

Terrarium Planet is a **philosophical trap disguised as a curiosity toy**.

The player thinks they are playing a god game. They are actually being walked — step by step, over 15 minutes — toward a genuine, involuntary moment of existential doubt about their own reality. Every mechanic exists to serve that one moment.

**The trap has four stages:**

| Stage | What the player thinks | What is actually happening |
|---|---|---|
| Setup | "I'm tuning my planet" | Learning how precise existence has to be |
| Watch | "I'm watching my civilization" | Forming attachment to something they control |
| Myth | "They wrote a legend about my meteor" | Feeling what it means to be an unaware creator |
| Meta | "This is a clever game about simulation theory" | The question flips: *what if I'm the simulated one?* |

---

## 2. The Core Emotional Arc (per run)

```
WONDER → ATTACHMENT → GUILT → DREAD → COMPULSION
```

- **Wonder:** First civilization events. They're alive. I made them.
- **Attachment:** Following Asha. Zooming to her. Reading her beliefs.
- **Guilt:** Dropping a meteor. Reading the 200-year religion it created.
- **Dread:** Post-mortem. Their last myth. "The sky has eyes. It has always had eyes."
- **Compulsion:** Retry button. Try again. Do better. Feel it again.

The philosophical payload — "what if I'm simulated too?" — is never stated. It is engineered through contrast: the player felt like a god for 15 minutes, then they close the tab and the question arrives uninvited.

---

## 3. The Trap Mechanics (new in v0.2)

### Trap 1 — The Fine-Tuning Screen
Before sliders appear, a 4-second interstitial (cannot be skipped):
```
The cosmological constant is precise to 1 part in 10¹²⁰.
The strong nuclear force is precise to 1 part in 100.
You are about to try to replicate this.
You will fail many times.
That is the point.
```
Effect: reframes the whole setup from "tutorial" to "touching something real."

### Trap 2 — The Guaranteed First Myth (tick 25)
Regardless of civilization state, at tick 25–35, this appears in the ticker:
```
The eldest among them tells the children: something made this world.
We did not arrive here by accident.
```
Effect: the player sees themselves referenced within 90 real seconds of play. Creates immediate attachment.

### Trap 3 — Asha (the Follow Mechanic)
At tick 30–50, the ticker names a person: "A child named [Name] was born in [Settlement]. She will remember this year."
Player can click the name to follow her. Her life events appear in a dedicated thread.
Her death — natural, at age ~80 ticks — is the emotional peak of the game.
Effect: the player mourns a dot they chose to watch.

### Trap 4 — The Humans Try to Communicate
At tech level 4+, the Containment philosophers start leaving messages directed outward. Different visual treatment — larger, different color, addressed to the player:
```
FROM: The Academy of Solenne, Year 847
"If something watches — we are not asking to be saved.
We are asking to be told the truth.
We just want to know if we are real."
```
The player has no way to respond. They can only drop a meteor or bless them.
Effect: the inability to respond *is* the point.

### Trap 5 — The 5th Run Message
After the player's 5th completed run (tracked in localStorage), the post-mortem card gains one additional line — small, below the retry buttons, appearing 3 seconds after everything else:
```
You have run 5 civilizations.
Each one wondered about its creator.

You have never wondered about yours.

Why not?
```
No explanation. No animation. It just appears. Retry button disabled for 5 seconds.
Effect: the trap closes. The player becomes the subject.

### Trap 6 — The Substrate Easter Egg (v2)
Hidden. Accessible by holding [specific key] for 3 seconds on the post-mortem screen.
The camera zooms out one level beyond the universe — revealing the player's own browser tab, the planet floating inside it, the computer it's running on.
Then snaps back. No text. No explanation. Game continues.
Effect: one-time. Only discovered. Never announced.

---

## 4. Core Loop

```
FINE-TUNING SCREEN → SETUP → SEED → WATCH → POKE → READ MYTHS → (COMMUNICATION EVENT) → DEATH → POST-MORTEM → RETRY
```

---

## 5. The Three Pillars

### Pillar 1 — The Myth Engine (primary feedback)
Every intervention → immediate event → legend 30–50 ticks later → religion 80+ ticks later.
The player's name evolves from their behavior. Never chosen. Always earned.
Player names: The Absent One / The Sky Breaker / The Generous Hand / The Capricious One / The Redeemer

### Pillar 2 — Fine-Tuning as Visceral Lesson
The setup is not a tutorial. It's the first philosophical lesson:
existence requires terrifying precision. Most players fail their first 3 setups.
That failure is the teaching.

### Pillar 3 — The Container Discovery (Progressive)
| Stage | Unlock | What happens |
|---|---|---|
| Myth | tick 25 | Creation myth: "something made this world" |
| Science | tech level 3 | Anomaly detection: "the world has edges" |
| Philosophy | tech level 4 | Containment School: "someone watches" |
| Communication | tech level 4+ | Direct messages to the player |
| Meta (v3) | 5th run | The question flips to the player |

---

## 6. Pacing — Guaranteed Emotional Beats

The game must deliver an emotional beat every 60 real seconds.

| Real time | Tick (approx) | Guaranteed event |
|---|---|---|
| 0:00 | — | Fine-tuning interstitial |
| 0:10 | 0 | First human dot appears |
| 0:40 | tick 8 | "First fire was made" |
| 1:00 | tick 20 | "A settlement formed" |
| 1:30 | tick 25–35 | **FIRST MYTH — "something made this world"** |
| 2:00 | tick 40 | Named person born — follow option appears |
| 2:30 | tick 50 | First war OR religion |
| 4:00 | tick 80 | Second myth — if player has intervened, references them by name |
| 8:00+ | tech 3+ | Anomaly detection events begin |
| 12:00+ | tech 4+ | Communication messages begin |

---

## 7. Speed Control (new in v0.2)

Three speeds + pause. Critical for pacing.

| Mode | Multiplier | When |
|---|---|---|
| Pause | 0x | Reading a myth, planning intervention |
| Observe | 0.5x | Zoomed in to a person |
| Normal | 1x | Default |
| Accelerate | 4x | Boring middle, waiting for next event |

Speed controlled by spacebar (pause) and +/- keys.
UI: small speed indicator bottom-left, unobtrusive.

---

## 8. Ticker Visual Hierarchy (new in v0.2)

Not all events are equal. The ticker must communicate this visually.

| Type | Visual treatment | Why |
|---|---|---|
| Myth / religion | Gold left border, italic text, slightly larger | These are the payoff |
| Player name mentioned | Line glows briefly (500ms) | The moment of recognition |
| War / death | Red left border | Violence should feel weighty |
| Communication (to player) | Magenta, larger, different font | Breaking the fourth wall |
| Routine (settlement, tech) | No border, dim text | Background noise |

---

## 9. Sharing Mechanic (new in v0.2)

Every myth entry has a copy icon. One click copies:

```
Terrarium Planet · Year 847 · Ancient Era

"The Screaming Sky Cult holds that the Sky Breaker hurled fire
to punish our pride. Every child is told: the sky has eyes."

I caused this by dropping a meteor in year 3.
[url]
```

The last line is the hook. It makes the sharer the protagonist.

---

## 10. Success Metrics

- Session length > 15 min
- 3+ retries in first session
- Player screenshots/shares a myth
- Player messages: "this made me think about my own reality"
- **New:** Player searches "simulation hypothesis" after playing

---

## 11. Non-Goals

- No multiplayer
- No scoring or leaderboard
- No win state
- No real chemistry (sliders are abstracted)
- No player control of individual agents

---

## 12. Open Questions → Answered

1. ~~Does the player get a name?~~ Yes. Derived from behavior. Never chosen.
2. ~~What happens if humans escape the container?~~ v3 feature. Irreversible ending. New loop.
3. ~~Should failed planets be archived?~~ Yes. "Myth Museum" — persistent gallery of best myths across all runs.
