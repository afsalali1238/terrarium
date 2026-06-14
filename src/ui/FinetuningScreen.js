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
        #btn-continue {
          display: none;
          margin-top: 20px;
          padding: 12px 24px;
          background: #4aff9a18;
          border: 1px solid #4aff9a;
          color: #4aff9a;
          font-family: 'Space Mono', monospace;
          font-size: 14px;
          letter-spacing: 2px;
          cursor: pointer;
          border-radius: 4px;
          transition: background 200ms;
          opacity: 0;
        }
        #btn-continue:hover { background: #4aff9a33; }
      </style>
      <div id="finetuning-wrap">
        <p class="ft-line" data-delay="500">The cosmological constant is precise to 1 part in 10¹²⁰.</p>
        <p class="ft-line" data-delay="1500">The strong nuclear force is precise to 1 part in 100.</p>
        <p class="ft-line" data-delay="2500">You are about to try to replicate this.</p>
        <p class="ft-line" data-delay="3200">You will fail many times.</p>
        <p class="ft-line" data-delay="3700">That is the point.</p>
        <button id="btn-continue">CONTINUE SAVED PLANET</button>
      </div>
    `
  }

  show() {
    let savedState = null;
    try {
      const raw = localStorage.getItem('terrarium_planet_save');
      if (raw) savedState = JSON.parse(raw);
    } catch(e) {}

    const lines = this.el.querySelectorAll('.ft-line')
    lines.forEach(line => {
      const delay = parseInt(line.dataset.delay, 10)
      setTimeout(() => { line.style.opacity = '1' }, delay)
    })

    let timeoutId;
    const finish = (resume) => {
      clearTimeout(timeoutId);
      this.el.style.transition = 'opacity 600ms ease'
      this.el.style.opacity = '0'
      setTimeout(() => {
        this.el.classList.remove('active')
        this.el.style.opacity = ''
        this.el.style.transition = ''
        if (resume && savedState && savedState.resumeState) {
          this.eventBus.emit('setup:complete', savedState);
        } else {
          this.eventBus.emit('finetuning:complete')
        }
      }, 600)
    };

    if (savedState && savedState.resumeState) {
      const btn = this.el.querySelector('#btn-continue');
      btn.style.display = 'block';
      setTimeout(() => { btn.style.opacity = '1' }, 500);
      btn.onclick = () => finish(true);
      // Wait longer if there's a continue button so they can click it
      timeoutId = setTimeout(() => finish(false), 8000);
    } else {
      timeoutId = setTimeout(() => finish(false), 5000)
    }
  }
}
