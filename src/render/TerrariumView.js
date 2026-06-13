import * as PIXI from 'pixi.js'
import { lerp, clamp } from '../utils/MathUtils.js'

// A side-view "glass tank" view of the civilization: sky above, soil below,
// little people you can actually SEE living on the surface. This is the
// default, primary view — the whole-planet globe is the deepest zoom-out.

const ROLE_COLORS = {
  settler:  0xd9d2c5,
  builder:  0x8fa9ff,
  priest:   0xffcc55,
  wanderer: 0xff9ec2
}

const SKY = {
  healthy:  [0x2a, 0x4a, 0x7e],
  stressed: [0x6e, 0x52, 0x33],
  dying:    [0x2a, 0x1c, 0x22],
  dead:     [0x0c, 0x0a, 0x12]
}
const SOIL = {
  healthy:  [0x4a, 0x37, 0x24],
  stressed: [0x47, 0x34, 0x20],
  dying:    [0x2a, 0x20, 0x18],
  dead:     [0x10, 0x0d, 0x0b]
}
const GRASS = {
  healthy:  [0x3f, 0x7a, 0x3a],
  stressed: [0x7a, 0x6a, 0x2c],
  dying:    [0x4a, 0x3a, 0x22],
  dead:     [0x18, 0x16, 0x12]
}

function hex(c) { return (c[0] << 16) | (c[1] << 8) | c[2] }
function mix(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)] }

// Resolve a 4-stop palette (dead→dying→stressed→healthy) by health 0..1
function byHealth(pal, h) {
  if (h < 0.2) return mix(pal.dead, pal.dying, h / 0.2)
  if (h < 0.5) return mix(pal.dying, pal.stressed, (h - 0.2) / 0.3)
  if (h < 0.8) return mix(pal.stressed, pal.healthy, (h - 0.5) / 0.3)
  return pal.healthy
}

export class TerrariumView {
  constructor(app, eventBus, gameState) {
    this.app = app
    this.eventBus = eventBus
    this.gameState = gameState

    this.root = new PIXI.Container()        // shake wrapper

    this.skyGfx = new PIXI.Graphics()
    this.starsGfx = new PIXI.Graphics()
    this.celestialGfx = new PIXI.Graphics()
    this.cloudGfx = new PIXI.Graphics()
    this.eyeGfx = new PIXI.Graphics()
    this.soilGfx = new PIXI.Graphics()
    this.buildingGfx = new PIXI.Graphics()
    this.peopleGfx = new PIXI.Graphics()
    this.effectGfx = new PIXI.Graphics()
    this.frameGfx = new PIXI.Graphics()
    this.fadeGfx = new PIXI.Graphics()

    this.root.addChild(
      this.skyGfx, this.starsGfx, this.celestialGfx, this.cloudGfx, this.eyeGfx,
      this.soilGfx, this.buildingGfx, this.peopleGfx, this.effectGfx,
      this.frameGfx, this.fadeGfx
    )

    // --- animated/continuous state ---
    this.dayPhase = 0.25            // 0..1, 0.25 = morning
    this.clouds = []
    this.stars = []
    this.people = []                // { x, y, zone, role, agent, phase, speed, dir, targetX, dead, fall }
    this.meteors = []               // { x, y, vy }
    this.scars = []                 // { x, age }
    this.sparkles = []              // bless particles { x, y, vy, life }
    this.shake = 0
    this.blessTimer = 0
    this.droughtTimer = 0
    this.flash = 0

    // --- discrete sim state (refreshed on sim:tick) ---
    this.health = 1
    this.settlements = []
    this.population = 0
    this.epoch = 'dawn'
    this.truthRevealed = false
    this.eyeOpen = 0
    this.dead = false
    this.deathProgress = 0

    this.visible = true
    this._wired = false
  }

  init() {
    this.layout()
    this._seedStars()
    this._seedClouds()
    window.addEventListener('resize', () => this.layout())

    if (!this._wired) {
      this._wired = true
      this.app.ticker.add(() => this._animate())

      this.eventBus.on('sim:tick', (state) => this.update(state))
      this.eventBus.on('intervention:meteor', (d) => this.reactMeteor(d))
      this.eventBus.on('intervention:bless', () => { this.blessTimer = 120 })
      this.eventBus.on('intervention:drought', () => { this.droughtTimer = 240 })
      this.eventBus.on('sim:civ_event', ({ event }) => {
        if (event && event.type && /plague|collapse/.test(event.type)) this._cull(0.3)
      })
      this.eventBus.on('planet:death', () => { this.dead = true })

      // Click a person to inspect them.
      this.app.view.addEventListener('click', (e) => this._onClick(e))
    }
  }

