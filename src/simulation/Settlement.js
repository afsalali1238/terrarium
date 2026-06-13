import { NameGen } from '../utils/NameGen.js'

let _nextId = 0
function generateId() { return ++_nextId }

export class Settlement {
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

  // Tech levels:
  // 0: Nomadic bands
  // 1: Permanent settlement
  // 2: Agriculture
  // 3: Iron tools — unlocks anomaly detection
  // 4: Writing — unlocks communication events
  // 5: Philosophy — unlocks simulation hypothesis content
  tryAdvanceTech(rng) {
    if (this.techLevel >= 5) return false
    const thresholds = [10, 30, 80, 200, 500]
    const needed = thresholds[this.techLevel]
    if (this.population >= needed && rng.next() < 0.05) {
      this.techLevel++
      return true
    }
    return false
  }
}
