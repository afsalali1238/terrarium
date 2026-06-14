import { checkConditions } from './Conditions.js'
import { generateEvent, EPOCHS, nextEpoch, getArchetype, getResolution, generateDilemma } from './CivEvents.js'
import { Agent } from './Agent.js'
import { Settlement } from './Settlement.js'
import { rng } from '../utils/Random.js'
import { GameState } from '../state/GameState.js'

const TICK_INTERVAL_MS = 50          // scheduler granularity
const BASE_TICKS_PER_SEC = 10        // years/sec at 1x (watchable pacing)

export class SimEngine {
  constructor(planet, eventBus) {
    this.planet = planet
    this.eventBus = eventBus
    this._intervalId = null
    this._degradationCount = 0
    this._notableBirthScheduled = false
    this._droughtTicks = 0
    this._blessTicks = 0

    // Live-climate targets the planet eases toward (G1).
    this._climateTargets = {}

    // Intervention listeners — each tool now has a real, visible consequence (G3)
    this._listeners = {
      'intervention:meteor': (d) => this._applyMeteor(d),
      'intervention:drought': () => {
        this._droughtTicks = 25
        // Immediate hardship: a slice of the population is lost to the failing land.
        this._applyPopChange(-Math.floor(this.planet.population * 0.10))
        this.eventBus.emit('devotion:change', { delta: 3, reason: 'withheld the rain' })
      },
      'intervention:bless': () => {
        this._blessTicks = 15
        // Immediate boon you can SEE: the population jumps.
        this._applyPopChange(Math.floor(this.planet.population * 0.08) + 5)
        this.eventBus.emit('devotion:change', { delta: 8, reason: 'blessed the harvest' })
      },
      'intervention:climate': ({ key, value }) => {
        if (this.planet.sliders && key in this.planet.sliders) this._climateTargets[key] = value
      },
      'choice:made': (data) => this._onChoice(data)
    }
    for (const [k, v] of Object.entries(this._listeners)) this.eventBus.on(k, v)
  }

  destroy() {
    this.stop()
    for (const [k, v] of Object.entries(this._listeners)) this.eventBus.off(k, v)
  }

  start() {
    this._spawnInitialAgents()
    this._tickAccumulator = 0
    this._lastStep = performance.now()
    this._intervalId = setInterval(() => this._step(), TICK_INTERVAL_MS)
  }

  pause() { GameState.simSpeed = 0 }
  resume() { GameState.simSpeed = GameState.simSpeed || 1 }

  stop() {
    clearInterval(this._intervalId)
    this._intervalId = null
  }

  _step() {
    const now = performance.now()
    let dt = (now - this._lastStep) / 1000
    this._lastStep = now
    if (dt > 0.25) dt = 0.25   // clamp after a stall / backgrounded tab

    const speed = GameState.simSpeed ?? 1
    if (speed === 0) return

    // Time-accurate ticking: exactly speed * BASE years per real second, so
    // 0.5x is genuinely half of 1x and the rate is immune to interval jitter.
    this._tickAccumulator += speed * BASE_TICKS_PER_SEC * dt
    let n = Math.floor(this._tickAccumulator)
    this._tickAccumulator -= n
    if (n > 40) n = 40
    for (let i = 0; i < n; i++) {
      this._tick()
      if (!this.planet.isAlive) break
    }
  }

