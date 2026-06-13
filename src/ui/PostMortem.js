import { GameState } from '../state/GameState.js';

export class PostMortem {
  constructor(el, eventBus) {
    this.el = el;
    this.eventBus = eventBus;
    
    // Track 5th-run logic
    this.runCount = parseInt(localStorage.getItem('terrarium_planet_runs') || '0', 10);
    
    this.eventBus.on('planet:death', (data) => this.show(data));
  }

  show({ cause, tick, finalPop, myths, sliders, playerName, lastMyth, avgRunLength = 0 }) {
    this.el.innerHTML = '';
    this.el.classList.remove('hidden');
    this.el.classList.add('active');
    
    this.lastSliders = sliders; // Save for retry

    // Create Card
    const card = document.createElement('div');
    card.className = 'pm-card';

    // Build the sections according to layout spec
    const { name, desc, hint } = this.getFailureModeCopy(cause, tick, avgRunLength);
    
    const mythCount = myths ? myths.length : 0;
    const beliefSnippet = myths && myths.length ? myths[0].legend : "We wondered if anyone was watching. Now we know.";
    const pName = playerName || "The Absent One";
    const lastMythStr = lastMyth ? lastMyth.legend : "Silence.";

    // Get color archetype for player name
    const colorClass = this.getPlayerNameColor(pName);

    card.innerHTML = `
      <div class="pm-section pm-header">CIVILIZATION ENDED<br>Year ${tick} · Final population: ${finalPop}</div>
      <div class="pm-divider"></div>
      
      <div class="pm-section">
        <div class="pm-header">CAUSE OF DEATH</div>
        <div class="pm-cause">${name}</div>
        <div class="pm-desc">${desc}</div>
      </div>

      <div class="pm-section">
        <div class="pm-header">WHAT THEY BELIEVED</div>
        <div class="pm-belief">"${beliefSnippet}"</div>
      </div>
      
      <div class="pm-divider"></div>
      
      <div class="pm-section">
        <div class="pm-player-label">YOUR NAME IN THEIR MYTHS</div>
        <div class="pm-player-name" style="color: var(--${colorClass})">"${pName}"</div>
        <div class="pm-player-stats">In ${mythCount} myths across their history, your presence was recorded.</div>
      </div>

      <div class="pm-section">
        <div class="pm-header">THEIR LAST MYTH</div>
        <div class="pm-last-myth">"${lastMythStr}"</div>
      </div>
      
      <div class="pm-divider"></div>

      <div class="pm-section">
        <div class="pm-header">FOR NEXT TIME</div>
        <div class="pm-desc">${hint}</div>
      </div>
      
      <div class="pm-section pm-buttons">
        <button class="pm-btn" id="btn-copy">COPY MY LEGEND</button>
        <button class="pm-btn" id="btn-replay">REPLAY THIS SEED</button>
        <button class="pm-btn" id="btn-retry">BUILD AGAIN →</button>
      </div>
    `;

    this.el.appendChild(card);

    // Staggered animation logic
    const sections = Array.from(card.querySelectorAll('.pm-section'));
    const delays = [0, 200, 400, 700, 900, 1100, 1300];
    
    sections.forEach((sec, idx) => {
      const delay = delays[Math.min(idx, delays.length - 1)];
      setTimeout(() => {
        sec.classList.add('pm-reveal');
      }, delay);
    });

    // Handle 5th-run message
    if (this.runCount >= 4) { // Next run will be 5th or more, runCount is 0-indexed before ++
      setTimeout(() => {
        const msg = document.createElement('div');
        msg.className = 'pm-meta-msg pm-reveal';
        msg.innerHTML = `
          You have run ${this.runCount + 1} civilizations.<br>
          Each one wondered about its creator.<br><br>
          You have never wondered about yours.<br><br>
          <em>Why not?</em>
        `;
        card.appendChild(msg);
      }, 4300); // 3 seconds after buttons appear
      
      // Disable retry button during the dramatic pause
      const retryBtn = card.querySelector('#btn-retry');
      retryBtn.disabled = true;
      setTimeout(() => retryBtn.disabled = false, 5000);
    }

    // Bind buttons
    card.querySelector('#btn-copy').addEventListener('click', (e) => {
      const seed = GameState.seed || '?';
      const text = `🌍 Terrarium Planet\nThey called me "${pName}".\n${finalPop > 0 ? `Final population: ${finalPop}` : 'Everyone died'} — Year ${tick}, ${name}.\nTheir last myth: "${lastMythStr}"\nSeed: ${seed} · play: https://terrarium-swart.vercel.app`;
      navigator.clipboard.writeText(text).then(() => {
        e.target.textContent = "COPIED!";
        setTimeout(() => e.target.textContent = "COPY MY LEGEND", 2000);
      });
    });
    card.querySelector('#btn-replay').addEventListener('click', () => this.handleAction('replay'));
    card.querySelector('#btn-retry').addEventListener('click', () => this.handleAction('retry'));
  }

