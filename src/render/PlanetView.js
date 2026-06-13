import * as PIXI from 'pixi.js'
import { createNoise2D } from 'simplex-noise'
import { lerp } from '../utils/MathUtils.js'

const PLANET_COLORS = {
  healthy:   { base: [0x1a, 0x6b, 0x3a], water: [0x1a, 0x4a, 0x8a], atmo: [0x44, 0x88, 0xff] },
  stressed:  { base: [0x8b, 0x5e, 0x1a], water: [0x5a, 0x3a, 0x1a], atmo: [0xff, 0x88, 0x33] },
  dying:     { base: [0x3a, 0x3a, 0x3a], water: [0x1a, 0x1a, 0x2e], atmo: [0x88, 0x33, 0x33] },
  dead:      { base: [0x11, 0x11, 0x11], water: [0x08, 0x08, 0x08], atmo: [0x22, 0x00, 0x00] }
}

function rgbToHex(r, g, b) {
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
}

function lerpColor(c1, c2, t) {
  return [
    lerp(c1[0], c2[0], t),
    lerp(c1[1], c2[1], t),
    lerp(c1[2], c2[2], t)
  ];
}

export class PlanetView {
  constructor(app, eventBus) {
    this.app = app;
    this.eventBus = eventBus;
    this.container = new PIXI.Container();
    
    // Layers
    this.landSprite = new PIXI.Sprite();
    this.waterSprite = new PIXI.Sprite();
    this.glowGraphics = new PIXI.Graphics();
    this.atmoGraphics = new PIXI.Graphics();
    this.scarGraphics = new PIXI.Graphics();
    this.blackOverlay = new PIXI.Graphics(); // For death sequence

    // Add in correct order
    this.container.addChild(this.waterSprite);
    this.container.addChild(this.landSprite);
    this.container.addChild(this.scarGraphics);
    this.container.addChild(this.glowGraphics);
    this.container.addChild(this.atmoGraphics);
    this.container.addChild(this.blackOverlay);

    this.radius = 0;
    this.scars = []; 
    this.deathProgress = 0;
    this.isDead = false;
    
    this.currentColor = PLANET_COLORS.healthy;

    if (this.eventBus) {
      this.eventBus.on('planet:death', () => {
        this.isDead = true;
      });
    }
  }

  init(waterLevel = 0.4) {
    this.updateSize();
    this.generateTerrain(waterLevel);
    window.addEventListener('resize', () => this.updateSize());
  }

  updateSize() {
    this.radius = 1000;

    this.waterSprite.width = 2000;
    this.waterSprite.height = 2000;
    this.waterSprite.anchor.set(0.5);
    
    this.landSprite.width = this.radius * 2;
    this.landSprite.height = this.radius * 2;
    this.landSprite.anchor.set(0.5);

    // Planet Mask
    if (!this.mask) {
      this.mask = new PIXI.Graphics();
      this.container.addChild(this.mask);
      this.container.mask = this.mask;
    }
    this.mask.clear();
    this.mask.beginFill(0xffffff);
    this.mask.drawCircle(0, 0, this.radius);
    this.mask.endFill();
  }

  generateTerrain(waterLevel) {
    // Generate two textures: one for water, one for land.
    // We use a reasonably sized canvas so it's not too slow but looks okay
    const res = 512;
    const waterCanvas = document.createElement('canvas');
    const landCanvas = document.createElement('canvas');
    waterCanvas.width = waterCanvas.height = res;
    landCanvas.width = landCanvas.height = res;
    
    const wCtx = waterCanvas.getContext('2d');
    const lCtx = landCanvas.getContext('2d');
    const wImg = wCtx.createImageData(res, res);
    const lImg = lCtx.createImageData(res, res);

    const noise2D = createNoise2D();
    const scale = 0.02;

    for (let x = 0; x < res; x++) {
      for (let y = 0; y < res; y++) {
        const nx = x * scale;
        const ny = y * scale;
        // Map noise (-1 to 1) to 0 to 1
        let val = (noise2D(nx, ny) + 1) / 2;
        
        // Add some fractal detail
        val += (noise2D(nx * 2, ny * 2) * 0.25);
        val = Math.max(0, Math.min(1, val));

        const idx = (y * res + x) * 4;
        
        // White for masks, tint will color them
        if (val < waterLevel) {
          // Water
          wImg.data[idx] = 255; wImg.data[idx+1] = 255; wImg.data[idx+2] = 255; wImg.data[idx+3] = 255;
          lImg.data[idx+3] = 0;
        } else if (val < waterLevel + 0.1) {
          // Coast (blend)
          wImg.data[idx] = 255; wImg.data[idx+1] = 255; wImg.data[idx+2] = 255; wImg.data[idx+3] = 255;
          lImg.data[idx] = 255; lImg.data[idx+1] = 255; lImg.data[idx+2] = 255; lImg.data[idx+3] = 128; // semi transparent
        } else {
          // Land
          wImg.data[idx+3] = 0;
          lImg.data[idx] = 255; lImg.data[idx+1] = 255; lImg.data[idx+2] = 255; lImg.data[idx+3] = 255;
        }
      }
    }
    
    wCtx.putImageData(wImg, 0, 0);
    lCtx.putImageData(lImg, 0, 0);

    const waterTex = PIXI.Texture.from(waterCanvas);
    const landTex = PIXI.Texture.from(landCanvas);
    
    this.waterSprite.texture = waterTex;
    this.landSprite.texture = landTex;
    
    this.waterSprite.tint = rgbToHex(...PLANET_COLORS.healthy.water);
    this.landSprite.tint = rgbToHex(...PLANET_COLORS.healthy.base);
  }

