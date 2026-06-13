export class ZoomController {
  constructor(renderer, gameState, eventBus) {
    this.renderer = renderer;
    this.gameState = gameState;
    this.eventBus = eventBus;
    
    this.currentLevel = 0;      // 0=planet, 1=region, 2=village, 3=person
    this.targetX = 0;           // world coords of zoom focus
    this.targetY = 0;
    this.targetAgent = null;
    this.targetSettlement = null;

    this.ZOOM_SCALES = {
      0: 1.0,    // full planet visible
      1: 4.0,    // region
      2: 16.0,   // village
      3: 32.0    // person
    };

    // Attach to canvas scroll and click
    const canvas = renderer.app.view;
    canvas.addEventListener('wheel', (e) => this.onScroll(e));
    canvas.addEventListener('click', (e) => this.onClick(e));

    // Handle Person Card back button / ESC
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.currentLevel === 3) {
        this.zoomOut();
      }
    });

    const backBtn = document.getElementById('zoom-back');
    if (backBtn) {
      backBtn.addEventListener('click', () => this.zoomOut());
    }

    this.personCardEl = document.getElementById('person-card');
    this.zoomBackEl = document.getElementById('zoom-back');
    
    this.eventBus.on('sim:tick', () => {
      if (this.currentLevel === 3 && this.targetAgent) {
        this.updatePersonCard();
      }
    });
  }

  onScroll(e) {
    if (e.deltaY < 0) {
      // scroll up -> zoom in (center on cursor)
      const rect = this.renderer.app.view.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const { x, y } = this.screenToWorld(clickX, clickY);
      
      this.zoomIn(x, y);
    } else {
      this.zoomOut();
    }
  }

  onClick(e) {
    const rect = this.renderer.app.view.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    const worldPoint = this.screenToWorld(clickX, clickY);

    if (this.currentLevel === 0) {
      // Click at level 0: Find nearest settlement
      const settlement = this.findNearestSettlement(worldPoint.x, worldPoint.y, 30);
      if (settlement) {
        this.targetSettlement = settlement;
        this.zoomTo(2, settlement.x, settlement.y);
      } else {
        this.zoomTo(1, worldPoint.x, worldPoint.y);
      }
    } else if (this.currentLevel >= 1 && this.currentLevel < 3) {
      // Click at level 1/2: Find nearest agent
      const agent = this.findNearestAgent(worldPoint.x, worldPoint.y, 10);
      if (agent) {
        this.targetAgent = agent;
        this.zoomTo(3, agent.x, agent.y);
      } else {
        this.zoomTo(2, worldPoint.x, worldPoint.y);
      }
    }
  }

  zoomIn(worldX, worldY) {
    if (this.currentLevel < 3) {
      this.zoomTo(this.currentLevel + 1, worldX, worldY);
    }
  }

  zoomOut() {
    if (this.currentLevel > 0) {
      const prevLevel = this.currentLevel - 1;
      if (prevLevel === 0) {
        this.zoomTo(0, 0, 0);
      } else {
        this.zoomTo(prevLevel, this.targetX, this.targetY);
      }
    }
  }

  screenToWorld(screenX, screenY) {
    // Stage coordinates are centered in screen, scaled.
    // Screen coords -> Stage local -> scene local -> container local
    // (screenX - stage.x) / stage.scale = worldX
    const scene = this.renderer.scene;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    
    const worldX = (screenX - cx - scene.x) / scene.scale.x;
    const worldY = (screenY - cy - scene.y) / scene.scale.y;

    return { x: worldX, y: worldY };
  }

  findNearestSettlement(x, y, radius) {
    if (!this.gameState.planet || !this.gameState.planet.settlements) return null;
    let nearest = null;
    let minDist = radius;
    for (const s of this.gameState.planet.settlements) {
      const dist = Math.sqrt((s.x - x)**2 + (s.y - y)**2);
      if (dist < minDist) {
        minDist = dist;
        nearest = s;
      }
    }
    return nearest;
  }

  findNearestAgent(x, y, radius) {
    if (!this.gameState.planet || !this.gameState.planet.agents) return null;
    let nearest = null;
    let minDist = radius;
    for (const a of this.gameState.planet.agents) {
      const dist = Math.sqrt((a.x - x)**2 + (a.y - y)**2);
      if (dist < minDist) {
        minDist = dist;
        nearest = a;
      }
    }
    return nearest;
  }

  zoomTo(level, x, y) {
    this.currentLevel = level;
    this.targetX = x;
    this.targetY = y;
    
    // Scale and pivot
    const targetScale = this.ZOOM_SCALES[level];
    
    // Animate using a simple interval (since we don't have Tween.js)
    const scene = this.renderer.scene;
    const startScale = scene.scale.x;
    const startX = scene.x;
    const startY = scene.y;
    
    const targetSceneX = -x * targetScale;
    const targetSceneY = -y * targetScale;

    const duration = 300;
    const start = performance.now();

    const anim = () => {
      const now = performance.now();
      const progress = Math.min((now - start) / duration, 1.0);
      
      // ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      
      const currentScale = startScale + (targetScale - startScale) * ease;
      scene.scale.set(currentScale);
      
      scene.x = startX + (targetSceneX - startX) * ease;
      scene.y = startY + (targetSceneY - startY) * ease;

      if (progress < 1.0) {
        requestAnimationFrame(anim);
      } else {
        if (level === 3) this.showPersonCard();
        else this.hidePersonCard();
        this.updateBackButton();
      }
    };
    requestAnimationFrame(anim);

    this.eventBus.emit('zoom:changed', {
      level: this.currentLevel,
      targetX: this.targetX,
      targetY: this.targetY,
      targetAgent: this.currentLevel === 3 ? this.targetAgent : null,
      targetSettlement: this.targetSettlement
    });
    
    if (this.currentLevel === 3 && this.targetAgent) {
      this.eventBus.emit('zoom:agent_focused', { agent: this.targetAgent });
    }
  }

  updateBackButton() {
    if (!this.zoomBackEl) return;
    if (this.currentLevel > 0) {
      this.zoomBackEl.classList.remove('hidden');
      const names = ['Planet View', 'Region View', 'Village View'];
      this.zoomBackEl.innerHTML = `← Back to ${names[this.currentLevel - 1]}`;
    } else {
      this.zoomBackEl.classList.add('hidden');
    }
  }

  showPersonCard() {
    if (!this.personCardEl || !this.targetAgent) return;
    this.personCardEl.classList.remove('hidden');
    this.updatePersonCard();
  }

  hidePersonCard() {
    if (!this.personCardEl) return;
    this.personCardEl.classList.add('hidden');
    this.targetAgent = null;
  }

  updatePersonCard() {
    if (!this.targetAgent) return;
    const a = this.targetAgent;
    
    // For mock, fallback values if undefined
    const name = a.name || "Unknown";
    const role = a.role || "Settler";
    const age = a.age || 20;
    const sect = a.sect || "No Sect";
    
    let beliefsStr = "Waiting for a sign.";
    if (a.beliefs && a.beliefs.length > 0) {
      // Resolve belief IDs against planet.myths
      const resolved = a.beliefs.map(id => {
        const myth = this.gameState.planet?.myths?.find(m => m.id === id);
        return myth ? myth.legend : null;
      }).filter(Boolean);
      
      if (resolved.length > 0) {
        beliefsStr = resolved.join("<br><br>");
      } else if (a.settlement && a.settlement.dominantMythType) {
        beliefsStr = `Believes in ${a.settlement.dominantMythType}`;
      }
    } else if (a.settlement && a.settlement.dominantMythType) {
      beliefsStr = `Follows the ${a.settlement.dominantMythType} tradition.`;
    }

    this.personCardEl.innerHTML = `
      <div class="pc-name">${name.toUpperCase()}</div>
      <div class="pc-role">${role.charAt(0).toUpperCase() + role.slice(1)} · Age ${age}</div>
      <div class="pc-divider"></div>
      <div class="pc-label">Believes:</div>
      <div class="pc-belief">"${beliefsStr}"</div>
      <div class="pc-label">Member of:</div>
      <div class="pc-sect">${sect}</div>
    `;
  }
}
