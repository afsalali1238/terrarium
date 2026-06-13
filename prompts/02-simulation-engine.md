# PROMPT 02 — Simulation Engine

## Context
Read `docs/CLAUDE.md` and `docs/ARCHITECTURE.md` before starting.
This prompt owns: `src/simulation/SimEngine.js`, `src/simulation/Agent.js`, `src/simulation/Settlement.js`, `src/simulation/CivEvents.js`

---

## The Philosophy of This System

The simulation is not the point. The myths it generates are. Build SimEngine to be just complex enough to produce emotionally interesting events — not so complex it becomes a simulation for its own sake. Every mechanic that doesn't eventually produce a ticker entry or a myth can be cut.

---

## SimEngine.js

```javascript
class SimEngine {
  constructor(planet, eventBus) {
    this.planet = planet
    this.eventBus = eventBus
    this.speed = 1        // 0 (pause) | 0.5 | 1 | 4 — controlled externally via GameState.simSpeed
    this._intervalId = null
  }

  start() { }
  pause() { this.speed = 0 }
  resume() { this.speed = GameState.simSpeed }
  stop() { }

  tick() {
    if (this.speed === 0) return

    this.planet.tick++

    // 1. Check survival — if failing, degrade over 10 ticks before death
    const conditions = checkConditions(this.planet.sliders)
    if (!conditions.alive) {
      this._handleDegradation()
      return
    }

    // 2. Population dynamics
    this._updatePopulation()

    // 3. Settlement formation / growth
    this._updateSettlements()

    // 4. GUARANTEED MYTH — fires at tick 25–35 regardless of anything
    if (!this.planet.guaranteedMythFired && this.planet.tick >= 25) {
      this._fireGuaranteedMith()
    }

    // 5. Emergent events every 10 ticks
    if (this.planet.tick % 10 === 0) {
      const event = generateEvent(this.planet)
      if (event) this.eventBus.emit('sim:civ_event', { event })
    }

    // 6. Tech advancement check
    this._checkTechAdvance()

    // 7. Emit tick for renderer
    this.eventBus.emit('sim:tick', this._getSnapshot())
  }

  _fireGuaranteedMyth() {
    // This is the trap's first shot. Hardcoded. Non-emergent.
    this.planet.guaranteedMythFired = true
    this.eventBus.emit('sim:guaranteed_myth', {
      tick: this.planet.tick,
      text: 'The eldest among them tells the children: something made this world. We did not arrive here by accident.',
      type: 'myth'
    })
  }

  _handleDegradation() {
    // Degrade health over 10 ticks before death
    // Gives player time to see the decline
    // On tick 10 of degradation: emit planet:death
  }
}
```

**Speed control integration:**
- SimEngine reads `GameState.simSpeed` each tick
- At 4x: tick fires 4 times per real-time tick interval
- At 0: tick fires but returns immediately (no state change)
- Spacebar event sets GameState.simSpeed to 0 or previous value
- +/- keys cycle: 0.5 → 1 → 4 → 0.5

---

## Agent.js

Individual human. Tracked individually up to 500. Above that: aggregate.

```javascript
class Agent {
  constructor(x, y, settlement) {
    this.id = generateId()
    this.name = NameGen.humanName()
    this.x = x
    this.y = y
    this.settlement = settlement
    this.role = 'settler'     // settler | builder | priest | wanderer
    this.age = 0
    this.beliefs = []         // myth IDs this agent holds
    this.isAlive = true
    this.isFollowed = false   // true if player clicked "follow" on this agent
  }

  tick() {
    this.age++
    if (this.age > 80) this._die()
    this._wander()
    if (this.isFollowed) this._emitLifeEvent()
  }

  _emitLifeEvent() {
    // Emit notable life events for the "follow" panel
    // Milestones: age 20 (adult), age 40 (elder), age 60 (very old), age 80 (death)
    // Also: conversion to a new religion, surviving a plague, losing family in war
  }
}
```

**Roles emerge organically:**
- First 10 agents: all `settler`
- Settlement 20+: 1 becomes `builder`
- Post-intervention: 1 becomes `priest` (spreads myths)
- Occasionally: 1 becomes `wanderer` (carries myths between settlements)

**Named agent surfacing (the Asha mechanic):**
At tick 30–50, SimEngine picks one young agent (age < 10) and emits:
```javascript
this.eventBus.emit('sim:notable_birth', {
  agent,
  text: `A child named ${agent.name} was born in ${agent.settlement.name}. She will remember this year.`
})
```
This is the follow hook. Ticker displays it as a myth-type entry (gold border).
Player can click the name to follow.

---

## Settlement.js

