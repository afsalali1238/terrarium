// G1 — Live environment. The 6 setup sliders were abandoned after launch; this
// brings the climate back into the run as an always-available panel. Adjusting it
// emits `intervention:climate { key, value }`, which SimEngine eases into
// planet.sliders over time. Each change costs Influence, so it's a decision.

const FIELDS = [
  { key: 'heat',       label: 'Heat',  hint: 'warmth of the surface' },
  { key: 'water',      label: 'Water', hint: 'ocean & rain coverage' },
  { key: 'atmosphere', label: 'Air',   hint: 'breathable atmosphere' },
  { key: 'soil',       label: 'Soil',  hint: 'nutrient richness' }
]

export class ClimatePanel {
  constructor(eventBus, gameState) {
    this.eventBus = eventBus
    this.gameState = gameState
    this.applied = {}      // last target we paid for, per key
    this.open = false
    this._build()

    this.eventBus.on('setup:complete', () => this._onStart())
    this.eventBus.on('planet:death', () => this.setVisible(false))
  }

  _build() {
    if (!document.getElementById('climate-panel-styles')) {
      const style = document.createElement('style')
      style.id = 'climate-panel-styles'
      style.textContent = `
        #climate-toggle{position:fixed;top:58px;right:16px;z-index:50;display:none;
          background:rgba(8,8,24,0.85);color:#e0e0f0;border:1px solid #2a2a4a;
          border-radius:6px;padding:8px 12px;cursor:pointer;font-family:'Inter',sans-serif;font-size:13px}
        #climate-toggle:hover{border-color:#4aff9a}
        #climate-panel{position:fixed;top:100px;right:16px;z-index:50;width:248px;display:none;
          background:rgba(8,8,24,0.92);border:1px solid #2a2a4a;border-radius:8px;
          padding:14px;backdrop-filter:blur(4px);font-family:'Inter',sans-serif}
        #climate-panel.open{display:block}
        .cp-title{font-size:12px;letter-spacing:2px;color:#9a9ac8;text-transform:uppercase;margin-bottom:10px}
        .cp-row{margin-bottom:12px}
        .cp-row-head{display:flex;justify-content:space-between;font-size:12px;color:#e0e0f0;margin-bottom:4px}
        .cp-val{font-family:'Space Mono',monospace;color:#4aff9a}
        .cp-row input[type=range]{width:100%}
        .cp-hint{font-family:'Space Mono',monospace;font-size:10px;color:#7070a0;margin-top:4px;line-height:1.4}
      `
      document.head.appendChild(style)
    }

    this.toggleBtn = document.createElement('button')
    this.toggleBtn.id = 'climate-toggle'
    this.toggleBtn.setAttribute('aria-label', 'Tune the climate')
    this.toggleBtn.textContent = '🌡 Climate'
    this.toggleBtn.onclick = () => this._toggle()
    document.body.appendChild(this.toggleBtn)

    this.panel = document.createElement('div')
    this.panel.id = 'climate-panel'
    this.panel.innerHTML =
      '<div class="cp-title">Tune the World</div>' +
      FIELDS.map(f =>
        '<div class="cp-row" data-key="' + f.key + '">' +
          '<div class="cp-row-head"><span>' + f.label + '</span><span class="cp-val" id="cp-val-' + f.key + '">50</span></div>' +
          '<input type="range" min="0" max="100" value="50" id="cp-in-' + f.key + '" aria-label="' + f.label + '">' +
        '</div>'
      ).join('') +
      '<div class="cp-hint">Shifting the climate costs Influence (1 per point), and the world takes time to settle.</div>'
    document.body.appendChild(this.panel)

    FIELDS.forEach(f => {
      const input = this.panel.querySelector('#cp-in-' + f.key)
      const val = this.panel.querySelector('#cp-val-' + f.key)
      input.addEventListener('input', () => { val.textContent = input.value })
      input.addEventListener('change', () => this._apply(f.key, parseInt(input.value, 10)))
    })
  }

  _onStart() {
    // Sync sliders to the planet's starting climate, then reveal the controls.
    const s = this.gameState.planet?.sliders || {}
    FIELDS.forEach(f => {
      const v = Math.round(s[f.key] ?? 50)
      this.applied[f.key] = v
      const input = this.panel.querySelector('#cp-in-' + f.key)
      const val = this.panel.querySelector('#cp-val-' + f.key)
      if (input) input.value = v
      if (val) val.textContent = v
    })
    this.setVisible(true)
  }

  _apply(key, value) {
    const prev = this.applied[key] ?? value
    const cost = Math.round(Math.abs(value - prev))
    const input = this.panel.querySelector('#cp-in-' + key)
    const val = this.panel.querySelector('#cp-val-' + key)
    if (cost === 0) return

    if ((this.gameState.influence || 0) < cost) {
      // Not enough Influence — revert to the last paid value.
      if (input) input.value = prev
      if (val) val.textContent = prev
      return
    }
    this.gameState.influence -= cost
    this.applied[key] = value
    this.eventBus.emit('intervention:climate', { key, value, cost, tick: this.gameState.planet?.tick || 0 })
  }

  _toggle() {
    this.open = !this.open
    this.panel.classList.toggle('open', this.open)
  }

  setVisible(v) {
    this.toggleBtn.style.display = v ? 'block' : 'none'
    if (!v) { this.open = false; this.panel.classList.remove('open') }
  }
}