  layout() {
    const w = this.app.screen.width
    const h = this.app.screen.height
    this.w = w
    this.h = h
    this.groundY = Math.round(h * 0.72)
    this.padX = Math.max(24, Math.round(w * 0.06))
    this._drawSky()
    this._drawSoil()
    this._drawFrame()
  }

  setVisible(v) {
    this.visible = v
    this.root.visible = v
  }

  // ---------------------------------------------------------------- discrete
  update(state) {
    const planet = state.planet || this.gameState.planet
    if (!planet) return

    this.health = planet.getHealthScore ? planet.getHealthScore() : 1
    this.settlements = planet.settlements || []
    this.population = planet.population || 0
    this.epoch = planet.epoch || 'dawn'
    this.truthRevealed = !!planet.truthRevealed

    this._reconcilePeople(planet)
    this._drawSky()
    this._drawSoil()
    this._drawBuildings()
  }

  _zoneFor(i, n) {
    // Evenly spread settlements across the usable width.
    const usable = this.w - this.padX * 2
    const span = usable / Math.max(1, n)
    const cx = this.padX + span * (i + 0.5)
    return { cx, half: Math.max(40, span * 0.42) }
  }

  _reconcilePeople(planet) {
    const agents = planet.agents || []
    const n = Math.max(1, this.settlements.length)
    // Visible figures scale with population but cap so they stay legible.
    const desired = clamp(Math.round(Math.sqrt(this.population) * 1.6), agents.length ? 1 : 0, 46)

    // remove extras
    while (this.people.length > desired) this.people.pop()

    // add new
    while (this.people.length < desired) {
      const si = this.people.length % n
      const zone = this._zoneFor(si, n)
      const x = zone.cx + (Math.random() * 2 - 1) * zone.half
      this.people.push({
        x, zone: si, role: 'settler', agent: null,
        phase: Math.random() * Math.PI * 2,
        speed: 0.15 + Math.random() * 0.25,
        dir: Math.random() < 0.5 ? -1 : 1,
        targetX: x, dead: false, fall: 0
      })
    }

    // refresh zone assignment + map to a real agent (for the person card + role colour)
    this.people.forEach((p, idx) => {
      const si = idx % n
      p.zone = si
      const z = this._zoneFor(si, n)
      p.zoneCx = z.cx
      p.zoneHalf = z.half
      const a = agents.length ? agents[idx % agents.length] : null
      p.agent = a
      p.role = (a && a.role) || 'settler'
    })
  }

  // ------------------------------------------------------------------ drawing
  _drawSky() {
    const g = this.skyGfx
    g.clear()
    let top = byHealth(SKY, this.health)
    // Night darkens the sky.
    const night = this._nightAmount()
    top = mix(top, [0x05, 0x06, 0x12], night * 0.8)
    if (this.droughtTimer > 0) top = mix(top, [0x7a, 0x5a, 0x2c], 0.35)
    const bottom = mix(top, [0xff, 0xe4, 0xb0], (1 - night) * 0.18)
    const bands = 24
    for (let i = 0; i < bands; i++) {
      const t = i / (bands - 1)
      g.beginFill(hex(mix(top, bottom, t)))
      g.drawRect(0, (this.groundY) * (i / bands), this.w, this.groundY / bands + 1)
      g.endFill()
    }
  }