  _tick() {
    const p = this.planet
    p.tick++

    // 0. Ease the climate toward any player-set targets (G1 — live environment)
    this._easeClimate()

    // 1. Survival check
    const conditions = checkConditions(p.sliders)
    if (!conditions.alive) {
      this._handleDegradation(conditions.failureCause)
      return
    }
    this._degradationCount = 0

    // 1b. The Reckoning — once the civilization reaches the truth, the run
    // concludes through a staged finale instead of continuing forever.
    if (p.epoch === 'reckoning') {
      this._reckoningBeat()
      if (!p.isAlive) return
    } else {
      this._checkEpochAdvance()
    }

    // 2. Population dynamics
    this._updatePopulation()

    // 3. Settlements
    this._updateSettlements()

    // 4. Agent ticks
    this._tickAgents()

    // 5. Guaranteed myth at tick 25–35
    if (!p.guaranteedMythFired && p.tick >= 25) {
      p.guaranteedMythFired = true
      this.eventBus.emit('sim:guaranteed_myth', {
        tick: p.tick,
        text: 'The eldest among them tells the children: something made this world. We did not arrive here by accident.',
        type: 'myth'
      })
    }

    // 6. Notable birth (Asha mechanic) tick 30–50
    if (!p.notableBirthFired && p.tick >= 30 && p.tick <= 50 && p.agents.length > 0) {
      this._fireNotableBirth()
    }

    // 7. Emergent civ event every 10 ticks
    if (p.tick % 10 === 0 && p.population > 0) {
      const event = generateEvent(p)
      if (event) {
        event.tick = p.tick
        if (event.special === 'communication') {
          this.eventBus.emit('communication:outbound', event)
          // G2: the civilization is reaching out — let the player answer.
          this.eventBus.emit('ui:choice', {
            id: 'communication',
            title: 'They are asking if they are real.',
            context: 'An academy has sent a message beyond the sky, addressed to whatever watches: "We only want to know if we are real." For the first time, they are speaking to you.',
            options: [
              { label: 'Stay silent', key: 'silent' },
              { label: 'Send a wordless sign', key: 'sign' },
              { label: 'Answer: "You are real."', key: 'affirm' },
              { label: 'Answer: "You are not."', key: 'deny' }
            ]
          })
        } else {
          this.eventBus.emit('sim:civ_event', { event })
        }
      }
    }

    // 8. Tech advance check
    this._checkTechAdvance()

    // 9. Auto-save every 60 ticks
    if (p.tick % 60 === 0) {
      this.eventBus.emit('sim:autosave', { tick: p.tick })
      
      // G4: Periodic Crossroads Dilemma
      const dilemma = generateDilemma(p)
      if (dilemma) {
        this.eventBus.emit('ui:choice', dilemma)
      }
    }

    // 10. Render tick
    this.eventBus.emit('sim:tick', {
      tick: p.tick,
      population: p.population,
      settlements: p.settlements,
      agents: p.agents
    })
  }

  _spawnInitialAgents() {
    const p = this.planet
    const modern = p.era === 'modern'
    const isCity = p.sliders.originSize === 'city'
    
    let pop = 5;
    if (modern && isCity) pop = 500;
    else if (modern && !isCity) pop = 50;
    else if (!modern && isCity) pop = 100;
    else pop = 5;

    let x, y;
    do {
      x = rng.float(-800, 800);
      y = rng.float(-800, 800);
    } while (x*x + y*y > 640000); // R^2 = 800^2
    const first = new Settlement(x, y, 0)
    // Modern-era civilizations begin already industrial: higher tech and population.
    first.techLevel = modern ? 4 : 0
    first.population = pop
    p.settlements.push(first)
    p.techLevel = first.techLevel
    this.eventBus.emit('sim:settlement_formed', { settlement: first })

    // Spawn up to 50 agents visually to avoid lagging the initial frame
    const visualAgents = Math.min(pop, 50)
    for (let i = 0; i < visualAgents; i++) {
      const a = new Agent(first.x + rng.float(-20, 20), first.y + rng.float(-20, 20), first)
      p.agents.push(a)
    }
    p.population = pop
  }

  _updatePopulation() {
    // Tick modifiers
    if (this._droughtTicks > 0) this._droughtTicks--
    if (this._blessTicks > 0) this._blessTicks--

    const p = this.planet

    // Golden ages and dark ages keep the population from flatlining at the cap.
    this._updateAgeState()

    const health = p.getHealthScore()
    let growthRate = 0.02 * health
    let deathRate = 0.005

    if (p.ageState === 'golden') { growthRate *= 1.5; deathRate *= 0.6 }
    if (p.ageState === 'dark')   { growthRate *= 0.4; deathRate *= 2.4 }

    if (this._droughtTicks > 0) growthRate *= 0.6 // 40% reduction
    if (this._blessTicks > 0) {
      growthRate *= 1.6 // 60% boost
      deathRate *= 0.7  // 30% cut
    }

    const deaths = Math.floor(p.population * deathRate)
    // Stochastic birth for small pops: fractional rate becomes a probability
    const rawBirths = p.population * growthRate
    const births = rawBirths >= 1
      ? Math.floor(rawBirths)
      : (rng.next() < rawBirths ? 1 : 0)
    p.population = Math.max(0, Math.min(10000, p.population + births - deaths))

    // Rare civilizational collapse — a sharp, story-worthy population crash.
    if (p.population > 2000 && rng.next() < 0.004) {
      const lost = Math.floor(p.population * rng.float(0.25, 0.5))
      p.population -= lost
      p.collapseCount++
      const s = p.settlements[0]
      this.eventBus.emit('sim:civ_event', { event: {
        type: 'collapse',
        text: `Within a single generation, ${s?.name ?? 'the heartland'} lost much of its people to war and famine together. The survivors called it a punishment.`,
        feedsMyth: true,
        tick: p.tick
      } })
    }

    p.peakPopulation = Math.max(p.peakPopulation, p.population)

    // Sync settlement populations proportionally
    if (p.settlements.length > 0) {
      const perSettlement = Math.floor(p.population / p.settlements.length)
      p.settlements.forEach(s => { s.population = perSettlement })
    }

    // Form a new settlement when population crosses thresholds
    const expected = p.settlements.length * 100
    if (p.population > expected && p.settlements.length < 20 && rng.next() < 0.1) {
      this._formSettlement()
    }
  }

