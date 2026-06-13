export class Ticker {
  constructor(el, eventBus) {
    this.el = el;
    this.eventBus = eventBus;
    this.scrollEl = this.el.querySelector('#ticker-scroll');
    this.toggleBtn = this.el.querySelector('#ticker-toggle');
    this.followThreadEl = document.getElementById('follow-thread');
    this.followedAgentId = null;
    this.playerName = null;
    this.frozen = false;
    this._attachEvents();
  }

  _attachEvents() {
    if (this.toggleBtn) {
      this.toggleBtn.addEventListener('click', () => {
        this.el.classList.toggle('collapsed');
      });
    }
    // Only show raw civ events that don't become myths — myth events appear via myth:created in gold
    this.eventBus.on('sim:civ_event', ({ event }) => { if (!event.feedsMyth) this.addEntry(event); });
    // sim:guaranteed_myth is handled by MythEngine → myth:created, so we skip it here to avoid duplicates
    this.eventBus.on('sim:notable_birth', (data) => this.addEntry({ ...data, type: 'notable_birth' }));
    this.eventBus.on('myth:created', ({ myth }) => this.addMythEntry(myth));
    this.eventBus.on('religion:formed', ({ rel }) => {
      if (rel) this.addEntry({ type: 'religion', text: rel.foundingText || '', tick: rel.tick });
    });
    this.eventBus.on('communication:outbound', (data) => this.addCommunicationEntry(data));
    this.eventBus.on('intervention:meteor', (data) => this.addEntry({
      type: 'intervention',
      text: 'You sent a meteor toward ' + (data.nearestSettlement || 'the planet') + '.',
      tick: data.tick
    }));
    this.eventBus.on('intervention:drought', (data) => this.addEntry({ type: 'intervention', text: 'You withheld the rain.', tick: data.tick }));
    this.eventBus.on('intervention:bless', (data) => this.addEntry({ type: 'intervention', text: 'You blessed the harvest.', tick: data.tick }));
    this.eventBus.on('planet:death', () => this.freeze());
    this.eventBus.on('player:name_changed', ({ name }) => this.updatePlayerName(name));
    this.eventBus.on('zoom:agent_focused', ({ agent }) => this.showFollowOption(agent));
    this.eventBus.on('agent:life_event', (data) => this.handleAgentLifeEvent(data));
  }

  freeze() { this.frozen = true; }

  clear() {
    if (this.scrollEl) this.scrollEl.innerHTML = '';
    this.frozen = false;
    this.unfollow();
  }

  updatePlayerName(name) { this.playerName = name; }

  addEntry(data) {
    if (this.frozen || !data) return;
    const div = document.createElement('div');
    div.className = 'ticker-entry';
    const year = data.tick ? 'Year ' + data.tick : '?';
    div.innerHTML = '<span class="ticker-year">' + year + '</span> <span class="ticker-text">' + (data.text || '') + '</span>';
    this.applyStyles(div, data.type);
    this.checkPlayerNameMention(div);
    this.prependEntry(div);
  }

  addMythEntry(myth) {
    if (this.frozen || !myth) return;
    const div = document.createElement('div');
    div.className = 'ticker-entry';
    const year = myth.tick ? 'Year ' + myth.tick : '?';
    div.innerHTML = '<span class="ticker-year">' + year + '</span> <span class="ticker-text">' + (myth.legend || '') + '</span>';
    this.applyStyles(div, 'myth');
    this.checkPlayerNameMention(div);
    this.prependEntry(div);
  }

  addCommunicationEntry(data) {
    if (this.frozen || !data) return;
    const el = document.createElement('div');
    el.className = 'ticker-communication';
    // data.text from CivEvents already contains the full FROM header + message
    el.innerHTML =
      '<div class="ticker-rule"></div>' +
      '<div class="ticker-comm-text">' + (data.text || '') + '</div>' +
      '<div class="ticker-rule"></div>';
    this.prependEntry(el);
  }

  prependEntry(el) {
    if (!this.scrollEl) return;
    this.scrollEl.prepend(el);
    if (this.scrollEl.children.length > 100) {
      this.scrollEl.removeChild(this.scrollEl.lastChild);
    }
  }

  checkPlayerNameMention(entryEl) {
    if (!this.playerName) return;
    if (entryEl.textContent.includes(this.playerName)) {
      entryEl.classList.add('name-glow');
      setTimeout(() => entryEl.classList.remove('name-glow'), 500);
    }
  }

  applyStyles(div, type) {
    const rules = {
      myth:         { borderLeft: '2px solid #ffcc44', background: 'rgba(255,204,68,0.05)', fontStyle: 'italic', color: '#ffcc44' },
      religion:     { borderLeft: '2px solid #ffcc44', background: 'rgba(255,204,68,0.05)', fontStyle: 'italic', color: '#ffcc44' },
      war:          { borderLeft: '2px solid #ff4444', background: 'rgba(255,68,68,0.04)', color: '#ff6868' },
      death:        { borderLeft: '2px solid #ff4444', background: 'rgba(255,68,68,0.04)', color: '#ff6868' },
      notable_birth:{ borderLeft: '2px solid #ffcc44', background: 'rgba(255,204,68,0.05)', fontWeight: '700', color: '#ffcc44' },
      intervention: { borderLeft: '2px solid rgba(255,255,255,0.3)', color: '#ffffff' },
      discovery:    { borderLeft: '2px solid rgba(255,68,255,0.5)', background: 'rgba(255,68,255,0.03)', fontStyle: 'italic', color: 'rgba(255,68,255,0.7)' },
      routine:      { color: '#6868a8', fontSize: '11px' }
    };
    const style = rules[type] || rules.routine;
    if (style.borderLeft) div.style.borderLeft = style.borderLeft;
    if (style.background) div.style.background = style.background;
    const textEl = div.querySelector('.ticker-text');
    if (textEl) {
      if (style.fontStyle) textEl.style.fontStyle = style.fontStyle;
      if (style.fontWeight) textEl.style.fontWeight = style.fontWeight;
    }
    if (style.fontSize) div.style.fontSize = style.fontSize;
    if (style.color) {
      const yearEl = div.querySelector('.ticker-year');
      if (yearEl) yearEl.style.color = style.color;
    }
  }

  showFollowOption(agent) {
    if (!this.followThreadEl || !agent) return;
    this.followedAgentId = agent.id;
    this.followThreadEl.classList.remove('hidden');
    this.followThreadEl.innerHTML =
      '<div class="ft-header">FOLLOWING</div>' +
      '<div class="ft-name">' + (agent.name || 'Unknown') + '</div>' +
      '<div class="ft-events" id="ft-events-container">' +
        '<div>Age ' + (agent.age || 0) + ' — focused by creator</div>' +
      '</div>' +
      '<button class="ft-unfollow" id="ft-btn-unfollow">Unfollow</button>';
    this.followThreadEl.querySelector('#ft-btn-unfollow').addEventListener('click', () => this.unfollow());
  }

  handleAgentLifeEvent(data) {
    if (!this.followThreadEl || this.followedAgentId !== data.agentId) return;
    const container = this.followThreadEl.querySelector('#ft-events-container');
    if (container) {
      const ev = document.createElement('div');
      ev.textContent = 'Age ' + data.age + ' — ' + data.eventText;
      container.appendChild(ev);
    }
  }

  unfollow() {
    this.followedAgentId = null;
    if (this.followThreadEl) {
      this.followThreadEl.classList.add('hidden');
      this.followThreadEl.innerHTML = '';
    }
  }
}