  update(state) {
    if (!state.planet) return;

    // Determine target color based on healthScore
    let targetState = PLANET_COLORS.healthy;
    let t = 0; // lerp factor within band
    
    const h = state.planet.healthScore !== undefined ? state.planet.healthScore : 1.0;
    
    if (h < 0.2) {
      targetState = PLANET_COLORS.dead;
      t = h / 0.2; // 0 to 1 between dead and dying
      this.currentColor = {
        base: lerpColor(PLANET_COLORS.dead.base, PLANET_COLORS.dying.base, t),
        water: lerpColor(PLANET_COLORS.dead.water, PLANET_COLORS.dying.water, t),
        atmo: lerpColor(PLANET_COLORS.dead.atmo, PLANET_COLORS.dying.atmo, t)
      };
    } else if (h < 0.5) {
      t = (h - 0.2) / 0.3;
      this.currentColor = {
        base: lerpColor(PLANET_COLORS.dying.base, PLANET_COLORS.stressed.base, t),
        water: lerpColor(PLANET_COLORS.dying.water, PLANET_COLORS.stressed.water, t),
        atmo: lerpColor(PLANET_COLORS.dying.atmo, PLANET_COLORS.stressed.atmo, t)
      };
    } else if (h < 0.8) {
      t = (h - 0.5) / 0.3;
      this.currentColor = {
        base: lerpColor(PLANET_COLORS.stressed.base, PLANET_COLORS.healthy.base, t),
        water: lerpColor(PLANET_COLORS.stressed.water, PLANET_COLORS.healthy.water, t),
        atmo: lerpColor(PLANET_COLORS.stressed.atmo, PLANET_COLORS.healthy.atmo, t)
      };
    } else {
      this.currentColor = PLANET_COLORS.healthy;
    }

    this.landSprite.tint = rgbToHex(...this.currentColor.base);
    this.waterSprite.tint = rgbToHex(...this.currentColor.water);

    // Atmosphere
    this.atmoGraphics.clear();
    this.atmoGraphics.lineStyle(6, rgbToHex(...this.currentColor.atmo), 0.4);
    this.atmoGraphics.drawCircle(0, 0, this.radius);

    // Glows colored by myth
    this.glowGraphics.clear();
    if (state.planet.settlements) {
      state.planet.settlements.forEach(s => {
        let glowColor = 0xffffff;
        if (s.dominantMythType === 'fire') glowColor = 0xff4400;
        else if (s.dominantMythType === 'water') glowColor = 0x4488ff;
        else if (s.dominantMythType === 'abundance') glowColor = 0x44ff88;
        else if (s.dominantMythType === 'absence') glowColor = 0x888888;

        this.glowGraphics.beginFill(glowColor, 0.4);
        this.glowGraphics.drawCircle(s.x, s.y, 60); // 60 units in world space
        this.glowGraphics.endFill();
      });
    }

    // Scars (meteor impacts)
    this.scarGraphics.clear();
    for (let i = this.scars.length - 1; i >= 0; i--) {
      const scar = this.scars[i];
      const age = state.tick - scar.tick;
      if (age > 50) {
        this.scars.splice(i, 1);
        continue;
      }
      
      // Flash -> dark mark -> fade
      if (age < 2) {
        this.scarGraphics.beginFill(0xffffff, 1.0);
      } else if (age < 5) {
        this.scarGraphics.beginFill(0xff8833, 0.8);
      } else {
        const fade = 1 - (age / 50);
        this.scarGraphics.beginFill(0x111111, fade * 0.9);
      }
      this.scarGraphics.drawCircle(scar.x, scar.y, 45);
      this.scarGraphics.endFill();
    }

    // Death sequence
    if (this.isDead && this.deathProgress < 1.0) {
      // Drains to black over ~2 seconds (assuming 60fps -> 120 frames)
      // Since update is driven by sim:tick which is 20fps, 2 secs = 40 ticks
      this.deathProgress += 1/40;
      if (this.deathProgress > 1.0) this.deathProgress = 1.0;
    }

    this.blackOverlay.clear();
    if (this.deathProgress > 0) {
      this.blackOverlay.beginFill(0x000000, this.deathProgress);
      this.blackOverlay.drawCircle(0, 0, this.radius);
      this.blackOverlay.endFill();
    }
  }

  addScar(x, y, tick) {
    this.scars.push({x, y, tick});
  }
}