```javascript
class Settlement {
  constructor(x, y, foundedTick) {
    this.id = generateId()
    this.name = NameGen.settlementName()
    this.x = x
    this.y = y
    this.foundedTick = foundedTick
    this.population = 0
    this.faction = null
    this.techLevel = 0
    this.dominantMyth = null
    this.dominantReligion = null
    this.mood = 'peaceful'    // peaceful | tense | celebrating | mourning
  }
}
```

**Tech levels:**
- 0: Nomadic bands
- 1: Permanent settlement (fire, storage)
- 2: Agriculture (growth accelerates)
- 3: Iron tools (conflict increases) — unlocks anomaly detection events
- 4: Writing (myths codified, spread faster) — unlocks communication events
- 5: Philosophy (Containment School possible) — unlocks simulation hypothesis content

---

## CivEvents.js

Generates emergent events every 10 ticks. All events must be emotionally legible — no abstract stat updates.

```javascript
export function generateEvent(planet) {
  // Weighted selection based on tick, population, tech level, recent events
  // Returns { type, text, year: planet.tick, feedsMyth: Boolean } | null
}
```

**Ancient Era event catalog:**

| Event | Trigger | Ticker text | Feeds myth? |
|---|---|---|---|
| `first_fire` | tick 5–15 | "Somewhere on [Planet], fire was made for the first time." | Yes — creation myth |
| `settlement_named` | new settlement | "[Name] was founded by [Agent] near the [terrain]." | No |
| `first_war` | 2 settlements in proximity | "[A] and [B] clashed over the river. Blood was spilled for the first time." | Yes |
| `first_religion` | agent becomes priest | "A priest in [Settlement] began speaking of the one who watches above." | Yes — references player |
| `plague` | 3% chance / 10 ticks | "A sickness swept through [Settlement]. Half the people died." | Yes |
| `notable_birth` | tick 30–50, once | "[Agent] was born in [Settlement]. She will remember this year." | Yes — gold border |
| `discovery_edge` | agent reaches map edge | "[Agent] walked to the edge of the world and turned back. 'There is nothing beyond,' they said." | Yes — seeds container suspicion |
| `anomaly_detected` | tech 3+ | "An astronomer in [Settlement] has documented [N] repeating patterns at the world's boundary." | Yes — simulation hypothesis |
| `containment_school` | tech 4+ | "A new philosophy emerged: the world is contained. A watcher exists outside it. They call themselves the Containment School." | Yes |
| `communication_attempt` | tech 4+, once per 50 ticks | Special — see below |
| `myth_spreads` | wanderer moves | "A wanderer carried the story of [Myth] to [Settlement]." | No |
| `prophet_rises` | post-intervention | "After [event], a prophet arose claiming to know the will of the Above." | Yes |

**Communication attempt event (THE most important event in the game):**

When triggered, emits `communication:outbound` — NOT a regular civ event. Different handling:
```javascript
this.eventBus.emit('communication:outbound', {
  tick: planet.tick,
  settlement: settlement.name,
  year: planet.tick,
  text: `FROM: The Academy of ${settlement.name}, Year ${planet.tick}\n\n"If something watches — we are not asking to be saved. We are asking to be told the truth. We just want to know if we are real."`
})
```
This renders differently in the ticker. See prompt 08.
Only fires once per run. After this fires, set `planet.communicationSent = true`.

**Modern Era event catalog (different set):**
- `nuclear_test`, `climate_protest`, `internet_conspiracy` ("they say the sky is a screen"), `pandemic`, `space_program`, `ai_emergence` ("machines that think — the philosophers say this is how gods are made"), `simulation_theory_viral` ("a philosopher's video about simulated realities has been seen by millions")

---

## EventBus Events Emitted

```javascript
EventBus.emit('sim:tick', { tick, population, settlements, agents })
EventBus.emit('sim:civ_event', { event })
EventBus.emit('sim:settlement_formed', { settlement })
EventBus.emit('sim:guaranteed_myth', { tick, text, type })
EventBus.emit('sim:notable_birth', { agent, text })
EventBus.emit('communication:outbound', { tick, settlement, text })
EventBus.emit('planet:death', { cause, tick, finalPop, myths, playerName })
```

---

## Output

1. SimEngine with speed control (0, 0.5x, 1x, 4x)
2. Guaranteed myth at tick 25–35 (hardcoded, non-emergent)
3. Notable birth event (Asha mechanic) at tick 30–50
4. Agent with `isFollowed` flag and life event emission
5. Settlement with techLevel and mood
6. CivEvents with communication:outbound as special case
7. Degradation-before-death (10 ticks of decline)
8. Modern era event catalog alongside ancient