  _drawSoil() {
    const g = this.soilGfx
    g.clear()
    const grass = byHealth(GRASS, this.health)
    const soil = byHealth(SOIL, this.health)
    // grass strip
    g.beginFill(hex(grass))
    g.drawRect(0, this.groundY - 6, this.w, 8)
    g.endFill()
    // soil body + strata
    const bottom = this.h
    g.beginFill(hex(soil))
    g.drawRect(0, this.groundY, this.w, bottom - this.groundY)
    g.endFill()
    const strata = mix(soil, [0x00, 0x00, 0x00], 0.25)
    for (let i = 1; i <= 3; i++) {
      const y = this.groundY + ((bottom - this.groundY) * i) / 4
      g.beginFill(hex(strata), 0.5)
      g.drawRect(0, y, this.w, 2)
      g.endFill()
    }
    // healed scars left as dark craters in the grass
    this.scars.forEach(s => {
      g.beginFill(0x140d0a, clamp(1 - s.age / 600, 0.15, 0.8))
      g.drawEllipse(s.x, this.groundY - 2, 16, 5)
      g.endFill()
    })
  }

  _drawFrame() {
    const g = this.frameGfx
    g.clear()
    // glass tank: rounded border + a soft top-left highlight
    g.lineStyle(3, 0x3a4a66, 0.5)
    g.drawRoundedRect(6, 6, this.w - 12, this.h - 12, 18)
    g.lineStyle(2, 0x9fc7ff, 0.10)
    g.moveTo(20, 16); g.lineTo(this.w * 0.45, 16)
    g.lineStyle(2, 0x9fc7ff, 0.06)
    g.moveTo(16, 20); g.lineTo(16, this.h * 0.5)
  }

  _drawBuildings() {
    const g = this.buildingGfx
    g.clear()
    const n = Math.max(1, this.settlements.length)
    this.settlements.slice(0, 10).forEach((s, i) => {
      const z = this._zoneFor(i, n)
      this._building(g, z.cx, this.groundY, s.techLevel || 0)
      if (s.dominantMythType) this._mythSymbol(g, z.cx, this.groundY - this._buildingHeight(s.techLevel || 0) - 14, s.dominantMythType)
    })
  }

  _buildingHeight(tech) { return 22 + tech * 10 }

  _building(g, cx, baseY, tech) {
    const wll = 0x6b5640, roof = 0x8a4f3a, stone = 0x6f7787
    const hgt = this._buildingHeight(tech)
    if (tech <= 0) {
      // tent
      g.beginFill(0x7a6a52); g.moveTo(cx - 12, baseY); g.lineTo(cx, baseY - hgt); g.lineTo(cx + 12, baseY); g.closePath(); g.endFill()
    } else if (tech === 1) {
      // hut
      g.beginFill(wll); g.drawRect(cx - 11, baseY - hgt + 8, 22, hgt - 8); g.endFill()
      g.beginFill(roof); g.moveTo(cx - 14, baseY - hgt + 8); g.lineTo(cx, baseY - hgt - 4); g.lineTo(cx + 14, baseY - hgt + 8); g.closePath(); g.endFill()
    } else if (tech === 2) {
      // house with door + window
      g.beginFill(wll); g.drawRect(cx - 14, baseY - hgt + 10, 28, hgt - 10); g.endFill()
      g.beginFill(roof); g.moveTo(cx - 17, baseY - hgt + 10); g.lineTo(cx, baseY - hgt - 6); g.lineTo(cx + 17, baseY - hgt + 10); g.closePath(); g.endFill()
      g.beginFill(0x2a1f17); g.drawRect(cx - 4, baseY - 14, 8, 14); g.endFill()
      g.beginFill(0xffd98a, 0.8); g.drawRect(cx + 4, baseY - hgt + 16, 5, 5); g.endFill()
    } else if (tech === 3) {
      // stone tower
      g.beginFill(stone); g.drawRect(cx - 12, baseY - hgt, 24, hgt); g.endFill()
      for (let k = -1; k <= 1; k++) { g.beginFill(stone); g.drawRect(cx - 12 + (k + 1) * 8, baseY - hgt - 5, 5, 5); g.endFill() }
      g.beginFill(0xffd98a, 0.85); g.drawRect(cx - 3, baseY - hgt + 14, 6, 8); g.endFill()
    } else {
      // industrial spires with lit windows
      g.beginFill(stone); g.drawRect(cx - 16, baseY - hgt, 14, hgt); g.endFill()
      g.beginFill(stone); g.drawRect(cx + 2, baseY - hgt * 1.25, 14, hgt * 1.25); g.endFill()
      for (let r = 0; r < 5; r++) {
        g.beginFill(0xffe08a, 0.85)
        g.drawRect(cx - 13, baseY - hgt + 6 + r * 7, 3, 3)
        g.drawRect(cx + 6, baseY - hgt * 1.25 + 6 + r * 8, 3, 3)
        g.endFill()
      }
    }
  }

