export class FinetuningScreen {
  constructor(el, eventBus) {
    this.el = el
    this.eventBus = eventBus
    this._build()
  }

  _build() {
    this.el.innerHTML = `
      <style>
        #finetuning-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 28px;
          max-width: 500px;
          padding: 40px;
        }
        .ft-line {
          font-family: 'Space Mono', monospace;
          font-size: 15px;
          color: #ffffff;
          line-height: 2;
          text-align: center;
          opacity: 0;
          transition: opacity 400ms ease;
        }
      </style>
      <div id="finetuning-wrap">
        <p class="ft-line" data-delay="500">The cosmological constant is precise to 1 part in 10¹²⁰.</p>
        <p class="ft-line" data-delay="1500">The strong nuclear force is precise to 1 part in 100.</p>
        <p class="ft-line" data-delay="2500">You are about to try to replicate this.</p>
        <p class="ft-line" data-delay="3200">You will fail many times.</p>
        <p class="ft-line" data-delay="3700">That is the point.</p>
      </div>
    `
  }

  show() {
    const lines = this.el.querySelectorAll('.ft-line')
    lines.forEach(line => {
      const delay = parseInt(line.dataset.delay, 10)
      setTimeout(() => { line.style.opacity = '1' }, delay)
    })
    // After all lines: 1s pause, then fade out and emit
    setTimeout(() => {
      this.el.style.transition = 'opacity 600ms ease'
      this.el.style.opacity = '0'
      setTimeout(() => {
        this.el.classList.remove('active')
        this.el.style.opacity = ''
        this.el.style.transition = ''
        this.eventBus.emit('finetuning:complete')
      }, 600)
    }, 5000)
  }
}
