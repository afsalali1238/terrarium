import { getLifeProbability } from '../simulation/Conditions.js'

const SLIDERS = {
  0: [
    { key: 'gravity',      label: 'Surface Gravity',      safe: [25,75],  below: 'Too light — atmosphere drifts away',   above: 'Too heavy — nothing can grow tall' },
    { key: 'starDistance', label: 'Distance from Star',   safe: [30,70],  below: 'Too far — frozen dark',                above: 'Too close — radiation strips the surface' }
  ],
  1: [
    { key: 'atmosphere',   label: 'Air Mix',             safe: [35,65],  below: 'Too thin — nothing to breathe',        above: 'Too dense — toxic pressure' },
    { key: 'heat',         label: 'Surface Temperature',  safe: [30,70],  below: 'Frozen — life cannot start',           above: 'Scorched — thermal runaway' }
  ],
  2: [
    { key: 'water',        label: 'Water Coverage',       safe: [20,80],  below: 'Desert world — no moisture cycle',     above: 'Ocean world — no land to build on' },
    { key: 'soil',         label: 'Soil Richness',        safe: [20,100], below: 'Barren rock — nothing to eat',         above: null }
  ]
};

const STEP_TITLES = [
  "Step 1: The Rock",
  "Step 2: The Atmosphere",
  "Step 3: The Terrain",
  "Step 4: The Era",
  "Step 5: The Origin"
];

const STEP_SUBTITLES = [
  "Define the physical foundation.",
  "Blanket the rock.",
  "Shape the surface.",
  "When does the story begin?",
  "How does it start?"
];

export class SetupScreen {
  constructor(el, eventBus) {
    this.el = el
    this.eventBus = eventBus
    this.values = { atmosphere:50, water:50, heat:50, gravity:50, starDistance:50, soil:50 }
    this.era = null
    this.originSize = null
    this.currentStep = 0
    this._build()
    this._bind()
    eventBus.on('finetuning:complete', () => this.show())
  }

  show() {
    this.el.classList.add('active')
    this.currentStep = 0
    this._setStep(0)
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
        min-height: 18px;
      }
      