  handleAction(action) {
    this.runCount++;
    localStorage.setItem('terrarium_planet_runs', this.runCount.toString());
    
    let nextSeed = undefined;
    if (action === 'replay') {
      nextSeed = GameState.seed;
    }

    this.eventBus.emit('ui:nav_setup', { 
      autoFillHint: action === 'retry' || action === 'replay',
      skipFinetuning: action === 'retry' || action === 'replay',
      lastSliders: this.lastSliders,
      seed: nextSeed
    });
    this.el.classList.remove('active');
    this.el.classList.add('hidden');
  }

  getPlayerNameColor(name) {
    if (name.includes('Sky Breaker')) return 'accent-orange';
    if (name.includes('Generous')) return 'accent-green';
    if (name.includes('Absent') || name.includes('Silent')) return 'text-dim';
    if (name.includes('Capricious')) return 'accent-gold';
    if (name.includes('Redeemer')) return 'accent-magenta';
    return 'text-bright';
  }

  getFailureModeCopy(cause, tick, avgRunLength) {
    const defaultMode = {
      name: "Unknown Failure",
      desc: "The simulation terminated unexpectedly.",
      hint: "Try again."
    };

    const modes = {
      'atmosphere_low': {
        name: "Atmosphere Collapse",
        desc: "Your atmosphere was too thin. Oxygen partial pressure never reached survivable levels across the planet's surface. Settlements formed, and your civilization began — but every generation was slower, shorter-lived, and less capable than the last.",
        hint: "Raise Air Mix above 35."
      },
      'atmosphere_high': {
        name: "Atmospheric Pressure Crush",
        desc: "Dense atmospheric pressure prevented complex biology from stabilizing. Organisms evolved but could not achieve the structural complexity needed for civilization. They were pressed into simplicity before they could begin.",
        hint: "Lower Air Mix below 65."
      },
      'water_low': {
        name: "Moisture Cycle Failure",
        desc: "Without sufficient water coverage, the soil nutrient cycle collapsed within 40 generations. Settlements expanded until they hit the limits of dry land, then turned on each other over the final springs.",
        hint: "Increase Water Coverage above 20."
      },
      'water_high': {
        name: "No Buildable Surface",
        desc: "Water coverage was so high that no stable landmass could support permanent settlement. Life flourished in the shallows but never reached the complexity that land demands. They had nowhere to build.",
        hint: "Lower Water Coverage below 80."
      },
      'heat_low': {
        name: "Thermal Stasis",
        desc: "Surface temperatures never sustained liquid water at scale. Life began in hydrothermal vents and warm shallow pockets, but could not colonize the surface. The cold held everything still.",
        hint: "Raise Surface Temperature above 30."
      },
      'heat_high': {
        name: "Runaway Greenhouse Effect",
        desc: "A feedback loop between surface temperature and atmospheric absorption accelerated beyond recovery. The oceans boiled. The sky turned orange. Nothing survived the century.",
        hint: "Lower Surface Temperature below 70."
      },
      'gravity_low': {
        name: "Atmospheric Bleed",
        desc: "Surface gravity was too weak to hold onto lighter gases. The atmosphere slowly bled into space over centuries. The skies darkened and the air simply ran out.",
        hint: "Raise Surface Gravity above 25."
      },
      'gravity_high': {
        name: "Gravitational Crushing",
        desc: "High gravity crushed all attempts at vertical growth. Trees could not grow tall, buildings collapsed under their own weight, and biological pumps failed.",
        hint: "Lower Surface Gravity below 75."
      },
      'starDistance_low': {
        name: "Dark Freeze",
        desc: "Too far from the star, the world plunged into an eternal, lightless winter. Photosynthesis ceased, and the biosphere withered away in the dark.",
        hint: "Decrease Distance from Star to below 70."
      },
      'starDistance_high': {
        name: "Stellar Radiation Scourge",
        desc: "Orbiting too close to the star stripped away the ozone layer and bombarded the surface with lethal radiation. Life mutated uncontrollably before collapsing.",
        hint: "Increase Distance from Star above 30."
      },
      'soil_low': {
        name: "Nutrient Starvation",
        desc: "The soil was barren rock. Early life exhausted the meager surface nutrients, and the food chain collapsed before it could even begin.",
        hint: "Increase Soil Richness above 20."
      },
      'natural': {
        name: "Civilizational Entropy",
        desc: `Your planet's conditions were survivable — perhaps even good. But civilizations carry the seeds of their own undoing. Wars, plagues, and the slow grinding of resources eventually consumed everything. They lasted ${tick} years.`,
        hint: "Nothing was wrong with your planet. Drop something in next time. See what they do with it."
      },
      'reckoning_transcend': {
        name: "The Last Understanding",
        desc: `They did not die of cold, or hunger, or war. After ${tick} years they reached the edge of their world, understood what they were, and made their peace with it. The final generation finished every story it had to tell, looked up once toward the boundary, and chose to go gently. This is the rarest ending there is.`,
        hint: "They forgave you, or never needed to. Few creators ever see this ending. Build another, and see if it holds."
      },
      'reckoning_collapse': {
        name: "Death by Knowing",
        desc: `They reached the truth — that the world was contained, and watched — and could not live inside it. After ${tick} years of climbing toward that knowledge, the cities turned on themselves within a single generation. The last words, scratched into a wall: WE SAW YOU.`,
        hint: "What you did to them shaped how they met the truth. A gentler hand may earn a gentler ending."
      }
    };
    return modes[cause] || defaultMode;
  }
}
