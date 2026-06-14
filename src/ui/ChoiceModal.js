// G2 — Two-way interaction. When the civilization reaches out (asks if it is
// real, splinters into sects, raises a prophet), the world pauses and the player
// answers. Raised via EventBus `ui:choice { id, title, context, options }`; the
// chosen option is emitted back as `choice:made { id, key }`.

export class ChoiceModal {
  constructor(eventBus, gameState) {
    this.eventBus = eventBus
    this.gameState = gameState
    this.queue = []
    this.active = null
    this._prevSpeed = 1
    this._build()
    this.eventBus.on('ui:choice', (c) => this._enqueue(c))
    // A new run / death clears anything pending.
    this.eventBus.on('setup:complete', () => this._reset())
    this.eventBus.on('planet:death', () => this._reset())
  }

  _build() {
    if (!document.getElementById('choice-modal-styles')) {
      const style = document.createElement('style')
      style.id = 'choice-modal-styles'
      style.textContent = `
        #choice-overlay{position:fixed;inset:0;z-index:120;display:none;
          align-items:center;justify-content:center;background:rgba(4,5,12,0.72);
          backdrop-filter:blur(2px);font-family:'Inter',sans-serif}
        #choice-overlay.open{display:flex}
        #choice-box{max-width:440px;width:90%;background:#0c0c1c;border:1px solid #2a2a4a;
          border-radius:10px;padding:22px;box-shadow:0 12px 48px rgba(0,0,0,0.6)}
        #choice-title{font-size:18px;color:#e8e8f6;margin-bottom:8px;line-height:1.3}
        #choice-context{font-family:'Space Mono',monospace;font-size:12px;color:#9a9ac8;
          line-height:1.5;margin-bottom:18px}
        .choice-opt{display:block;width:100%;text-align:left;margin-bottom:8px;
          background:#13132a;border:1px solid #2a2a4a;color:#e0e0f0;border-radius:6px;
          padding:11px 14px;cursor:pointer;font-size:14px;transition:border-color 150ms,background 150ms}
        .choice-opt:hover{border-color:#4aff9a;background:rgba(74,255,154,0.08)}
      `
      document.head.appendChild(style)
    }
    this.overlay = document.createElement('div')
    this.overlay.id = 'choice-overlay'
    this.overlay.innerHTML =
      '<div id="choice-box" role="dialog" aria-modal="true">' +
      '<div id="choice-title"></div><div id="choice-context"></div>' +
      '<div id="choice-options"></div></div>'
    document.body.appendChild(this.overlay)
    this.titleEl = this.overlay.querySelector('#choice-title')
    this.contextEl = this.overlay.querySelector('#choice-context')
    this.optionsEl = this.overlay.querySelector('#choice-options')
  }

  _enqueue(choice) {
    if (!choice || !choice.options) return
    this.queue.push(choice)
    if (!this.active) this._next()
  }

  _next() {
    this.active = this.queue.shift()
    if (!this.active) { this._close(); return }
    this._prevSpeed = this.gameState.simSpeed ?? 1
    this.gameState.simSpeed = 0   // pause the world while they wait for an answer

    this.titleEl.textContent = this.active.title || ''
    this.contextEl.textContent = this.active.context || ''
    this.optionsEl.innerHTML = ''
    this.active.options.forEach(opt => {
      const b = document.createElement('button')
      b.className = 'choice-opt'
      b.textContent = opt.label
      b.onclick = () => this._choose(opt.key)
      this.optionsEl.appendChild(b)
    })
    this.overlay.classList.add('open')
  }

  _choose(key) {
    const id = this.active ? this.active.id : null
    this.eventBus.emit('choice:made', { id, key })
    this.active = null
    if (this.queue.length) {
      this._next()
    } else {
      this._close()
    }
  }

  _close() {
    this.overlay.classList.remove('open')
    // Restore speed (never resurrect a dead run).
    if (this.gameState.planet && this.gameState.planet.isAlive !== false) {
      this.gameState.simSpeed = this._prevSpeed || 1
    }
  }

  _reset() {
    this.queue = []
    this.active = null
    this.overlay.classList.remove('open')
  }
}