  _mythSymbol(g, x, y, type) {
    if (type === 'fire') { g.beginFill(0xff5a2a, 0.9); g.moveTo(x, y - 7); g.lineTo(x + 5, y + 4); g.lineTo(x - 5, y + 4); g.closePath(); g.endFill() }
    else if (type === 'water') { g.beginFill(0x4ea0ff, 0.9); g.drawCircle(x, y, 5); g.endFill() }
    else if (type === 'abundance') { g.beginFill(0x55e08a, 0.9); g.drawStar ? g.drawStar(x, y, 5, 6, 3) : g.drawCircle(x, y, 5); g.endFill() }
    else if (type === 'absence') { g.lineStyle(2, 0x9a9a9a, 0.9); g.drawCircle(x, y, 5); g.lineStyle(0) }
  }

  // ------------------------------------------------------------------ animate
  _animate() {
    if (!this.visible) return
    const dt = this.app.ticker.deltaMS / 1000

    // day-night
    this.dayPhase = (this.dayPhase + dt / 40) % 1   // ~40s per day
    this._drawCelestial()
    this._drawStars()
    this._drawClouds(dt)
    this._drawEye(dt)
    this._drawPeople(dt)
    this._drawEffects(dt)

    // sky tint subtly tracks day-night without a full redraw every frame
    if (Math.random() < 0.04) this._drawSky()

    // camera shake
    if (this.shake > 0.2) {
      this.root.x = (Math.random() * 2 - 1) * this.shake
      this.root.y = (Math.random() * 2 - 1) * this.shake
      this.shake *= 0.86
    } else { this.root.x = 0; this.root.y = 0 }

    if (this.blessTimer > 0) this.blessTimer--
    if (this.droughtTimer > 0) this.droughtTimer--
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 2)

