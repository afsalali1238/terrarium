import * as PIXI from 'pixi.js'
import { PlanetView } from './PlanetView.js'
import { AgentSprites } from './AgentSprites.js'
import { ZoomController } from './ZoomController.js'

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
    
    this.planetView = new PlanetView(this.app);
    this.agentSprites = new AgentSprites(this.app);
    this.zoomController = new ZoomController(this, gameState, eventBus);
    
    this.zoomLevel = 0;

    // Stage hierarchy
    // We need everything attached to a main scene container to scale it together
    this.scene = new PIXI.Container();
    this.app.stage.addChild(this.scene);
    
    this.scene.addChild(this.planetView.container);
    this.scene.addChild(this.agentSprites.container);
  }

  init() {
    this.planetView.init();
    this.agentSprites.init();

    // Listen to events
    this.eventBus.on('sim:tick', (state) => this.onSimTick(state));
    this.eventBus.on('zoom:changed', (data) => {
      this.zoomLevel = data.level;
    });

    this.eventBus.on('intervention:meteor', (data) => {
      this.planetView.addScar(data.x, data.y, data.tick);
      // shake camera effect could go here
    });
  }

  onSimTick(state) {
    // We update the view state based on the current GameState
    this.planetView.update(state);
    this.agentSprites.update(state, this.zoomLevel, this.zoomController.targetAgent);
  }
}