  _updateAgeState() {
    const p = this.planet
    if (p.tick < p.ageStateUntil) return

    if (p.ageState !== 'normal') {
      // Returning to baseline after a golden/dark age.
      p.ageState = 'normal'
      p.ageStateUntil = p.tick + rng.int(40, 90)
      return
    }

    const r = rng.next()
    const s = p.settlements[0]
    if (r < 0.18 && p.population > 200) {
      p.ageState = 'golden'
      p.ageStateUntil = p.tick + rng.int(30, 70)
      this.eventBus.emit('sim:civ_event', { event: {
        type: 'golden_age',
        text: `A golden age dawned over ${s?.name ?? 'the world'}. The cities swelled, the granaries filled, and the people spoke of being favored.`,
        feedsMyth: false,
        tick: p.tick
      } })
    } else if (r < 0.34 && p.population > 200) {
      p.ageState = 'dark'
      p.ageStateUntil = p.tick + rng.int(30, 70)
      this.eventBus.emit('sim:civ_event', { event: {
        type: 'dark_age',
        text: `A dark age settled over ${s?.name ?? 'the world'}. Roads emptied, knowledge was lost, and each year was a little poorer than the last.`,
        feedsMyth: false,
        tick: p.tick
      } })
    } else {
      p.ageStateUntil = p.tick + rng.int(40, 90)
    }
  }

  _formSettlement() {
    const p = this.planet
    let x, y;
    do {
      x = rng.float(-800, 800);
      y = rng.float(-800, 800);
    } while (x*x + y*y > 640000);
    const s = new Settlement(x, y, p.tick)
    s.population = 10
    p.settlements.push(s)
    this.eventBus.emit('sim:settlement_formed', {
      settlement: s,
      text: `${s.name} was founded in year ${p.tick}.`
    })
  }

  _updateSettlements() {
    const p = this.planet
    p.settlements.forEach(s => {
      if (s.tryAdvanceTech(rng)) {
        if (s.techLevel > p.techLevel) p.techLevel = s.techLevel
        this.eventBus.emit('sim:tech_advance', { settlement: s, techLevel: s.techLevel })
      }
    })
  }

  _tickAgents() {
    const p = this.planet
    // Only individually track up to 500 agents
    if (p.agents.length > 500) {
      p.agents = p.agents.filter(a => a.isAlive)
      return
    }
    p.agents.forEach(a => a.tick(this.eventBus))
    p.agents = p.agents.filter(a => a.isAlive)

    // Spawn new agents proportional to population
    while (p.agents.length < Math.min(p.population, 500) && p.agents.length < 500) {
      const s = rng.pick(p.settlements)
      if (!s) break
      const a = new Agent(s.x + rng.float(-20, 20), s.y + rng.float(-20, 20), s)
      p.agents.push(a)
    }

    // Assign roles organically
    const agents = p.agents.filter(a => a.isAlive)
    if (agents.length >= 20 && !agents.find(a => a.role === 'builder')) {
      rng.pick(agents).role = 'builder'
    }
    if (p.myths.length > 0 && !agents.find(a => a.role === 'priest') && rng.next() < 0.05) {
      rng.pick(agents).role = 'priest'
    }
    if (!agents.find(a => a.role === 'wanderer') && agents.length > 10 && rng.next() < 0.02) {
      rng.pick(agents).role = 'wanderer'
    }
  }