    // death fade
    this.fadeGfx.clear()
    if (this.dead && this.deathProgress < 1) this.deathProgress = Math.min(1, this.deathProgress + dt * 0.4)
    if (this.deathProgress > 0) {
      this.fadeGfx.beginFill(0x05060c, this.deathProgress * 0.92); this.fadeGfx.drawRect(0, 0, this.w, this.h); this.fadeGfx.endFill()
    }
    if (this.flash > 0) {
      this.fadeGfx.beginFill(0xffffff, this.flash * 0.6); this.fadeGfx.drawRect(0, 0, this.w, this.h); this.fadeGfx.endFill()
    }
  }

  _nightAmount() {
    // dayPhase 0..1: day ~0.0-0.5, dusk/night ~0.5-1.0
    const x = Math.cos(this.dayPhase * Math.PI * 2)   // 1 at noon, -1 at midnight
    return clamp((-(x) + 0.2) / 1.2, 0, 1)
  }

  _drawCelestial() {
    const g = this.celestialGfx
    g.clear()
    const ang = this.dayPhase * Math.PI * 2
    const cx = this.w / 2 - Math.sin(ang) * (this.w * 0.42)
    const cy = this.groundY - Math.abs(Math.cos(ang)) * (this.groundY * 0.7) - 30
    const night = this._nightAmount()
    if (night < 0.5) {
      g.beginFill(0xffe27a, 1 - night); g.drawCircle(cx, cy, 18); g.endFill()
      g.beginFill(0xffe27a, (1 - night) * 0.15); g.drawCircle(cx, cy, 30); g.endFill()
    } else {
      g.beginFill(0xd9e2f5, night); g.drawCircle(this.w - cx, cy, 13); g.endFill()
      g.beginFill(0x05060c, night); g.drawCircle(this.w - cx + 5, cy - 4, 11); g.endFill()
    }
  }

  _seedStars() {
    this.stars = []
    for (let i = 0; i < 60; i++) this.stars.push({ x: Math.random(), y: Math.random() * 0.6, r: Math.random() * 1.2 + 0.3 })
  }
  _drawStars() {
    const night = this._nightAmount()
    const g = this.starsGfx
    g.clear()
    if (night < 0.3) return
    this.stars.forEach(s => {
      g.beginFill(0xffffff, night * (0.5 + Math.random() * 0.5))
      g.drawCircle(s.x * this.w, s.y * this.groundY, s.r)
      g.endFill()
    })
  }

  _seedClouds() {
    this.clouds = []
    for (let i = 0; i < 3; i++) this.clouds.push({ x: Math.random(), y: 0.12 + Math.random() * 0.25, s: 0.7 + Math.random() * 0.8, v: 0.004 + Math.random() * 0.006 })
  }
  _drawClouds(dt) {
    const g = this.cloudGfx
    g.clear()
    const night = this._nightAmount()
    const alpha = 0.18 * (1 - night * 0.6)
    this.clouds.forEach(c => {
      c.x += c.v * dt
      if (c.x > 1.2) c.x = -0.2
      const x = c.x * this.w, y = c.y * this.groundY, s = c.s
      g.beginFill(0xffffff, alpha)
      g.drawEllipse(x, y, 34 * s, 14 * s)
      g.drawEllipse(x + 26 * s, y + 4 * s, 26 * s, 11 * s)
      g.drawEllipse(x - 24 * s, y + 5 * s, 22 * s, 10 * s)
      g.endFill()
    })
  }

  _drawEye(dt) {
    const g = this.eyeGfx
    g.clear()
    const target = this.truthRevealed ? 1 : 0
    this.eyeOpen = lerp(this.eyeOpen, target, 0.02)
    if (this.eyeOpen < 0.02) return
    const cx = this.w / 2, cy = this.groundY * 0.32
    const ew = 120, eh = 46 * this.eyeOpen
    g.lineStyle(2, 0xbfd0ff, 0.5 * this.eyeOpen)
    g.drawEllipse(cx, cy, ew, eh)
    g.lineStyle(0)
    g.beginFill(0xdfe8ff, 0.10 * this.eyeOpen); g.drawEllipse(cx, cy, ew, eh); g.endFill()
    g.beginFill(0x9fc0ff, 0.7 * this.eyeOpen); g.drawCircle(cx, cy, 16 * this.eyeOpen); g.endFill()
    g.beginFill(0x05060c, 0.9 * this.eyeOpen); g.drawCircle(cx, cy, 8 * this.eyeOpen); g.endFill()
  }

  _drawPeople(dt) {
    const g = this.peopleGfx
    g.clear()
    const FIG = 18
    for (const p of this.people) {
      // wander within the home zone
      if (!p.dead) {
        if (Math.abs(p.x - p.targetX) < 2) {
          p.targetX = p.zoneCx + (Math.random() * 2 - 1) * (p.zoneHalf || 40)
        }
        const d = Math.sign(p.targetX - p.x)
        p.dir = d || p.dir
        p.x += d * p.speed * (this.droughtTimer > 0 ? 0.5 : 1) * dt * 60
        p.phase += dt * 6 * p.speed * 4
      } else {
        p.fall = Math.min(1, p.fall + dt * 2)
      }

      const col = ROLE_COLORS[p.role] || ROLE_COLORS.settler
      const x = p.x
      const baseY = this.groundY - 2
      if (p.dead) {
        g.beginFill(col, 1 - p.fall * 0.6)
        g.drawEllipse(x, baseY - 1, 6, 2)   // fallen
        g.endFill()
        continue
      }
      const swing = Math.sin(p.phase) * 2
      // legs
      g.lineStyle(2, col, 1)
      g.moveTo(x, baseY - FIG * 0.45); g.lineTo(x - 2 + swing, baseY)
      g.moveTo(x, baseY - FIG * 0.45); g.lineTo(x + 2 - swing, baseY)
      // body
      g.moveTo(x, baseY - FIG * 0.45); g.lineTo(x, baseY - FIG * 0.8)
      g.lineStyle(0)
      // head
      g.beginFill(col); g.drawCircle(x, baseY - FIG * 0.9, 3); g.endFill()
      // celebrate on bless: little hop already via offset
      if (this.blessTimer > 0) { g.beginFill(0xffe07a, 0.8); g.drawCircle(x, baseY - FIG - 4, 1.4); g.endFill() }
    }
  }

  _drawEffects(dt) {
    const g = this.effectGfx
    g.clear()

    // meteors falling
    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const m = this.meteors[i]
      m.vy += 30 * dt
      m.y += m.vy * dt
      g.lineStyle(3, 0xffcc66, 0.9)
      g.moveTo(m.x, m.y - 26); g.lineTo(m.x, m.y)
      g.lineStyle(0)
      g.beginFill(0xfff1c0); g.drawCircle(m.x, m.y, 5); g.endFill()
      if (m.y >= this.groundY - 2) {
        this.meteors.splice(i, 1)
        this._impact(m.x)
      }
    }

    // bless sparkles
    if (this.blessTimer > 0 && Math.random() < 0.6) {
      this.sparkles.push({ x: this.padX + Math.random() * (this.w - this.padX * 2), y: this.groundY - 4, vy: -(20 + Math.random() * 30), life: 1 })
    }
    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      const s = this.sparkles[i]
      s.y += s.vy * dt; s.life -= dt * 0.6
      if (s.life <= 0) { this.sparkles.splice(i, 1); continue }
      g.beginFill(0xffe890, s.life); g.drawCircle(s.x, s.y, 1.6); g.endFill()
    }

    // drought haze
    if (this.droughtTimer > 0) {
      g.beginFill(0xb98a3a, 0.06); g.drawRect(0, 0, this.w, this.groundY); g.endFill()
    }

    // age scars
    this.scars.forEach(s => s.age += dt * 60)
    this.scars = this.scars.filter(s => s.age < 600)
  }

  // ------------------------------------------------------------------ reactions
  reactMeteor(d) {
    // Prefer the real click position if provided; else aim at a settlement.
    let x = d && typeof d.screenX === 'number' ? d.screenX : null
    if (x == null) {
      const n = Math.max(1, this.settlements.length)
      const idx = Math.floor(Math.random() * n)
      x = this._zoneFor(idx, n).cx
    }
    x = clamp(x, this.padX, this.w - this.padX)
    this.meteors.push({ x, y: -20, vy: 120 })
  }

  _impact(x) {
    this.flash = 0.8
    this.shake = 14
    this.scars.push({ x, age: 0 })
    // kill a few nearby figures
    this.people.forEach(p => {
      if (!p.dead && Math.abs(p.x - x) < 40 && Math.random() < 0.5) p.dead = true
    })
  }

  _cull(frac) {
    this.people.forEach(p => { if (!p.dead && Math.random() < frac) p.dead = true })
  }

  // ------------------------------------------------------------------ input
  _onClick(e) {
    if (!this.visible) return
    const rect = this.app.view.getBoundingClientRect()
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top
    // only respond to clicks near the ground band
    if (cy < this.groundY - 30 || cy > this.h) return
    let best = null, bestD = 36
    for (const p of this.people) {
      if (p.dead) continue
      const d = Math.abs(p.x - cx)
      if (d < bestD) { bestD = d; best = p }
    }
    if (best) this._showPersonCard(best.agent)
  }

  _showPersonCard(agent) {
    const el = document.getElementById('person-card')
    if (!el) return
    if (!agent) { el.classList.add('hidden'); return }
    const name = agent.name || 'Unknown'
    const role = agent.role || 'settler'
    const age = agent.age || 20
    let belief = 'Waiting for a sign.'
    const myths = this.gameState.planet?.myths || []
    if (agent.beliefs && agent.beliefs.length) {
      const resolved = agent.beliefs.map(id => myths.find(m => m.id === id)).filter(Boolean)
      if (resolved.length) belief = resolved[resolved.length - 1].legend
    } else if (agent.settlement && agent.settlement.dominantMythType) {
      belief = `Follows the ${agent.settlement.dominantMythType} tradition.`
    }
    const sect = agent.settlement?.dominantReligion?.name || 'No Sect'
    el.classList.remove('hidden')
    el.innerHTML =
      '<div class="pc-name">' + name.toUpperCase() + '</div>' +
      '<div class="pc-role">' + (role.charAt(0).toUpperCase() + role.slice(1)) + ' · Age ' + age + '</div>' +
      '<div class="pc-divider"></div>' +
      '<div class="pc-label">Believes:</div>' +
      '<div class="pc-belief">"' + belief + '"</div>' +
      '<div class="pc-label">Member of:</div>' +
      '<div class="pc-sect">' + sect + '</div>'
  }
}
