import { getLifeProbability } from '../simulation/Conditions.js'

const SLIDERS = [
  { key: 'atmosphere',   label: 'Air Mix',             safe: [35,65],  below: 'Too thin — nothing to breathe',        above: 'Too dense — toxic pressure' },
  { key: 'water',        label: 'Water Coverage',       safe: [20,80],  below: 'Desert world — no moisture cycle',     above: 'Ocean world — no land to build on' },
  { key: 'heat',         label: 'Surface Temperature',  safe: [30,70],  below: 'Frozen — life cannot start',           above: 'Scorched — thermal runaway' },
  { key: 'gravity',      label: 'Surface Gravity',      safe: [25,75],  below: 'Too light — atmosphere drifts away',   above: 'Too heavy — nothing can grow tall' },
  { key: 'starDistance', label: 'Distance from Star',   safe: [30,70],  below: 'Too far — frozen dark',                above: 'Too close — radiation strips the surface' },
  { key: 'soil',         label: 'Soil Richness',        safe: [20,100], below: 'Barren rock — nothing to eat',         above: null }
]

export class SetupScreen {
  constructor(el, eventBus) {
    this.el = el
    this.eventBus = eventBus
    this.values = { atmosphere:50, water:50, heat:50, gravity:50, starDistance:50, soil:50 }
    this.era = null
    this._build()
    this._bind()
    eventBus.on('finetuning:complete', () => this.show())
  }

  show() {
    this.el.classList.add('active')
    this._updateAll()
  }

  _build() {
    this.el.innerHTML = `
    <style>
      #setup-inner {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 24px;
        width: 100%;
        max-width: 560px;
        padding-bottom: 60px;
        margin: auto;
      }
      #planet-preview {
        width: 150px; height: 150px;
        border-radius: 50%;
        background: #1a3a5a;
        box-shadow: 0 0 30px 6px #4aff9a44;
        transition: background 600ms, box-shadow 600ms;
        flex-shrink: 0;
      }
      #setup-title {
        font-family: 'Space Mono', monospace;
        font-size: 20px;
        color: #e0e0f0;
        text-align: center;
      }
      #setup-subtitle {
        font-family: 'Space Mono', monospace;
        font-size: 12px;
        color: #7070a0;
        text-align: center;
        margin-top: -16px;
      }
      .slider-group {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .slider-row {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .slider-label {
        font-family: 'Space Mono', monospace;
        font-size: 12px;
        color: #a0a0c0;
        width: 160px;
        flex-shrink: 0;
      }
      .slider-track-wrap {
        flex: 1;
        position: relative;
        height: 20px;
        display: flex;
        align-items: center;
      }
      .slider-track-wrap input[type=range] {
        width: 100%;
        -webkit-appearance: none;
        appearance: none;
        height: 4px;
        border-radius: 2px;
        outline: none;
        cursor: pointer;
        position: relative;
        z-index: 2;
        background: transparent;
      }
      .slider-track-wrap input[type=range]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 14px; height: 14px;
        border-radius: 50%;
        background: #e0e0f0;
        cursor: pointer;
      }
      .slider-bg {
        position: absolute;
        left: 0; right: 0;
        height: 4px;
        border-radius: 2px;
        pointer-events: none;
        z-index: 1;
      }
      .slider-val {
        font-family: 'Space Mono', monospace;
        font-size: 13px;
        color: #e0e0f0;
        width: 28px;
        text-align: right;
        flex-shrink: 0;
      }
      .slider-warning {
        font-family: 'Space Mono', monospace;
        font-size: 10px;
        min-height: 14px;
        padding-left: 172px;
      }
      #life-prob {
        font-family: 'Space Mono', monospace;
        font-size: 16px;
        letter-spacing: 2px;
        margin-top: 4px;
      }
      .era-row {
        display: flex;
        gap: 16px;
        width: 100%;
      }
      .era-card {
        flex: 1;
        border: 1px solid #1e1e3a;
        border-radius: 8px;
        padding: 16px;
        cursor: pointer;
        transition: border-color 300ms, box-shadow 300ms;
        font-family: 'Space Mono', monospace;
      }
      .era-card:hover { border-color: #4aff9a55; }
      .era-card.selected { border-color: #4aff9a; box-shadow: 0 0 12px #4aff9a33; }
      .era-card h3 { font-size: 13px; color: #e0e0f0; margin-bottom: 8px; }
      .era-card p { font-size: 10px; color: #7070a0; line-height: 1.8; }
      #btn-seed {
        width: 100%;
        padding: 14px;
        background: transparent;
        border: 1px solid #4aff9a;
        color: #4aff9a;
        font-family: 'Space Mono', monospace;
        font-size: 14px;
        letter-spacing: 2px;
        cursor: pointer;
        border-radius: 4px;
        transition: background 200ms;
      }
      #btn-seed:disabled {
        border-color: #1e1e3a;
        color: #3a3a5a;
        cursor: not-allowed;
      }
      #btn-seed:not(:disabled):hover { background: #4aff9a18; }
    </style>

    <div id="setup-inner">
      <div id="planet-preview"></div>
      <h1 id="setup-title">Configure Your Planet</h1>
      <p id="setup-subtitle">Every civilization that ever lived got exactly this right.</p>

      <div class="slider-group" id="sliders-container"></div>

      <div id="life-prob">LIFE PROBABILITY: —%</div>

      <div class="era-row">
        <div class="era-card" data-era="ancient">
          <h3>⚔ ANCIENT ERA</h3>
          <p>Oral myths · stone to iron<br>Plagues spread by rumor<br>Civilizations last 300–800 yrs</p>
        </div>
        <div class="era-card" data-era="modern">
          <h3>🏙 MODERN ERA</h3>
          <p>Industry · nuclear · fast collapse<br>Internet conspiracies<br>Civilizations last 80–200 yrs</p>
        </div>
      </div>

      <button id="btn-seed" disabled>Seed Life →</button>
    </div>
    `

    // Build slider rows
    const container = this.el.querySelector('#sliders-container')
    SLIDERS.forEach(({ key, label, safe }) => {
      const [min, max] = safe
      // Safe zone gradient percent
      const safeLeft = `${min}%`
      const safeWidth = `${max - min}%`
      container.insertAdjacentHTML('beforeend', `
        <div class="slider-row">
          <span class="slider-label">${label}</span>
          <div class="slider-track-wrap">
            <div class="slider-bg" id="bg-${key}"
              style="background: linear-gradient(to right, #1e1e3a ${safeLeft}, #2a4a2a ${safeLeft}, #2a4a2a calc(${safeLeft} + ${safeWidth}), #1e1e3a calc(${safeLeft} + ${safeWidth}))">
            </div>
            <input type="range" min="0" max="100" step="1" value="${this.values[key]}" data-key="${key}" />
          </div>
          <span class="slider-val" id="val-${key}">${this.values[key]}</span>
        </div>
        <div class="slider-warning" id="warn-${key}"></div>
      `)
    })
  }