  _fireNotableBirth() {
    const p = this.planet
    const youngAgents = p.agents.filter(a => a.isAlive && a.age < 10)
    if (youngAgents.length === 0) return
    p.notableBirthFired = true
    const agent = rng.pick(youngAgents)
    this.eventBus.emit('sim:notable_birth', {
      agent,
      tick: p.tick,
      text: `A child named ${agent.name} was born in ${agent.settlement?.name ?? 'a settlement'}. She will remember this year.`
    })
  }

  _checkTechAdvance() {
    const p = this.planet
    const maxTech = p.settlements.reduce((max, s) => Math.max(max, s.techLevel), 0)
    p.techLevel = maxTech
  }

  _checkEpochAdvance() {
    const p = this.planet
    const meta = EPOCHS[p.epoch]
    if (!meta) return
    const dwell = p.tick - p.epochStartTick
    if (dwell < meta.minDwell) return

    const ids = meta.milestones.map(m => m.id)
    const fired = ids.filter(id => p.firedMilestones[id]).length
    const allFired = fired >= ids.length
    const forced = dwell >= meta.maxDwell
    if (!allFired && !forced) return

    const next = nextEpoch(p.epoch)
    if (!next) return

    // Soft tech gate for the next epoch (unless we've waited too long).
    const nextMeta = EPOCHS[next]
    const maxTech = p.settlements.reduce((m, s) => Math.max(m, s.techLevel), 0)
    if (nextMeta && nextMeta.techReq && maxTech < nextMeta.techReq && !forced) return

    p.epoch = next
    p.epochStartTick = p.tick
    p.epochsSeen.push(next)
    this.eventBus.emit('sim:epoch_change', { epoch: next, tick: p.tick })

    if (next === 'reckoning') {
      p.reckoningStartTick = p.tick
      p.truthRevealed = true
    }
  }

  // Staged endgame: discovery → archetype reaction → resolution → end.
  _reckoningBeat() {
    const p = this.planet
    const elapsed = p.tick - (p.reckoningStartTick ?? p.tick)
    const s = p.settlements[0]
    const sName = s?.name ?? 'the last city'
    const archetype = getArchetype(GameState.interventionLog)

    if (p.reckoningStage === 0 && elapsed >= 2) {
      p.reckoningStage = 1
      this.eventBus.emit('sim:civ_event', { event: {
        type: 'reckoning', stage: 'discovery', settlement: sName, tick: p.tick, feedsMyth: true
      } })
    } else if (p.reckoningStage === 1 && elapsed >= 30) {
      p.reckoningStage = 2
      this.eventBus.emit('sim:civ_event', { event: {
        type: 'reckoning', stage: 'reaction', archetype, settlement: sName, tick: p.tick, feedsMyth: true
      } })
    } else if (p.reckoningStage === 2 && elapsed >= 60) {
      p.reckoningStage = 3
      const resolution = getResolution(archetype)
      // Emit the final myth first (synchronously creates it), then end the run.
      this.eventBus.emit('sim:civ_event', { event: {
        type: 'reckoning', stage: 'ending', resolution, archetype, settlement: sName, tick: p.tick, feedsMyth: true
      } })
      p.reckoningResolved = true
      p.isAlive = false
      this.stop()
      this.eventBus.emit('planet:death', {
        cause: resolution === 'transcend' ? 'reckoning_transcend' : 'reckoning_collapse',
        tick: p.tick,
        finalPop: p.population,
        myths: p.myths,
        sliders: p.sliders,
        playerName: p.playerName,
        lastMyth: p.myths[p.myths.length - 1] || null
      })
    }
  }

  _easeClimate() {
    const s = this.planet.sliders
    if (!s) return
    for (const k in this._climateTargets) {
      const tgt = this._climateTargets[k]
      const d = tgt - s[k]
      if (Math.abs(d) < 0.5) { s[k] = tgt; delete this._climateTargets[k]; continue }
      s[k] += Math.max(-2, Math.min(2, d))   // up to 2 points/tick — climate has inertia
    }
  }

  _applyPopChange(delta) {
    if (!delta) return
    const p = this.planet
    p.population = Math.max(0, Math.min(10000, p.population + delta))
  }

