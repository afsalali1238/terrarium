export class InterventionBar {
  constructor(el, eventBus, gameState) {
    this.el = el;
    this.eventBus = eventBus;
    this.gameState = gameState;
    
    // Cooldown state
    this.cooldowns = {
      meteor: 0,
      drought: 0,
      bless: 0
    };
    
    // Aim mode state
    this.aimMode = null;

    this._build();
    this._attachEvents();
    
    // Update every tick for cooldowns
    this.eventBus.on('sim:tick', (state) => this.onTick(state));
  }

  _build() {
    this.el.innerHTML = `
      <style>
        #ibar-inner {
          display: flex;
          gap: 16px;
          justify-content: center;
          align-items: center;
          padding: 12px;
          background: rgba(8,8,24,0.85);
          border-top: 1px solid #1e1e3a;
          border-radius: 8px 8px 0 0;
          pointer-events: auto;
        }
        .ibar-btn {
          background: #0f0f1e;
          border: 1px solid #1e1e3a;
          color: #e0e0f0;
          font-family: 'Inter', sans-serif;
          padding: 8px 16px;
          cursor: pointer;
          border-radius: 4px;
          text-align: center;
          min-width: 140px;
          transition: border-color 200ms, background 200ms;
          position: relative;
        }
        .ibar-btn:hover:not(:disabled) { 
          border-color: #4aff9a; 
          background: rgba(74,255,154,0.08); 
        }
        .ibar-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .ibar-btn.active {
          border-color: #ffb84a;
          background: rgba(255,184,74,0.1);
        }
        .ibar-title {
          font-weight: 500;
          font-size: 13px;
          display: block;
          margin-bottom: 4px;
        }
        .ibar-sub {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: #7070a0;
          display: block;
        }
        /* Aiming cursor overlay */
        #aim-overlay {
          display: none;
          position: fixed;
          inset: 0;
          cursor: crosshair;
          z-index: 1000;
        }
      </style>
      <div id="ibar-inner">
        <button class="ibar-btn" data-action="meteor" id="btn-meteor">
          <span class="ibar-title">☄️ METEOR</span>
          <span class="ibar-sub">Send fire</span>
        </button>
        <button class="ibar-btn" data-action="drought" id="btn-drought">
          <span class="ibar-title">🌵 DROUGHT</span>
          <span class="ibar-sub">Dry the rain</span>
        </button>
        <button class="ibar-btn" data-action="bless" id="btn-bless">
          <span class="ibar-title">✨ BLESS HARVEST</span>
          <span class="ibar-sub">Feed them well</span>
        </button>
      </div>
      <div id="aim-overlay"></div>
    `;
    
    // We update the intervention-bar positioning directly if needed, or assume index.html sets it.
    // The prompt says fixed bottom center.
    this.el.style.position = 'fixed';
    this.el.style.bottom = '0';
    this.el.style.left = '50%';
    this.el.style.transform = 'translateX(-50%)';
    this.el.style.top = 'auto';
    this.el.style.right = 'auto';

    this.btnMeteor = this.el.querySelector('#btn-meteor');
    this.btnDrought = this.el.querySelector('#btn-drought');
    this.btnBless = this.el.querySelector('#btn-bless');
    this.aimOverlay = this.el.querySelector('#aim-overlay');
  }

  _attachEvents() {
    this.el.addEventListener('click', e => {
      const btn = e.target.closest('.ibar-btn');
      if (!btn || btn.disabled) return;
      const action = btn.dataset.action;
      this.handleActionClick(action);
    });

    this.aimOverlay.addEventListener('click', e => {
      if (this.aimMode === 'meteor') {
        let wx = e.clientX;
        let wy = e.clientY;
        if (window.screenToWorld) {
          const worldPoint = window.screenToWorld(e.clientX, e.clientY);
          wx = worldPoint.x;
          wy = worldPoint.y;
        }

        const currentTick = this.gameState?.planet?.tick || 0;
        // Resolve nearest settlement before emitting so Ticker can name it
        let nearestName = null;
        const settlements = this.gameState?.planet?.settlements;
        if (settlements?.length) {
          let minDist = Infinity;
          for (const s of settlements) {
            const d = Math.sqrt((s.x - wx) ** 2 + (s.y - wy) ** 2);
            if (d < minDist) { minDist = d; nearestName = s.name; }
          }
        }
        this.eventBus.emit('intervention:meteor', {
          tick: currentTick,
          x: wx,
          y: wy,
          nearestSettlement: nearestName
        });

        this.cooldowns.meteor = 30; // 30 ticks
        this.logIntervention('meteor', wx, wy);
        this.cancelAim();
      }
    });

    // Cancel aim on ESC
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.aimMode) {
        this.cancelAim();
      }
    });
  }

  handleActionClick(action) {
    if (this.cooldowns[action] > 0) return;

    if (action === 'meteor') {
      this.aimMode = 'meteor';
      this.aimOverlay.style.display = 'block';
      this.btnMeteor.classList.add('active');
    } else if (action === 'drought') {
      const t = this.gameState?.planet?.tick || 0;
      this.eventBus.emit('intervention:drought', { tick: t });
      this.cooldowns.drought = 20;
      this.logIntervention('drought');
    } else if (action === 'bless') {
      const t = this.gameState?.planet?.tick || 0;
      this.eventBus.emit('intervention:bless', { tick: t });
      this.cooldowns.bless = 25;
      this.logIntervention('bless');
    }
  }

  cancelAim() {
    this.aimMode = null;
    this.aimOverlay.style.display = 'none';
    this.btnMeteor.classList.remove('active');
  }

  logIntervention(type, x, y) {
    if (!this.gameState?.interventionLog) return;
    // Find nearest settlement name for the log
    let nearestSettlement = null;
    const settlements = this.gameState.planet?.settlements;
    if (x != null && settlements?.length) {
      let minDist = Infinity;
      for (const s of settlements) {
        const d = Math.sqrt((s.x - x) ** 2 + (s.y - y) ** 2);
        if (d < minDist) { minDist = d; nearestSettlement = s.name; }
      }
    }
    this.gameState.interventionLog.push({
      type,
      tick: this.gameState.planet?.tick || 0,
      targetX: x ?? null,
      targetY: y ?? null,
      nearestSettlement
    });
  }

  onTick(state) {
    // Determine if disabled (no life yet)
    const pop = state?.planet?.population || 0;
    const isLifeSeeded = pop > 0 || (state.tick > 10);

    // Update cooldowns
    for (const key in this.cooldowns) {
      if (this.cooldowns[key] > 0) {
        this.cooldowns[key]--;
      }
    }

    this.updateButtonState(this.btnMeteor, 'meteor', 'Send fire', isLifeSeeded);
    this.updateButtonState(this.btnDrought, 'drought', 'Dry the rain', isLifeSeeded);
    this.updateButtonState(this.btnBless, 'bless', 'Feed them well', isLifeSeeded);
  }

  updateButtonState(btn, key, defaultSub, isLifeSeeded) {
    const sub = btn.querySelector('.ibar-sub');
    if (!isLifeSeeded) {
      btn.disabled = true;
      sub.innerText = "Seed life first";
      return;
    }

    if (this.cooldowns[key] > 0) {
      btn.disabled = true;
      sub.innerText = `Ready in: ${this.cooldowns[key]}`;
    } else {
      btn.disabled = false;
      sub.innerText = defaultSub;
    }
  }
}
