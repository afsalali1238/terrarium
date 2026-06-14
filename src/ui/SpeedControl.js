export class SpeedControl {
  constructor(el, eventBus, gameState) {
    this.el = el;
    this.eventBus = eventBus;
    this.gameState = gameState;
    
    // Valid speeds: 0 = paused, 0.5 = half, 1 = normal, 4 = fast
    this.speeds = [0.5, 1, 4];
    this.currentIdx = 1; // Default to 1x
    this.isPaused = false;

    this._build();
    this._attachEvents();
  }

  _build() {
    this.el.innerHTML = `
      <button class="speed-btn" id="btn-pause" aria-label="Pause Simulation">⏸</button>
      <button class="speed-btn" data-speed="0.5" aria-label="Half Speed">0.5×</button>
      <button class="speed-btn active" data-speed="1" aria-label="Normal Speed">1×</button>
      <button class="speed-btn" data-speed="4" aria-label="Fast Forward">4×</button>
    `;
    this.btnPause = this.el.querySelector('#btn-pause');
    this.btnSpeeds = Array.from(this.el.querySelectorAll('.speed-btn[data-speed]'));
  }

  _attachEvents() {
    this.el.addEventListener('click', e => {
      const btn = e.target.closest('.speed-btn');
      if (!btn) return;
      
      if (btn.id === 'btn-pause') {
        this.togglePause();
      } else {
        const s = parseFloat(btn.dataset.speed);
        this.setSpeed(s);
      }
    });

    this.eventBus.on('setup:complete', () => {
      this.setSpeed(1, true); // unpause and set speed to 1
    });

    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        this.togglePause();
      }
      if (e.key === '+' || e.key === '=') this.increaseSpeed();
      if (e.key === '-') this.decreaseSpeed();
    });
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.btnPause.classList.add('active');
      this.btnSpeeds.forEach(b => b.classList.remove('active'));
      this.updateState(0);
    } else {
      this.btnPause.classList.remove('active');
      this.setSpeed(this.speeds[this.currentIdx], false);
    }
  }

  setSpeed(speed, unpause = true) {
    if (unpause && this.isPaused) {
      this.isPaused = false;
      this.btnPause.classList.remove('active');
    }
    
    const idx = this.speeds.indexOf(speed);
    if (idx !== -1) this.currentIdx = idx;

    this.btnSpeeds.forEach(b => {
      if (parseFloat(b.dataset.speed) === speed) b.classList.add('active');
      else b.classList.remove('active');
    });

    this.updateState(speed);
  }

  increaseSpeed() {
    if (this.isPaused) this.togglePause();
    if (this.currentIdx < this.speeds.length - 1) {
      this.setSpeed(this.speeds[this.currentIdx + 1]);
    }
  }

  decreaseSpeed() {
    if (this.isPaused) this.togglePause();
    if (this.currentIdx > 0) {
      this.setSpeed(this.speeds[this.currentIdx - 1]);
    }
  }

  updateState(speed) {
    if (this.gameState) {
      this.gameState.simSpeed = speed;
      // Depending on SimEngine implementation, it might listen to an event or read state directly.
      this.eventBus.emit('ui:speed_changed', speed);
    }
  }
}
