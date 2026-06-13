import * as PIXI from 'pixi.js'
import { PlanetView } from './PlanetView.js'
import { AgentSprites } from './AgentSprites.js'
import { ZoomController } from './ZoomController.js'
import { TerrariumView } from './TerrariumView.js'

export class Renderer {
  constructor(canvasEl, eventBus, gameState) {
    this.app = new PIXI.Application({
      view: canvasEl,
      backgroundColor: 0x080818,
      resizeTo: window,
      antialias: true
    })

    this.eventBus = eventBus;
    this.gameState = gameState;

    // 'terrarium' = the up-close glass tank (default); 'planet' = whole globe.
    this.viewMode = 'terrarium';

    this.planetView = new PlanetView(this.app);
    this.agentSprites = new AgentSprites(this.app);
    this.zoomController = new ZoomController(this, gameState, eventBus);
    this.terrarium = new TerrariumView(this.app, eventBus, gameState);

    this.zoomLevel = 0;

    // The globe + agents live in a zoom-transformed scene.
    this.scene = new PIXI.Container();
    this.app.stage.addChild(this.scene);
    this.scene.addChild(this.planetView.container);
    this.scene.addChild(this.agentSprites.container);

    // The terrarium is screen-space, drawn on top of (and hiding) the globe.
    this.app.stage.addChild(this.terrarium.root);
  }

  init() {
    this.planetView.init();
    this.agentSprites.init();
    this.terrarium.init();

    // Start in terrarium view.
    this.scene.visible = false;
    this.terrarium.setVisible(true);
    this._buildToggle();

    this.eventBus.on('sim:tick', (state) => this.onSimTick(state));
    this.eventBus.on('zoom:changed', (data) => { this.zoomLevel = data.level; });

    this.eventBus.on('intervention:meteor', (data) => {
      this.planetView.addScar(data.x, data.y, data.tick);
    });

    // A fresh run always returns to the terrarium; the toggle is in-game only.
    this.eventBus.on('setup:complete', () => {
      this.showTerrarium();
      if (this._toggleBtn) this._toggleBtn.style.display = '';
    });
    this.eventBus.on('planet:death', () => {
      if (this._toggleBtn) this._toggleBtn.style.display = 'none';
    });
  }

  onSimTick(state) {
    // PlanetView/AgentSprites only matter when the globe is shown.
    if (this.viewMode === 'planet') {
      this.planetView.update(state);
      this.agentSprites.update(state, this.zoomLevel, this.zoomController.targetAgent);
    }
    // TerrariumView subscribes to sim:tick itself.
  }

  showPlanet() {
    this.viewMode = 'planet';
    this.scene.visible = true;
    this.terrarium.setVisible(false);
    if (this.zoomController.zoomTo) this.zoomController.zoomTo(0, 0, 0, true);
    if (this._toggleBtn) this._toggleBtn.innerHTML = '🔬 Terrarium';
  }

  showTerrarium() {
    this.viewMode = 'terrarium';
    this.scene.visible = false;
    this.terrarium.setVisible(true);
    const pc = document.getElementById('person-card');
    if (pc) pc.classList.add('hidden');
    const zb = document.getElementById('zoom-back');
    if (zb) zb.classList.add('hidden');
    if (this._toggleBtn) this._toggleBtn.innerHTML = '🌍 Whole Planet';
  }

  _buildToggle() {
    let btn = document.getElementById('view-toggle');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'view-toggle';
      btn.style.cssText = [
        'position:fixed', 'top:16px', 'right:16px', 'z-index:50',
        'background:rgba(8,8,24,0.85)', 'color:#e0e0f0', 'border:1px solid #2a2a4a',
        'border-radius:6px', 'padding:8px 12px', 'cursor:pointer',
        "font-family:'Inter',sans-serif", 'font-size:13px', 'display:none'
      ].join(';');
      document.body.appendChild(btn);
    }
    btn.innerHTML = '🌍 Whole Planet';
    btn.onclick = () => { this.viewMode === 'terrarium' ? this.showPlanet() : this.showTerrarium(); };
    this._toggleBtn = btn;
  }
}
