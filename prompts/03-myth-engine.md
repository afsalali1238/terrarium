# PROMPT 03 — Myth Engine

## Context
Read `docs/CLAUDE.md` and `docs/ARCHITECTURE.md` before starting.
This prompt owns: `src/myth/MythEngine.js`, `src/myth/MythTemplates.js`, `src/myth/ReligionSystem.js`

This is the most important system in the game. Get it right.

---

## Task

Build the Myth Engine — the system that turns player interventions and civilization events into named legends, religions, and eventually, a philosophy that questions the nature of reality.

**The core idea:** The player drops a meteor. They watch a settlement burn. Then, 30 ticks later, in the event ticker, they see: *"The Screaming Sky Cult now performs the Ash Rite every harvest to appease the Void above."* That is the payoff. That is the entire game distilled. Build for that moment.

---

## MythEngine.js

```javascript
class MythEngine {
  constructor(planet, eventBus) {
    this.planet = planet
    this.myths = []           // all myths ever created this run
    this.playerName = null    // evolves based on player behavior
    this.interventionLog = [] // history of player actions
  }

  // Called by SimEngine when a civ event fires
  onCivEvent(event) { }

  // Called by InterventionTools when player acts
  onIntervention(interventionType, targetData) { }

  // Called every 50 ticks — myths age, mutate, schism
  ageTick() { }

  // Returns the player's current name in this civilization's myths
  getPlayerName() { }

  // Returns the last 5 myths for the ticker
  getRecentMyths() { }
}
```

---

## MythTemplates.js

Template bank for procedural myth generation. Fill `{tokens}` with procedural names and context.

### Intervention Templates

**METEOR**
```
Immediate (within 5 ticks):
- "The sky split open above {settlement} and fire fell. {count} people burned."
- "A light brighter than the sun struck {terrain}. The {settlement} survivors fled north."

30-50 ticks later (legend forms):
- "The priests of {settlement} say that {PLAYER_NAME} hurled a mountain of fire to punish {faction}'s pride."
- "The Screaming Sky Cult holds that the fire was a test. Those who fled failed. Those who burned were chosen."

80+ ticks later (religion codifies):
- "{Religion name} was founded on the belief that {PLAYER_NAME} will send fire again when the people grow complacent."
- "Every child in {settlement} is told: the sky has eyes. It has always had eyes."
```

**DROUGHT**
```
Immediate:
- "The rains stopped above {region}. The river {name} shrank to mud."
- "Three harvests failed in {settlement}. The old ways of water-prayer were revived."

Legend:
- "Elders say the drought came because the people of {faction} angered {PLAYER_NAME} by building too close to the sky."
- "The Water Keepers emerged after the Great Dry — priests who guard the last springs and speak to the above."

Religion:
- "{Religion} teaches that abundance is borrowed. {PLAYER_NAME} can recall it at any moment."
```

**BLESS HARVEST**
```
Immediate:
- "An unprecedented harvest filled every storehouse in {settlement}. No one went hungry."
- "The fields of {region} produced three times what they should. No explanation was found."

Legend:
- "The Generous Hand touched our soil, say the elders. We do not know why we were chosen."
- "{PLAYER_NAME} smiled on {settlement} that year. The people built a shrine at the edge of the fields."

Religion:
- "The Abundance Faith holds that {PLAYER_NAME} rewards stillness and gratitude, not ambition."
- "They leave offerings at the field's edge each harvest — not to ask for more, but to say thank you."
```

### Organic Event Templates (no intervention)

**First fire**
- "In the beginning, there was fire. The stories say it came from above."
- "{Agent name} stole fire from the sky, say the oldest songs. {PLAYER_NAME} let them take it."

**First war**
- "The first blood between {factionA} and {factionB} is remembered as the War of {generated name}."
- "The priests say the war was allowed by {PLAYER_NAME} to test which people were worthy."

**Discovery of the edge**
- "{Agent name} walked to the place where the world ends and found only darkness beyond."
- "The Edge Walkers say the world is contained. The priests say that is blasphemy. The debate has lasted {N} generations."

### Simulation Hypothesis Templates (Stage 2+)

Only available when tech level reaches 4+:

```
Stage 2 — philosophical detection:
- "A philosopher in {settlement} has written: 'The coincidences of nature are too precise. Someone arranged this.'"
- "The new Containment School argues that our world has edges, walls, and a watcher outside them. They have been called heretics."
- "An astronomer named {Agent} has documented {count} anomalies at the world's boundary. Her papers are being burned."

Stage 3 — discovery (v2, not v1):
- [Reserved for container discovery event — the fourth wall crack]
```

---

## ReligionSystem.js

Tracks named religions that emerge from myths over time.

```javascript
class Religion {
  constructor(mythSource) {
    this.name = NameGen.religionName()   // e.g. "The Screaming Sky Cult", "The Absence Faith"
    this.foundingMyth = mythSource       // which myth spawned this religion
    this.beliefs = []                    // accumulated belief statements
    this.settlement = null               // where it originated
    this.believers = 0                   // grows/shrinks over time
    this.hasSchism = false
  }
}
```

**Religion lifecycle:**
1. **Birth:** A myth reaches 20+ believers → a religion crystallizes around it
2. **Growth:** Wanderer agents spread it to new settlements
3. **Dominance:** If a religion reaches 50% of a settlement's population → it becomes the dominant belief
4. **Schism:** When a new intervention contradicts an existing religion's doctrine → a splinter faction forms
5. **Death:** If a settlement dies and the religion has no other hosts → it dies with them

**Schism example:**
- Existing religion: "The Generous Hand will always provide"
- Player sends drought
- Schism: "The Absence Sect" forms — "The Generous Hand has withdrawn. We must earn restoration."

---

## Player Name Evolution

The player's name in myths is never set by the player. It emerges from behavior.

```javascript
function derivePlayerName(interventionLog) {
  const meteors = count('meteor')
  const droughts = count('drought')
  const blessings = count('blessing')
  const inactivity = ticksSinceLastAction()

  // Logic:
  // All inaction → "The Absent One", "The Silent Watcher", "The Distant God"
  // All destruction → "The Sky Breaker", "The Bringer of Fire", "The Void Above"
  // All blessings → "The Generous Hand", "The Provider", "The Warm Above"
  // Mixed → "The Capricious One", "The Dreamer", "The One Who Tests"
  // Destruction then blessing → "The Redeemer", "The One Who Broke Then Mended"
}
```

The player name surfaces in:
- The event ticker (when myths reference them)
- The post-mortem card ("Your civilization knew you as...")
- The zoom level 3 person view (what that named person believes about you)

---

## EventBus Events

```javascript
// Listen
EventBus.on('sim:civ_event', onCivEvent)
EventBus.on('intervention:meteor', onIntervention)
EventBus.on('intervention:drought', onIntervention)
EventBus.on('intervention:bless', onIntervention)

// Emit
EventBus.emit('myth:created', { myth })
EventBus.emit('myth:evolved', { myth, previousForm })
EventBus.emit('myth:schism', { original, splinter })
EventBus.emit('religion:formed', { religion })
EventBus.emit('player:name_changed', { newName, reason })
```

---

## Output

A myth engine that:
1. Responds to every intervention with an immediate event + a deferred legend (30-50 ticks later)
2. Generates named religions that grow, spread, and schism
3. Tracks the player's evolving name across the run
4. Escalates to simulation-hypothesis content when tech level permits
5. Surfaces all of this through EventBus for the ticker to display
6. Stores myth history on the planet object for post-mortem use
