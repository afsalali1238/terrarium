import * as PIXI from 'pixi.js'

const ROLE_COLORS = {
  settler:  0xaaaaaa,   // grey
  builder:  0x8888ff,   // blue
  priest:   0xffaa00,   // gold
  wanderer: 0xff88aa,   // pink
}

export class AgentSprites {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();
    
    // We use ParticleContainer for performance with thousands of agents
    // We allow setting tint and position
    this.particleContainer = new PIXI.ParticleContainer(10000, {
      scale: true,
      position: true,
      rotation: false,
      uvs: false,
      alpha: true,
      tint: true
    });
    this.container.addChild(this.particleContainer);

    this.targetHighlight = new PIXI.Graphics();
    this.container.addChild(this.targetHighlight);

    this.textures = {};
    this.agentSprites = [];
  }

  init() {
    this.generateTextures();
    this.updateSize();
    window.addEventListener('resize', () => this.updateSize());
  }

  generateTextures() {
    const gfx = new PIXI.Graphics();
    
    // 2px dot
    gfx.beginFill(0xffffff);
    gfx.drawCircle(2, 2, 1);
    gfx.endFill();
    this.textures.small = this.app.renderer.generateTexture(gfx);

    // 4px dot
    gfx.clear();
    gfx.beginFill(0xffffff);
    gfx.drawCircle(4, 4, 2);
    gfx.endFill();
    this.textures.large = this.app.renderer.generateTexture(gfx);
  }

  updateSize() {
    this.container.x = window.innerWidth / 2;
    this.container.y = window.innerHeight / 2;
  }

  update(state, zoomLevel, targetAgent) {
    this.targetHighlight.clear();
    
    if (!state.planet || !state.planet.agents) {
      this.particleContainer.removeChildren();
      return;
    }

    if (zoomLevel === 0) {
      // Zoom 0: No individual agents. 
      this.particleContainer.visible = false;
      return;
    } else {
      this.particleContainer.visible = true;
    }

    const agents = state.planet.agents;
    const isLarge = zoomLevel >= 2;
    const tex = isLarge ? this.textures.large : this.textures.small;

    // Adjust sprites pool size
    while (this.agentSprites.length < agents.length) {
      const sprite = new PIXI.Sprite(tex);
      sprite.anchor.set(0.5);
      this.agentSprites.push(sprite);
      this.particleContainer.addChild(sprite);
    }
    while (this.agentSprites.length > agents.length) {
      const sprite = this.agentSprites.pop();
      this.particleContainer.removeChild(sprite);
      sprite.destroy();
    }

    // Update sprites
    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];
      const sprite = this.agentSprites[i];
      sprite.texture = tex;
      sprite.x = agent.x;
      sprite.y = agent.y;
      sprite.tint = ROLE_COLORS[agent.role] || ROLE_COLORS.settler;
    }

    // Zoom 3: Highlight target agent
    if (zoomLevel === 3 && targetAgent) {
      this.targetHighlight.lineStyle(2, 0xffffff, 0.8);
      this.targetHighlight.drawCircle(targetAgent.x, targetAgent.y, 8);
      
      // Animated ring
      const pulseScale = 1 + (Math.sin(performance.now() / 200) * 0.2);
      this.targetHighlight.lineStyle(1, 0xffffff, 0.4);
      this.targetHighlight.drawCircle(targetAgent.x, targetAgent.y, 8 * pulseScale);
    }
  }
}