  _bind() {
    this.el.addEventListener('input', e => {
      if (e.target.matches('input[type=range]')) {
        const key = e.target.dataset.key
        this.values[key] = parseInt(e.target.value, 10)
        this._updateAll()
      }
    })

    this.el.addEventListener('click', e => {
      const card = e.target.closest('.era-card')
      if (card) {
        this.el.querySelectorAll('.era-card').forEach(c => c.classList.remove('selected'))
        card.classList.add('selected')
        this.era = card.dataset.era
        this._updateSeedButton()
      }
      if (e.target.id === 'btn-seed' && !e.target.disabled) {
        this.eventBus.emit('setup:complete', { ...this.values, era: this.era })
      }
    })
  }

  _updateAll() {
    this._updateWarnings()
    this._updateLifeProb()
    this._updatePlanetPreview()
    this._updateSeedButton()
  }

  _updateWarnings() {
    SLIDERS.forEach(({ key, safe, below, above }) => {
      const val = this.values[key]
      const warnEl = this.el.querySelector(`#warn-${key}`)
      const valEl = this.el.querySelector(`#val-${key}`)
      if (!warnEl) return
      if (val < safe[0]) {
        warnEl.textContent = below
        warnEl.style.color = '#ff4a4a'
      } else if (val > safe[1]) {
        warnEl.textContent = above ?? ''
        warnEl.style.color = above ? '#ffb84a' : ''
      } else {
        warnEl.textContent = ''
      }
      valEl.textContent = val
    })
  }

  _updateLifeProb() {
    const prob = getLifeProbability(this.values)
    const el = this.el.querySelector('#life-prob')
    if (!el) return
    el.textContent = `LIFE PROBABILITY: ${prob}%`
    el.style.color = prob > 60 ? '#4aff9a' : prob > 30 ? '#ffb84a' : '#ff4a4a'
  }

  _updatePlanetPreview() {
    const el = this.el.querySelector('#planet-preview')
    if (!el) return
    const prob = getLifeProbability(this.values)
    if (prob > 60) {
      el.style.background = 'radial-gradient(circle at 35% 35%, #3adfaa, #1a5a8a)'
      el.style.boxShadow = '0 0 30px 6px #4aff9a44'
    } else if (prob > 30) {
      el.style.background = 'radial-gradient(circle at 35% 35%, #c0602a, #3a2a1a)'
      el.style.boxShadow = 'none'
    } else {
      el.style.background = 'radial-gradient(circle at 35% 35%, #3a1a1a, #0a0a0a)'
      el.style.boxShadow = '0 0 12px 2px #ff000022'
    }
  }

  _updateSeedButton() {
    const btn = this.el.querySelector('#btn-seed')
    if (!btn) return
    btn.disabled = !this.era
  }

  prefillSliders(savedSliders) {
    Object.assign(this.values, savedSliders)
    // Update range inputs if already rendered
    Object.entries(this.values).forEach(([key, val]) => {
      const input = this.el.querySelector(`input[data-key="${key}"]`)
      if (input) input.value = val
    })
    this._updateAll()
  }
}