  // G3: a meteor is no longer just a myth — it costs lives and can erase a settlement.
  _applyMeteor(d) {
    const p = this.planet
    const loss = Math.floor(p.population * (0.12 + rng.float(0, 0.13)))  // 12–25%
    this._applyPopChange(-loss)
    if (d && d.x !== undefined && p.settlements.length > 1) {
      let nearest = null, md = Infinity
      for (const s of p.settlements) {
        const dd = Math.sqrt((s.x - d.x) ** 2 + (s.y - d.y) ** 2)
        if (dd < md) { md = dd; nearest = s }
      }
      if (nearest) p.settlements = p.settlements.filter(s => s !== nearest)
    }
    this.eventBus.emit('devotion:change', { delta: 5, reason: 'sent fire from the sky' })
  }

  _handleDegradation(cause) {
    this._degradationCount++
    const p = this.planet
    p.population = Math.max(0, Math.floor(p.population * 0.9))

    this.eventBus.emit('sim:tick', {
      tick: p.tick,
      population: p.population,
      settlements: p.settlements,
      agents: p.agents,
      degrading: true
    })

    if (this._degradationCount >= 10 || p.population === 0) {
      p.isAlive = false
      this.stop()
      this.eventBus.emit('planet:death', {
        cause,
        tick: p.tick,
        finalPop: p.population,
        myths: p.myths,
        sliders: p.sliders,
        playerName: p.playerName,
        lastMyth: p.myths[p.myths.length - 1] || null
      })
    }
  }

  _onChoice({ id, key }) {
    if (!id || !id.startsWith('dilemma_')) return
    const p = this.planet
    if (!p || p.settlements.length === 0) return
    const s1 = p.settlements[0]
    const s2 = p.settlements.length > 1 ? p.settlements[1] : s1

    let text = ''
    let popChange = 0
    let infChange = 0

    if (id === 'dilemma_plague') {
      if (key === 'plague_cull') {
        popChange = -Math.floor(p.population * 0.3)
        text = `The plague ravaged ${s1.name}, taking a third of the population. The survivors buried their dead and learned to live without them.`
      } else if (key === 'plague_heal') {
        infChange = -30
        text = `The sickness lifted as quickly as it came. The physicians claimed a victory, but the people knew who had stayed the reaper.`
      } else if (key === 'plague_bless') {
        infChange = -15
        popChange = -Math.floor(p.population * 0.1)
        text = `Many died, but the survivors found themselves stronger, immune, and deeply grateful to the sky.`
      }
    } else if (id === 'dilemma_war') {
      if (key === 'war_s1') {
        infChange = -20
        popChange = -Math.floor(p.population * 0.05)
        text = `A sudden shift in fortune broke the armies of ${s2.name}. ${s1.name} claimed victory, praising their unseen patron.`
      } else if (key === 'war_s2') {
        infChange = -20
        popChange = -Math.floor(p.population * 0.05)
        text = `${s2.name} crushed their rivals in a single, inexplicable rout. They raised banners to the watcher.`
      } else if (key === 'war_none') {
        popChange = -Math.floor(p.population * 0.25)
        text = `The war dragged on for decades, bleeding both ${s1.name} and ${s2.name} dry. The sky offered nothing but rain.`
      }
    } else if (id === 'dilemma_discovery') {
      if (key === 'disc_encourage') {
        infChange = -10
        s1.techLevel += 1
        this._checkTechAdvance()
        text = `Guided by invisible hands, the scholars of ${s1.name} cracked the mystery, leaping a generation ahead.`
      } else if (key === 'disc_suppress') {
        infChange = -25
        text = `The discovery was buried. Workshops burned, notes vanished, and the world was kept safely ignorant.`
      } else if (key === 'disc_watch') {
        if (rng.next() > 0.5) {
          s1.techLevel += 1
          this._checkTechAdvance()
          text = `They mastered the power on their own. The world advanced, proud of its independence.`
        } else {
          popChange = -Math.floor(p.population * 0.2)
          text = `They failed to control it. The resulting disaster scarred ${s1.name} for a century.`
        }
      }
    }

    if (infChange !== 0 && GameState.influence !== undefined) {
      GameState.influence = Math.max(0, GameState.influence + infChange)
      this.eventBus.emit('devotion:change', { delta: 10, reason: 'intervened in a dilemma' })
    }
    if (popChange !== 0) {
      p.population = Math.max(1, p.population + popChange)
    }

    if (text) {
      this.eventBus.emit('sim:civ_event', { event: {
        type: 'dilemma_resolution',
        text,
        feedsMyth: true,
        tick: p.tick
      } })
    }
  }
}
