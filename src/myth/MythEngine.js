import { TEMPLATES } from './MythTemplates.js'
import { ReligionSystem } from './ReligionSystem.js'
import { NameGen } from '../utils/NameGen.js'
import { rng } from '../utils/Random.js'

export class MythEngine {
  constructor(planet, eventBus) {
    this.planet = planet
    this.eventBus = eventBus
    this.myths = []
    this.playerName = 'The Unnamed'
    this.interventionLog = []
    this._pendingLegends = []  // { tick, myth } — deferred legend formation
    this.religionSystem = new ReligionSystem(eventBus)

    // Wire EventBus
    eventBus.on('sim:civ_event', ({ event }) => this.onCivEvent(event))
    eventBus.on('sim:guaranteed_myth', (data) => this._createMyth('guaranteed', data.text))
    eventBus.on('sim:notable_birth', (data) => this._emitTicker(data.text, 'notable'))
    eventBus.on('intervention:meteor', (data) => this.onIntervention('meteor', data))
    eventBus.on('intervention:drought', (data) => this.onIntervention('drought', data))
    eventBus.on('intervention:bless', (data) => this.onIntervention('bless', data))
    eventBus.on('sim:tick', ({ tick }) => this._onTick(tick))
    eventBus.on('planet:death', (data) => this._onDeath(data))
    eventBus.on('myth:schism', ({ original, splinter }) => this._onSchism(original, splinter))

    // Seed the player's name immediately (an untouched world has an absent god).
    this._updatePlayerName()
  }

  onCivEvent(event) {
    if (!event) return
    if (event.type === 'reckoning') { this._handleReckoning(event); return }
    const template = TEMPLATES[event.type]
    if (!template) {
      // Use raw event text
      if (event.feedsMyth) this._createMyth(event.type, event.text)
      else this._emitTicker(event.text, 'event')
      return
    }
    const text = Array.isArray(template) ? rng.pick(template) : rng.pick(template.immediate ?? template)
    const filled = this._fill(text, event)
    if (event.feedsMyth) this._createMyth(event.type, filled)
    else this._emitTicker(filled, 'event')
  }

  onIntervention(type, targetData) {
    this.interventionLog.push({ type, tick: this.planet.tick, data: targetData })
    this._updatePlayerName()

    // Assign dominant myth glow to nearest settlement
    let targetX = targetData?.x || 0
    let targetY = targetData?.y || 0
    // If no target provided (like drought/bless), pick a random settlement
    if (targetData?.x === undefined && this.planet.settlements.length > 0) {
      const rs = rng.pick(this.planet.settlements)
      targetX = rs.x
      targetY = rs.y
    }
    
    // Find nearest
    let nearest = null
    let minDist = Infinity
    for (const s of this.planet.settlements) {
      const d = Math.sqrt((s.x - targetX)**2 + (s.y - targetY)**2)
      if (d < minDist) { minDist = d; nearest = s }
    }
    
    if (nearest) {
      if (type === 'meteor') nearest.dominantMythType = 'fire'
      if (type === 'drought') nearest.dominantMythType = 'absence'
      if (type === 'bless') nearest.dominantMythType = 'abundance'
    }

    const template = TEMPLATES[type]
    if (!template) return

    // Immediate event
    const immediateText = this._fill(rng.pick(template.immediate), targetData)
    this._createMyth(type, immediateText, 'immediate')
    this._emitTicker(immediateText, 'intervention')

    // Schedule a deferred legend 30–50 ticks later
    const legendTick = this.planet.tick + rng.int(30, 50)
    this._pendingLegends.push({ tick: legendTick, type, targetData, stage: 'legend' })

    // Check for religious schism
    this.religionSystem.checkSchism(type, this.eventBus)
  }

  _onTick(tick) {
    // Age myths every 50 ticks
    if (tick % 50 === 0) {
      this.ageTick()
      // Name drifts toward "Absent" if you go quiet — but freeze it once the
      // finale begins so it reflects the whole history that produced the ending.
      if (this.planet.epoch !== 'reckoning') this._updatePlayerName()
    }
    this.religionSystem.tick()

    // Fire pending legends (only 'legend' stage — religion stage is handled separately below)
    const due = this._pendingLegends.filter(p => p.stage === 'legend' && p.tick <= tick)
    due.forEach(p => {
      this._pendingLegends = this._pendingLegends.filter(x => x !== p)
      const template = TEMPLATES[p.type]
      if (!template?.legend) return
      const text = this._fill(rng.pick(template.legend), p.targetData)
      const myth = this._createMyth(p.type, text, 'legend')

      // Try to form a religion from this myth
      const settlement = this.planet.settlements[0]
      this.religionSystem.tryFormReligion(myth, settlement)

      // Schedule religion-level text 80+ ticks later
      const religionTick = tick + rng.int(80, 120)
      this._pendingLegends.push({ tick: religionTick, type: p.type, targetData: p.targetData, stage: 'religion' })
    })

    // Fire pending religion texts
    const religionDue = this._pendingLegends.filter(p => p.stage === 'religion' && p.tick <= tick)
    religionDue.forEach(p => {
      this._pendingLegends = this._pendingLegends.filter(x => x !== p)
      const template = TEMPLATES[p.type]
      if (!template?.religion) return
      const text = this._fill(rng.pick(template.religion), p.targetData)
      this._createMyth(p.type, text, 'religion')
    })
  }

