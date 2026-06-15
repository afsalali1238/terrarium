// The Reckoning, framed. When a civilization discovers the truth of its world, the
// payoff used to scroll past in the ticker amid the HUD. This takes over the screen
// and plays the discovery → reaction → ending beats one at a time, cinematically,
// like the cold open — then fades to reveal the post-mortem behind it.
//
// It reads the actual reckoning prose off `myth:created` (MythEngine creates each
// finale beat as a myth of type 'reckoning'), so it needs no new data plumbing.

export class ReckoningCinematic {
  constructor(eventBus) {
    this.eventBus = eventBus
    this.queue = []
    this.playing = false
    this.ending = false
    this._build()

    eventBus.on('myth:created', ({ myth }) => {
      if (myth && myth.type === 'reckoning' && myth.legend) this._enqueue(myth.legend)
    })
    eventBus.on('planet:death', () => { this.ending = true; this._maybeFinish() })
    eventBus.on('setup:complete', () => this._reset())
  }

  _build() {
    const style = document.createElement('style')
    style.textContent = `
      #reck-overlay{position:fixed;inset:0;z-index:300;display:none;opacity:0;
        align-items:center;justify-content:center;flex-direction:column;text-align:center;
        background:radial-gradient(circle at 50% 45%, rgba(10,14,30,0.82), rgba(3,4,10,0.94));
        transition:opacity 900ms ease;padding:24px;box-sizing:border-box}
      #reck-overlay.show{display:flex;opacity:1}
      #reck-eyebrow{font-family:'Space Mono',monospace;font-size:12px;letter-spacing:6px;
        color:#6f7ba8;text-transform:uppercase;margin-bottom:26px}
      #reck-beat{max-width:640px;font-family:'Inter',system-ui,sans-serif;font-size:23px;
        line-height:1.65;color:#eef0ff;opacity:0;transition:opacity 700ms ease;
        text-shadow:0 2px 30px rgba(0,0,0,0.9)}
    `
    document.head.appendChild(style)
    this.overlay = document.createElement('div')
    this.overlay.id = 'reck-overlay'
    this.overlay.innerHTML = '<div id="reck-eyebrow">The Reckoning</div><div id="reck-beat"></div>'
    document.body.appendChild(this.overlay)
    this.beatEl = this.overlay.querySelector('#reck-beat')
  }

  _enqueue(text) {
    this.queue.push(text)
    if (!this.playing) this._play()
  }

  _play() {
    this.playing = true
    this.overlay.classList.add('show')
    const next = () => {
      const t = this.queue.shift()
      if (t === undefined) { this.playing = false; this._maybeFinish(); return }
      this.beatEl.textContent = t
      this.beatEl.style.opacity = '0'
      requestAnimationFrame(() => { this.beatEl.style.opacity = '1' })
      this._t = setTimeout(() => {
        this.beatEl.style.opacity = '0'
        this._t = setTimeout(next, 700)
      }, 4400)
    }
    next()
  }

  // Once the run has truly ended AND every beat has played, lift the curtain to
  // reveal the post-mortem (which rendered behind this overlay).
  _maybeFinish() {
    if (this.ending && !this.playing && this.queue.length === 0) {
      this._t = setTimeout(() => this.overlay.classList.remove('show'), 600)
    }
  }

  _reset() {
    clearTimeout(this._t)
    this.queue = []
    this.playing = false
    this.ending = false
    this.overlay.classList.remove('show')
    this.beatEl.style.opacity = '0'
  }
}
