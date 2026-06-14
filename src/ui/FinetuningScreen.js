// The cold open. Paced one beat at a time, centered, jargon-free — it plants the
// "the universe is suspiciously tuned for life… as if someone set it" idea and the
// game's hook (they will name you) without ever saying "simulation hypothesis".

const BEATS = [
  { text: 'Nothing about the universe had to be this way.',                         font: 'mono', hold: 2200 },
  { text: 'Make gravity a little stronger — and the stars collapse.',               font: 'mono', hold: 2200 },
  { text: 'A little weaker — and they never catch fire.',                           font: 'mono', hold: 2200 },
  { text: 'Every force, balanced on a knife’s edge — exactly where life can exist.', font: 'mono', hold: 2800 },
  { text: 'Either it is the luckiest accident imaginable…',                          font: 'mono', hold: 2200 },
  { text: '…or someone set the dials.',                                             font: 'mono', hold: 3000 },
  { text: 'Tonight, you set the dials.',                                            font: 'ui',   hold: 2400 },
  { text: 'Build a world. Wait. Watch.',                                            font: 'ui',   hold: 2400 },
  { text: 'Most worlds die. Yours will too, in time.',                              font: 'ui',   hold: 2600 },
  { text: 'But first — they will wonder who made them.',                            font: 'ui',   hold: 2600 },
  { text: 'And they will give you a name.',                                         font: 'ui',   hold: 3200, emphasis: true }
]

export class FinetuningScreen {
  constructor(el, eventBus) {
    this.el = el
    this.eventBus = eventBus
    this._build()
  }

  _build() {
    this.el.innerHTML = `
      <style>
        #ft-stage {
          position: relative;
          width: 100%;
          min-height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 24px;
          box-sizing: border-box;
          overflow: hidden;
        }
        #ft-planet {
          position: absolute;
          width: 320px; height: 320px; border-radius: 50%;
          background: radial-gradient(circle at 38% 34%, #2fd0c4 0%, #1c8aa6 45%, #0b2f4a 100%);
          filter: blur(2px);
          opacity: 0;
          transition: opacity 6000ms ease, box-shadow 1200ms ease;
          z-index: 0;
        }
        #ft-beat {
          position: relative;
          z-index: 2;
          max-width: 620px;
          font-size: 21px;
          line-height: 1.7;
          color: #eef0ff;
          opacity: 0;
          transition: opacity 600ms ease;
          text-shadow: 0 2px 24px rgba(0,0,0,0.8);
        }
        #ft-beat.ft-mono { font-family: 'Space Mono', monospace; color: #cfd6f5; letter-spacing: 0.5px; }
        #ft-beat.ft-ui   { font-family: 'Inter', system-ui, sans-serif; color: #ffffff; font-weight: 500; }
        #ft-beat.ft-emph { color: #ffcf6b; font-size: 26px; text-shadow: 0 0 28px rgba(255,207,107,0.45); }
        #ft-controls {
          position: absolute; bottom: 28px; left: 0; right: 0;
          display: flex; gap: 14px; justify-content: center; align-items: center;
          z-index: 3;
        }
        .ft-btn {
          background: transparent; border: 1px solid #2a2a4a; color: #8a8ab0;
          font-family: 'Space Mono', monospace; font-size: 12px; letter-spacing: 2px;
          padding: 9px 18px; border-radius: 4px; cursor: pointer; transition: all 180ms;
          opacity: 0.7;
        }
        .ft-btn:hover { color: #4aff9a; border-color: #4aff9a; opacity: 1; }
        #ft-continue { display: none; border-color: #4aff9a; color: #4aff9a; }
        #ft-hint { position: absolute; bottom: 8px; left:0; right:0; text-align:center;
          font-family:'Space Mono',monospace; font-size:10px; color:#45456a; z-index:3; }
        @media (prefers-reduced-motion: reduce) {
          #ft-beat, #ft-planet { transition-duration: 200ms; }
        }
      </style>
      <div id="ft-stage">
        <div id="ft-planet"></div>
        <div id="ft-beat"></div>
        <div id="ft-controls">
          <button class="ft-btn" id="ft-continue">▸ CONTINUE SAVED WORLD</button>
          <button class="ft-btn" id="ft-skip">SKIP ▸</button>
        </div>
        <div id="ft-hint">click to continue</div>
      </div>
    `
    // The screen container must fill the viewport and center its content.
    this.el.style.display = 'flex'
    this.el.style.alignItems = 'stretch'
    this.el.style.justifyContent = 'center'

    this.stage = this.el.querySelector('#ft-stage')
    this.beatEl = this.el.querySelector('#ft-beat')
    this.planetEl = this.el.querySelector('#ft-planet')
    this.skipBtn = this.el.querySelector('#ft-skip')
    this.continueBtn = this.el.querySelector('#ft-continue')
    this.hintEl = this.el.querySelector('#ft-hint')
  }

  show() {
    this._done = false
    this._i = 0
    clearTimeout(this._beatTimer)

    let savedState = null
    try {
      const raw = localStorage.getItem('terrarium_planet_save')
      if (raw) savedState = JSON.parse(raw)
    } catch (e) {}
    const canResume = !!(savedState && savedState.resumeState)

    // Slowly bring a faint world into focus over the sequence.
    requestAnimationFrame(() => { this.planetEl.style.opacity = '0.22' })

    this.skipBtn.onclick = (e) => { e.stopPropagation(); this._finish(false, savedState) }
    if (canResume) {
      this.continueBtn.style.display = 'inline-block'
      this.continueBtn.onclick = (e) => { e.stopPropagation(); this._finish(true, savedState) }
    } else {
      this.continueBtn.style.display = 'none'
    }
    // Click anywhere advances to the next beat (doesn't skip the whole thing).
    this.stage.onclick = () => this._advance()

    this._showBeat(savedState)
  }

  _showBeat(savedState) {
    if (this._done) return
    if (this._i >= BEATS.length) { this._finish(false, savedState); return }
    const b = BEATS[this._i++]
    this.beatEl.className = (b.font === 'ui' ? 'ft-ui' : 'ft-mono') + (b.emphasis ? ' ft-emph' : '')
    this.beatEl.textContent = b.text
    this.beatEl.style.opacity = '0'
    if (b.emphasis) this.planetEl.style.boxShadow = '0 0 90px rgba(47,208,196,0.5)'
    requestAnimationFrame(() => { this.beatEl.style.opacity = '1' })

    this._beatTimer = setTimeout(() => {
      this.beatEl.style.opacity = '0'
      this._beatTimer = setTimeout(() => this._showBeat(savedState), 600)
    }, b.hold)
  }

  _advance() {
    if (this._done) return
    clearTimeout(this._beatTimer)
    this.beatEl.style.opacity = '0'
    this._beatTimer = setTimeout(() => this._showBeat(this._savedState), 250)
  }

  _finish(resume, savedState) {
    if (this._done) return
    this._done = true
    clearTimeout(this._beatTimer)
    this.stage.onclick = null
    this.el.style.transition = 'opacity 600ms ease'
    this.el.style.opacity = '0'
    setTimeout(() => {
      this.el.classList.remove('active')
      this.el.style.opacity = ''
      this.el.style.transition = ''
      this.el.style.display = ''
      this.el.style.alignItems = ''
      this.el.style.justifyContent = ''
      this.planetEl.style.opacity = '0'
      this.planetEl.style.boxShadow = ''
      if (resume && savedState && savedState.resumeState) {
        this.eventBus.emit('setup:complete', savedState)
      } else {
        this.eventBus.emit('finetuning:complete')
      }
    }, 600)
  }
}
