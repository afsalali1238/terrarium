// Guided first run. The intro card sells the fantasy; this teaches the *mechanics*
// — one short, skippable tip at a time, only on a player's first ever run. Each tip
// fires off a real event, so it appears exactly when the thing it explains becomes
// relevant (progressive disclosure, not a wall of instructions).

const DONE_KEY = 'terrarium_coach_done'

export class CoachMarks {
  constructor(eventBus, gameState) {
    this.eventBus = eventBus
    this.gameState = gameState
    this.disabled = false
    this.shown = {}
    this.queue = []
    this.visible = false

    try { if (localStorage.getItem(DONE_KEY)) this.disabled = true } catch (e) {}
    if (this.disabled) return

    this._build()

    eventBus.on('myth:created', () => this._say('myth',
      'They have begun telling stories — about you. The log on the right is their myths.'))
    eventBus.on('devotion:change', () => this._say('devotion',
      'Devotion (left) is their faith in you. Earn enough and you can work a miracle.'))
    eventBus.on('sim:tick', () => {
      const h = this.gameState.planet?.getHealthScore?.() ?? 1
      if (h < 0.65) this._say('climate',
        'Your world is slipping. Open 🌡 Climate (top-right) to steady the conditions.')
    })
    eventBus.on('ui:choice', () => this._say('choice',
      'They are asking you to decide. Whatever you choose, they will remember.'))
    eventBus.on('sim:epoch_change', ({ epoch }) => {
      if (epoch === 'reckoning') { this._say('reckoning',
        'They are about to discover the truth about their world. Watch closely.'); this._finish() }
    })
    eventBus.on('planet:death', () => this._finish())
  }

  _build() {
    const style = document.createElement('style')
    style.textContent = `
      #coach-toast{position:fixed;top:72px;left:50%;transform:translateX(-50%) translateY(-8px);
        z-index:130;max-width:380px;width:calc(100% - 32px);display:none;opacity:0;
        background:rgba(12,12,28,0.94);border:1px solid #3a3a6a;border-left:3px solid #4aff9a;
        border-radius:8px;padding:12px 14px;font-family:'Inter',system-ui,sans-serif;
        box-shadow:0 8px 30px rgba(0,0,0,0.5);transition:opacity 320ms ease,transform 320ms ease}
      #coach-toast.show{display:block;opacity:1;transform:translateX(-50%) translateY(0)}
      #coach-text{font-size:13px;color:#eef0ff;line-height:1.5}
      #coach-skip{margin-top:8px;font-family:'Space Mono',monospace;font-size:10px;letter-spacing:1px;
        color:#7070a0;background:none;border:none;cursor:pointer;padding:0}
      #coach-skip:hover{color:#ff8a8a}
    `
    document.head.appendChild(style)
    this.el = document.createElement('div')
    this.el.id = 'coach-toast'
    this.el.innerHTML = '<div id="coach-text"></div><button id="coach-skip">✕ skip tips</button>'
    document.body.appendChild(this.el)
    this.textEl = this.el.querySelector('#coach-text')
    this.el.querySelector('#coach-skip').onclick = () => this._finish()
  }

  _say(id, text) {
    if (this.disabled || this.shown[id]) return
    this.shown[id] = true
    this.queue.push(text)
    if (!this.visible) this._next()
  }

  _next() {
    if (this.disabled) return
    const text = this.queue.shift()
    if (!text) { this.visible = false; return }
    this.visible = true
    this.textEl.textContent = text
    this.el.classList.add('show')
    clearTimeout(this._t)
    this._t = setTimeout(() => {
      this.el.classList.remove('show')
      setTimeout(() => this._next(), 360)
    }, 6500)
  }

  _finish() {
    if (this.disabled) return
    this.disabled = true
    try { localStorage.setItem(DONE_KEY, '1') } catch (e) {}
    clearTimeout(this._t)
    if (this.el) this.el.classList.remove('show')
  }
}
