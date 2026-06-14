import { GameState } from './state/GameState.js';
import { EventBus } from './state/EventBus.js';
import { Renderer } from './render/Renderer.js';
import { InterventionBar } from './ui/InterventionBar.js';
import { Ticker } from './ui/Ticker.js';
import { SpeedControl } from './ui/SpeedControl.js';
import { PostMortem } from './ui/PostMortem.js';
import { SetupScreen } from './ui/SetupScreen.js';
import { FinetuningScreen } from './ui/FinetuningScreen.js';
import { ClimatePanel } from './ui/ClimatePanel.js';
import { ChoiceModal } from './ui/ChoiceModal.js';
import { DevotionMeter } from './ui/DevotionMeter.js';
import { IdentityHUD } from './ui/IdentityHUD.js';
import { FloatingText } from './ui/FloatingText.js';
import { SimEngine } from './simulation/SimEngine.js';
import { MythEngine } from './myth/MythEngine.js';
import Planet from './simulation/Planet.js';
import { Settlement } from './simulation/Settlement.js';
import { Agent } from './simulation/Agent.js';
import { reseedRng } from './utils/Random.js';
import { AudioEngine } from './audio/AudioEngine.js';
import { SaveManager } from './state/SaveManager.js';

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
  const audioEngine = new AudioEngine(EventBus);
  new ClimatePanel(EventBus, GameState);
  new ChoiceModal(EventBus, GameState);
  new DevotionMeter(EventBus, GameState);
  new IdentityHUD(document.getElementById('identity-hud'), EventBus);
  new FloatingText(document.getElementById('screen-game'), EventBus);

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
    const influence = Math.floor(GameState.influence || 0);
    statsEl.innerHTML =
      '<span>Year: <span class="stat-val">' + state.tick + '</span></span> ' +
      '<span>Pop: <span class="stat-val">' + (planet.population || 0).toLocaleString() + '</span></span> ' +
      '<span>Influence: <span class="stat-val">' + influence + '</span></span> ' +
      '<span style="color:' + color + ';font-weight:bold;font-family:var(--font-mono);font-size:12px">&nbsp;' + bar + '</span>';
  }

  EventBus.on('sim:tick', updateStats);
  
  EventBus.on('sim:autosave', () => {
    SaveManager.save(GameState);
  });

  let currentSimEngine = null;
  let currentMythEngine = null;

  EventBus.on('ui:nav_setup', (data) => {
    if (currentSimEngine) { currentSimEngine.destroy(); currentSimEngine = null; }
    if (currentMythEngine) { currentMythEngine.destroy(); currentMythEngine = null; }
    
    if (data && data.seed !== undefined) {
      GameState.nextSeed = data.seed;
    }

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
    if (currentSimEngine) currentSimEngine.destroy();
    if (currentMythEngine) currentMythEngine.destroy();

    let seed = GameState.nextSeed;
    if (seed === undefined) {
      seed = Math.floor(Math.random() * 999999);
    }
    GameState.nextSeed = undefined;
    reseedRng(seed);
    GameState.seed = seed;

    // G7: Apply random modifier if we have played before
    let runs = 0;
    try { runs = parseInt(localStorage.getItem('terrarium_planet_runs') || '0', 10); } catch(e){}
    let modifierText = '';
    if (runs > 0 && Math.random() < 0.4) {
      const modifiers = [
        { key: 'water', val: 10, text: 'CHALLENGE: The world began in a global drought.' },
        { key: 'soil', val: 95, text: 'BOON: The soil was unusually rich from the start.' },
        { key: 'heat', val: 20, text: 'CHALLENGE: A harsh ice age gripped the early world.' },
        { key: 'atmosphere', val: 35, text: 'CHALLENGE: The air was thin, making every breath a struggle.' }
      ];
      const mod = modifiers[Math.floor(Math.random() * modifiers.length)];
      config[mod.key] = mod.val;
      modifierText = mod.text;
    }

    const planet = new Planet(config);
    
    // G7: Load past gods into planet
    try {
      planet.pastGods = JSON.parse(localStorage.getItem('terrarium_past_gods') || '[]');
    } catch (e) {
      planet.pastGods = [];
    }

    if (config.resumeState) {
      Object.assign(planet, config.resumeState.planet);
      planet.settlements = planet.settlements.map(s => {
        const set = new Settlement(s.x, s.y, s.foundedTick);
        Object.assign(set, s);
        return set;
      });
      planet.agents = planet.agents.map(a => {
        const set = planet.settlements.find(s => s.name === a.settlement?.name);
        const agent = new Agent(a.x, a.y, set);
        Object.assign(agent, a);
        return agent;
      });
      GameState.influence = config.resumeState.influence ?? 100;
      GameState.devotion = config.resumeState.devotion ?? 0;
      GameState.interventionLog = config.resumeState.interventionLog ?? [];
      GameState.myths = config.resumeState.myths ?? [];
      GameState.tick = config.resumeState.tick ?? 0;
    } else {
      GameState.tick = 0;
      GameState.influence = 100;
      GameState.interventionLog = [];
      GameState.myths = [];
      GameState.devotion = 0;
    }

    GameState.planet = planet;
    GameState.simSpeed = 1;

    currentSimEngine = new SimEngine(planet, EventBus);
    currentMythEngine = new MythEngine(planet, EventBus);
    
    if (config.resumeState) {
      // Avoid spawning initial agents again since we loaded them
      currentSimEngine._spawnInitialAgents = () => {};
      // Sync names
      currentMythEngine.playerName = config.resumeState.planet.playerName || 'The Unnamed';
    }

    if (renderer.planetView && renderer.planetView.generateTerrain) {
      const waterLvl = config.water !== undefined ? config.water : 40;
      renderer.planetView.generateTerrain((waterLvl / 100) * 0.8);
    }

    if (renderer.zoomController && renderer.zoomController.zoomTo) {
      renderer.zoomController.zoomTo(0, 0, 0);
    }

    currentSimEngine.start();
    window.showScreen('game');
    const idHud = document.getElementById('identity-hud');
    if (idHud) idHud.classList.remove('hidden');

    if (modifierText) {
      setTimeout(() => {
        EventBus.emit('ticker:entry', { text: modifierText, style: 'notable', tick: 0 });
      }, 1000);
    }

    // T3: First-run intro
    if (!localStorage.getItem('terrarium_seen_intro')) {
      const introCard = document.getElementById('intro-card');
      if (introCard) {
        introCard.classList.remove('hidden');
        const lines = introCard.querySelectorAll('.intro-line');
        const btn = document.getElementById('btn-begin-watching');
        
        lines.forEach((line, i) => {
          setTimeout(() => line.classList.add('reveal'), i * 1500 + 500);
        });
        setTimeout(() => btn.classList.add('reveal'), lines.length * 1500 + 500);

        btn.onclick = () => {
          introCard.classList.add('screen-fade-out');
          setTimeout(() => {
            introCard.classList.add('hidden');
            introCard.classList.remove('screen-fade-out');
            localStorage.setItem('terrarium_seen_intro', 'true');
            
            // Pulse the intervention bar
            const ibarInner = document.getElementById('ibar-inner');
            if (ibarInner) {
              ibarInner.classList.add('hint-pulse');
              setTimeout(() => ibarInner.classList.remove('hint-pulse'), 2500);
            }
            
            // Coach Marks for first run
            setTimeout(() => {
              EventBus.emit('ui:floating_text', { 
                text: 'Tend the climate to spark life', 
                color: '#4aff9a', 
                x: window.innerWidth - 150, 
                y: 120 
              });
            }, 1500);
          }, 300);
        };
      }
    }
  });

  window.showScreen('finetuning');
  finetuningScreen.show();
  EventBus.on('finetuning:complete', () => window.showScreen('setup'));
});