      .step-container {
        display: none;
        width: 100%;
        animation: fadeIn 300ms;
      }
      .step-container.active {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
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
      
      .cards-row {
        display: flex;
        gap: 16px;
        width: 100%;
      }
      .card {
        flex: 1;
        border: 1px solid #1e1e3a;
        border-radius: 8px;
        padding: 16px;
        cursor: pointer;
        transition: border-color 300ms, box-shadow 300ms;
        font-family: 'Space Mono', monospace;
      }
      .card:hover { border-color: #4aff9a55; }
      .card.selected { border-color: #4aff9a; box-shadow: 0 0 12px #4aff9a33; }
      .card h3 { font-size: 13px; color: #e0e0f0; margin-bottom: 8px; }
      .card p { font-size: 10px; color: #7070a0; line-height: 1.8; }
      
      .wizard-nav {
        display: flex;
        gap: 16px;
        width: 100%;
        margin-top: 16px;
      }
      .nav-btn {
        flex: 1;
        padding: 14px;
        background: transparent;
        font-family: 'Space Mono', monospace;
        font-size: 14px;
        letter-spacing: 2px;
        cursor: pointer;
        border-radius: 4px;
        transition: background 200ms;
      }
      #btn-back {
        border: 1px solid #7070a0;
        color: #7070a0;
      }
      #btn-back:hover { background: rgba(112, 112, 160, 0.1); }
      #btn-next {
        border: 1px solid #4aff9a;
        color: #4aff9a;
      }
      #btn-next:disabled {
        border-color: #1e1e3a;
        color: #3a3a5a;
        cursor: not-allowed;
      }
      #btn-next:not(:disabled):hover { background: #4aff9a18; }
      
      .progress-dots {
        display: flex;
        gap: 8px;
        margin-bottom: -8px;
      }
      .dot {
        width: 8px; height: 8px;
        border-radius: 50%;
        background: #1e1e3a;
        transition: background 300ms;
      }
      .dot.active { background: #4aff9a; }
    </style>

    <div id="setup-inner">
      <div id="planet-preview"></div>
      
      <div class="progress-dots" id="progress-dots">
        <div class="dot active"></div>
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
      
      <h1 id="setup-title">Step 1: The Rock</h1>
      <p id="setup-subtitle">Define the physical foundation.</p>

      <!-- STEP 0 -->
      <div class="step-container active" data-step="0" id="step-0">
        <div class="slider-group" id="sliders-0"></div>
      </div>

      <!-- STEP 1 -->
      <div class="step-container" data-step="1" id="step-1">
        <div class="slider-group" id="sliders-1"></div>
      </div>

      <!-- STEP 2 -->
      <div class="step-container" data-step="2" id="step-2">
        <div class="slider-group" id="sliders-2"></div>
      </div>

      <!-- STEP 3 -->
      <div class="step-container" data-step="3" id="step-3">
        <div class="cards-row">
          <div class="card era-card" data-era="ancient">
            <h3>⚔ ANCIENT ERA</h3>
            <p>Oral myths · stone to iron<br>Plagues spread by rumor<br>Civilizations last 300–800 yrs</p>
          </div>
          <div class="card era-card" data-era="modern">
            <h3>🏙 MODERN ERA</h3>
            <p>Industry · nuclear · fast collapse<br>Internet conspiracies<br>Civilizations last 80–200 yrs</p>
          </div>
        </div>
      </div>

      <!-- STEP 4 -->
      <div class="step-container" data-step="4" id="step-4">
        <div class="cards-row">
          <div class="card origin-card" data-origin="village">
            <h3>⛺ A SINGLE VILLAGE</h3>
            <p>Start small, grow slowly.<br>A tight-knit community of 5 to 50 founders.</p>
          </div>
          <div class="card origin-card" data-origin="city">
            <h3>🏛 A BUSTLING CITY</h3>
            <p>Hit the ground running.<br>A large metropolis of 100 to 500 inhabitants.</p>
          </div>
        </div>
      </div>

      <div id="life-prob">LIFE PROBABILITY: —%</div>

      <div class="wizard-nav">
        <button id="btn-back" class="nav-btn" style="display:none;">Back</button>
        <button id="btn-next" class="nav-btn">Next →</button>
      </div>
    </div>
    `

    // Build slider rows
    for (let step = 0; step < 3; step++) {
      const container = this.el.querySelector('#sliders-' + step)
      SLIDERS[step].forEach(({ key, label, safe }) => {
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
      const eraCard = e.target.closest('.era-card')
      if (eraCard) {
        this.el.querySelectorAll('.era-card').forEach(c => c.classList.remove('selected'))
        eraCard.classList.add('selected')
        this.era = eraCard.dataset.era
        this._updateNavButtons()
      }

      const originCard = e.target.closest('.origin-card')
      if (originCard) {
        this.el.querySelectorAll('.origin-card').forEach(c => c.classList.remove('selected'))
        originCard.classList.add('selected')
        this.originSize = originCard.dataset.origin
        this._updateNavButtons()
      }

      if (e.target.id === 'btn-next' && !e.target.disabled) {
        if (this.currentStep < 4) {
          this._setStep(this.currentStep + 1)
        } else {
          // Finish!
          this.eventBus.emit('setup:complete', { ...this.values, era: this.era, originSize: this.originSize })
        }
      }

      if (e.target.id === 'btn-back') {
        if (this.currentStep > 0) {
          this._setStep(this.currentStep - 1)
        }
      }
    })
  }

  _setStep(step) {
    this.currentStep = step;
    
    // Update active container
    this.el.querySelectorAll('.step-container').forEach(c => c.classList.remove('active'))
    this.el.querySelector(`#step-${step}`).classList.add('active')

    // Update dots
    const dots = this.el.querySelectorAll('.dot')
    dots.forEach((d, i) => {
      d.classList.toggle('active', i <= step)
    })

    // Update title/subtitle
    this.el.querySelector('#setup-title').textContent = STEP_TITLES[step]
    this.el.querySelector('#setup-subtitle').textContent = STEP_SUBTITLES[step]

    this._updateNavButtons()
  }

  _updateAll() {
    this._updateWarnings()
    this._updateLifeProb()
    this._updatePlanetPreview()
    this._updateNavButtons()
  }

  _updateWarnings() {
    // Iterate all sliders across all steps
    Object.values(SLIDERS).flat().forEach(({ key, safe, below, above }) => {
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

  _updateNavButtons() {
    const btnBack = this.el.querySelector('#btn-back')
    const btnNext = this.el.querySelector('#btn-next')
    if (!btnBack || !btnNext) return

    btnBack.style.display = this.currentStep === 0 ? 'none' : 'block'
    
    if (this.currentStep === 4) {
      btnNext.textContent = 'Seed Life →'
      btnNext.disabled = !this.originSize
    } else {
      btnNext.textContent = 'Next →'
      if (this.currentStep === 3) {
        btnNext.disabled = !this.era
      } else {
        btnNext.disabled = false
      }
    }
  }

  prefillSliders(savedSliders) {
    Object.assign(this.values, savedSliders)
    if (savedSliders.era) {
      this.era = savedSliders.era
      const card = this.el.querySelector(`.era-card[data-era="${this.era}"]`)
      if (card) {
        this.el.querySelectorAll('.era-card').forEach(c => c.classList.remove('selected'))
        card.classList.add('selected')
      }
    }
    if (savedSliders.originSize) {
      this.originSize = savedSliders.originSize
      const card = this.el.querySelector(`.origin-card[data-origin="${this.originSize}"]`)
      if (card) {
        this.el.querySelectorAll('.origin-card').forEach(c => c.classList.remove('selected'))
        card.classList.add('selected')
      }
    }

    // Update range inputs if already rendered
    Object.entries(this.values).forEach(([key, val]) => {
      const input = this.el.querySelector(`input[data-key="${key}"]`)
      if (input) input.value = val
    })
    this._setStep(0)
    this._updateAll()
  }
}
