// G5 — Devotion. The civilization's faith in you (a relationship/resource, NOT a
// score). Many actions already emit `devotion:change`; this consumes them, shows a
// live meter (continuous feedback) and a goal to climb, and unlocks a Miracle at
// high faith. Self-contained DOM so it doesn't collide with index.html edits.

const TIERS = [
  { min: 0,  label: 'Forgotten', color: '#7070a0' },
  { min: 20, label: 'Known',     color: '#8fa9ff' },
  { min: 45, label: 'Revered',   color: '#4aff9a' },
  { min: 80, label: 'Worshipped', color: '#ffcc55' }
]

export class DevotionMeter {
  constructor(eventBus, gameState) {
    this.eventBus = eventBus
    this.gameState = gameState
    this._build()
    this.eventBus.on('devotion:change', ({ delta }) => this._change(delta))
    this.eventBus.on('setup:complete', () => { this.gameState.devotion = 0; this.setVisible(true); this._render() })
    this.eventBus.on('planet:death', () => this.setVisible(false))
  }

  _build() {
    if (!document.getElementById('devotion-styles')) {
      const s = document.createElement('style')
      s.id = 'devotion-styles'
      s.textContent = `
        #devotion-meter{position:fixed;top:104px;left:16px;z-index:48;width:220px;display:none;
          background:rgba(8,8,24,0.78);border:1px solid #2a2a4a;border-radius:8px;padding:10px 12px;
          font-family:'Inter',sans-serif;backdrop-filter:blur(3px)}
        #devotion-meter .dv-head{display:flex;justify-content:space-between;font-size:11px;
          letter-spacing:1px;text-transform:uppercase;color:#9a9ac8;margin-bottom:6px}
        #devotion-meter .dv-tier{font-family:'Space Mono',monospace}
        #devotion-meter .dv-bar{height:8px;border-radius:4px;background:#13132a;overflow:hidden}
        #devotion-meter .dv-fill{height:100%;width:0;transition:width 400ms ease,background 400ms}
        #dv-miracle{display:none;margin-top:9px;width:100%;background:#1a1530;border:1px solid #ffcc55;
          color:#ffe08a;border-radius:6px;padding:8px;cursor:pointer;font-size:12px}
        #dv-miracle.ready{display:block;animation:dvpulse 1.6s ease-in-out infinite}
        @keyframes dvpulse{0%,100%{box-shadow:0 0 0 rgba(255,204,85,0)}50%{box-shadow:0 0 14px rgba(255,204,85,0.5)}}
      `
      document.head.appendChild(s)
    }
    this.el = document.createElement('div')
    this.el.id = 'devotion-meter'
    this.el.innerHTML =
      '<div class="dv-head"><span>Devotion</span><span class="dv-tier" id="dv-tier">Forgotten</span></div>' +
      '<div class="dv-bar"><div class="dv-fill" id="dv-fill"></div></div>' +
      '<button id="dv-miracle" aria-label="Perform a miracle" title="Cost: 80. Averts disaster and forces a Golden Age.">✨ Reveal Yourself</button>'
    document.body.appendChild(this.el)
    this.fill = this.el.querySelector('#dv-fill')
    this.tierEl = this.el.querySelector('#dv-tier')
    this.miracleBtn = this.el.querySelector('#dv-miracle')
    this.miracleBtn.onclick = () => this._miracle()
  }

  _change(delta) {
    const v = Math.max(0, Math.min(100, (this.gameState.devotion || 0) + (delta || 0)))
    this.gameState.devotion = v
    this._render()
  }

  _tier(v) {
    let t = TIERS[0]
    for (const x of TIERS) if (v >= x.min) t = x
    return t
  }

  _render() {
    const v = this.gameState.devotion || 0
    const t = this._tier(v)
    this.fill.style.width = v + '%'
    this.fill.style.background = t.color
    this.tierEl.textContent = t.label
    this.tierEl.style.color = t.color
    this.miracleBtn.classList.toggle('ready', v >= 80)
  }

  _miracle() {
    if ((this.gameState.devotion || 0) < 80) return
    const p = this.gameState.planet
    const s = p?.settlements?.[0]
    
    // A2: Real sim effect
    this.eventBus.emit('intervention:miracle', { tick: p?.tick || 0 })

    // A pure-narrative miracle (no cross-file edits): a dramatic, gold myth.
    this.eventBus.emit('sim:civ_event', { event: {
      type: 'miracle',
      text: `The sky opened over ${s?.name || 'the world'} and, for one impossible moment, the watcher was visible to all. The climate settled, the sick rose, and no one who saw it ever doubted again.`,
      feedsMyth: true,
      tick: p?.tick || 0
    } })
    if (p) p.divineAnswer = 'revealed'
    this.gameState.devotion = 0   // A2: a miracle spends all 80+ faith
    this._render()
  }

  setVisible(v) {
    this.el.style.display = v ? 'block' : 'none'
    if (!v) this.miracleBtn.classList.remove('ready')
  }
}