  ageTick() {
    // Myths grow believers slowly over time
    this.myths.forEach(myth => {
      myth.believers += rng.int(0, 10)
      myth.age++
    })
    // At most one myth drifts per aging pass — the story changes in the telling.
    const candidates = this.myths.filter(m => !m.mutated && m.age > 3 && m.stage !== 'reckoning')
    if (candidates.length && rng.next() < 0.5) {
      const myth = rng.pick(candidates)
      const previous = { ...myth }
      myth.mutated = true
      myth.legend = this._driftMyth(myth)
      this.eventBus.emit('myth:evolved', { myth, previousForm: previous })
      // Re-surface the changed myth in the ticker.
      this.eventBus.emit('myth:created', { myth })
    }
  }

  _driftMyth(myth) {
    const base = this._lowerFirst(myth.legend.replace(/^(Generations later|The southern settlements|Time wore|What began)[^:]*:\s*/i, ''))
    return rng.pick([
      'Generations later, the tale had changed in the telling: ' + base,
      'The far settlements tell it differently now — ' + base,
      'Time wore the story smooth: ' + base,
      'What began as memory is now scripture: ' + base
    ])
  }

  _lowerFirst(s) { return s ? s.charAt(0).toLowerCase() + s.slice(1) : s }

  _handleReckoning(event) {
    const R = TEMPLATES.reckoning
    let pool
    if (event.stage === 'discovery') pool = R.discovery
    else if (event.stage === 'reaction') pool = R[event.archetype] || R.capricious
    else if (event.stage === 'ending') pool = R[event.resolution] || R.transcend
    if (!pool) return

    // At the finale, the name they remember reflects their whole history with
    // you (cumulative), not just recent quiet — so it matches the ending tone.
    if (event.archetype) {
      const name = this._archetypeName(event.archetype)
      this.playerName = name
      this.planet.playerName = name
    }

    const text = this._fill(rng.pick(pool), event)
    this._createMyth('reckoning', text, event.stage === 'ending' ? 'religion' : 'legend')
  }

  _archetypeName(archetype) {
    return {
      cruel: 'The Sky Breaker',
      generous: 'The Generous Hand',
      redeemer: 'The Redeemer',
      capricious: 'The Capricious One',
      absent: 'The Absent One'
    }[archetype] || 'The Absent One'
  }

  _onSchism(original, splinter) {
    if (!original || !splinter) return
    const text = `${splinter.name} broke away from ${original.name}, declaring the old faith had misread ${this.playerName}.`
    this._createMyth('schism', text, 'legend')
  }

  getPlayerName() { return this.playerName }

  getRecentMyths() { return this.myths.slice(-5) }

  _createMyth(type, text, stage = 'immediate') {
    const myth = {
      id: Math.random().toString(36).slice(2),
      name: NameGen.mythName(type),
      legend: text,
      type,
      stage,
      believers: rng.int(5, 50),
      age: 0,
      tick: this.planet.tick,
      playerName: this.playerName
    }
    this.myths.push(myth)
    this.planet.myths.push(myth)
    this.eventBus.emit('myth:created', { myth })
    this._emitTicker(text, 'myth')
    return myth
  }

  _emitTicker(text, style = 'event') {
    this.eventBus.emit('ticker:entry', { text, style, tick: this.planet.tick })
  }

  _updatePlayerName() {
    const log = this.interventionLog
    const meteors = log.filter(e => e.type === 'meteor').length
    const droughts = log.filter(e => e.type === 'drought').length
    const blessings = log.filter(e => e.type === 'bless').length
    const ticksSince = this.planet.tick - (log[log.length - 1]?.tick ?? 0)
    const total = meteors + droughts + blessings

    let name
    if (total === 0 || ticksSince > 100) {
      name = rng.pick(['The Absent One', 'The Silent Watcher', 'The Distant God'])
    } else if (meteors > blessings + droughts) {
      name = rng.pick(['The Sky Breaker', 'The Bringer of Fire', 'The Void Above'])
    } else if (blessings > meteors + droughts) {
      name = rng.pick(['The Generous Hand', 'The Provider', 'The Warm Above'])
    } else if (meteors > 0 && blessings > 0) {
      name = rng.pick(['The Redeemer', 'The One Who Broke Then Mended'])
    } else {
      name = rng.pick(['The Capricious One', 'The Dreamer', 'The One Who Tests'])
    }

    this.planet.playerName = name   // always keep the planet in sync (read at death)
    if (name !== this.playerName) {
      this.playerName = name
      // Emit both keys: Ticker reads `name`, other listeners may read `newName`.
      this.eventBus.emit('player:name_changed', { name, newName: name, reason: `After ${total} interventions` })
    }
  }

  _onDeath(data) {
    // Inject player name and final myth into the death event
    data.playerName = this.playerName
    data.myths = this.myths.slice(-10)
    data.lastMyth = this.myths[this.myths.length - 1] || null
  }

  _fill(template, data = {}) {
    if (!template) return ''
    const s = this.planet.settlements[0]
    return template
      .replace(/{settlement}/g, data.settlement ?? s?.name ?? 'the settlement')
      .replace(/{faction}/g, data.faction ?? s?.name ?? 'the people')
      .replace(/{agent}/g, data.agent?.name ?? 'a wanderer')
      .replace(/{factionA}/g, this.planet.settlements[0]?.name ?? 'the north clan')
      .replace(/{factionB}/g, this.planet.settlements[1]?.name ?? 'the south clan')
      .replace(/{count}/g, data.count ?? rng.int(10, 200))
      .replace(/{name}/g, NameGen.mythName())
      .replace(/{N}/g, rng.int(2, 7))
      .replace(/{Religion}/g, this.religionSystem.religions[0]?.name ?? 'The Faith')
      .replace(/{PLAYER_NAME}/g, this.playerName)
  }
}
