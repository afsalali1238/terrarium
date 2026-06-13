import { getSliderHealth, getLifeProbability } from './Conditions.js'

export default class Planet {
  constructor(config) {
    this.sliders = {
      atmosphere:   config.atmosphere   ?? 50,
      water:        config.water        ?? 50,
      heat:         config.heat         ?? 50,
      gravity:      config.gravity      ?? 50,
      starDistance: config.starDistance ?? 50,
      soil:         config.soil         ?? 50
    }
    this.era = config.era ?? 'ancient'
    this.tick = 0
    this.population = 0
    this.settlements = []
    this.agents = []
    this.myths = []
    this.religions = []
    this.interventionLog = []
    this.isAlive = true
    this.deathCause = null
    this.degradationTick = 0      // counts ticks during slow-death
    this.guaranteedMythFired = false
    this.techLevel = 0
    this.communicationSent = false
    this.notableBirthFired = false
    this.playerName = 'The Unnamed'   // kept current by MythEngine; read at death

    // --- Epoch / story-spine state ---
    // Modern era starts the civilization much further along its arc.
    this.epoch = this.era === 'modern' ? 'industrial' : 'dawn'
    this.epochStartTick = 0
    this.firedMilestones = {}        // { milestoneId: true }
    this.epochsSeen = [this.epoch]

    // --- Population narrative-arc state ---
    this.ageState = 'normal'         // normal | golden | dark
    this.ageStateUntil = 0           // tick the current age-state ends
    this.peakPopulation = 0
    this.collapseCount = 0

    // --- Reckoning (endgame) state ---
    this.truthRevealed = false       // civ has discovered it is contained
    this.reckoningStage = 0          // counts dramatic finale beats fired
    this.reckoningResolved = false
  }

  getHealthScore() {
    const scores = getSliderHealth(this.sliders)
    return Object.values(scores).reduce((s, v) => s + v, 0) / Object.keys(scores).length
  }

  getLifeProbability() {
    return getLifeProbability(this.sliders)
  }

  // Returns color string for planet preview based on health
  getColorState() {
    const score = this.getHealthScore()
    const outOfZone = this._countOutOfZone()
    if (outOfZone === 0 && score > 0.7) return 'healthy'
    if (outOfZone <= 2) return 'stressed'
    return 'dying'
  }

  _countOutOfZone() {
    const zones = {
      atmosphere: [35,65], water: [20,80], heat: [30,70],
      gravity: [25,75], starDistance: [30,70], soil: [20,100]
    }
    let count = 0
    for (const [key, [min, max]] of Object.entries(zones)) {
      if (this.sliders[key] < min || this.sliders[key] > max) count++
    }
    return count
  }
}
