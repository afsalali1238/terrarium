import { GameState } from './state/GameState.js';
import { EventBus } from './state/EventBus.js';
import { Renderer } from './render/Renderer.js';
import { InterventionBar } from './ui/InterventionBar.js';
import { Ticker } from './ui/Ticker.js';
import { SpeedControl } from './ui/SpeedControl.js';
import { PostMortem } from './ui/PostMortem.js';
import { SetupScreen } from './ui/SetupScreen.js';
import { FinetuningScreen } from './ui/FinetuningScreen.js';
import { SimEngine } from './simulation/SimEngine.js';
import { MythEngine } from './myth/MythEngine.js';
import Planet from './simulation/Planet.js';

window.showScreen = function(to) {
  const current = document.querySelector('.screen.active');
  const next = document.getElementById('screen-' + to);
  if (!next) return;
  if (current) {
    current.classList.add('screen-fade-out');
    setTimeout(() => {
      current.classList.remove('active', 'screen-fade-out');
      next.classList.add('active', 'screen-fade-in');
      setTimeout(() => next.classList.remove('screen-fade-in'), 300);
    }, 300);
  } else {
    next.classList.add('active');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('planet-canvas');
  const renderer = new Renderer(canvas, EventBus, GameState);
  renderer.init();

  window.screenToWorld = (x, y) => {
    if (renderer.zoomController && renderer.zoomController.screenToWorld) {
      return renderer.zoomController.screenToWorld(x, y);
    }
    return { x, y };
  };

  const statsEl = document.getElementById('planet-stats');
  new Ticker(document.getElementById('ticker-overlay'), EventBus);
  new InterventionBar(document.getElementById('intervention-bar'), EventBus, GameState);
  new SpeedControl(document.getElementById('speed-control'), EventBus, GameState);
  new PostMortem(document.getElementById('postmortem-overlay'), EventBus);
  const setupScreen = new SetupScreen(document.getElementById('screen-setup'), EventBus);
  const finetuningScreen = new FinetuningScreen(document.getElementById('screen-finetuning'), EventBus);

  function updateStats(state) {
    const planet = GameState.planet;
    if (!planet || !statsEl) return;
    const h = planet.getHealthScore ? planet.getHealthScore() : 1.0;
    const bars = Math.round(h * 8);
    const empty = 8 - bars;
    const bar = '[' + '='.repeat(bars) + '-'.repeat(empty) + ']';
    let color = 'var(--accent-green)';
    if (h < 0.2) color = 'var(--text-dim)';
    else if (h < 0.5) color = 'var(--accent-red)';
    else if (h < 0.8) color = 'var(--accent-orange)';
    statsEl.innerHTML =
      '<span>Year: <span class="stat-val">' + state.tick + '</span></span> ' +
      '<span>Pop: <span class="stat-val">' + (planet.population || 0).toLocaleString() + '</span></span> ' +
      '<span style="color:' + color + ';font-weight:bold;font-family:var(--font-mono);font-size:12px">&nbsp;' + bar + '</span>';
  }

  EventBus.on('sim:tick', updateStats);

  let currentSimEngine = null;
  let currentMythEngine = null;

  EventBus.on('ui:nav_setup', (data) => {
    if (currentSimEngine) { currentSimEngine.stop(); currentSimEngine = null; }
    
    if (data && data.skipFinetuning) {
      window.showScreen('setup');
      if (data.lastSliders) {
        setupScreen.prefillSliders(data.lastSliders);
      }
    } else {
      window.showScreen('finetuning');
      finetuningScreen.show();
    }
  });

  EventBus.on('setup:complete', (config) => {
    if (currentSimEngine) currentSimEngine.stop();

    const planet = new Planet(config);
    GameState.planet = planet;
    GameState.tick = 0;
    GameState.simSpeed = 1;
    GameState.interventionLog = [];
    GameState.myths = [];

    currentSimEngine = new SimEngine(planet, EventBus);
    currentMythEngine = new MythEngine(planet, EventBus);

    if (renderer.planetView && renderer.planetView.generateTerrain) {
      const waterLvl = config.water !== undefined ? config.water : 40;
      renderer.planetView.generateTerrain((waterLvl / 100) * 0.8);
    }

    if (renderer.zoomController && renderer.zoomController.zoomTo) {
      renderer.zoomController.zoomTo(0, 0, 0);
    }

    currentSimEngine.start();
    window.showScreen('game');
  });

  window.showScreen('finetuning');
  finetuningScreen.show();
  EventBus.on('finetuning:complete', () => window.showScreen('setup'));
});
