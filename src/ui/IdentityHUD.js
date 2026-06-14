export class IdentityHUD {
  constructor(el, eventBus) {
    this.el = el;
    this.eventBus = eventBus;
    this._build();
    this.eventBus.on('player:name_changed', (data) => this._update(data));
    this.eventBus.on('setup:complete', () => this._reset());
  }

  _build() {
    this.el.innerHTML = `
      <div id="identity-header">YOUR IDENTITY</div>
      <div id="identity-name" style="color: var(--text-dim)">The Absent One</div>
      <div id="identity-trend">Actions: None</div>
    `;
    this.nameEl = this.el.querySelector('#identity-name');
    this.trendEl = this.el.querySelector('#identity-trend');
  }

  _update(data) {
    const { name, counts } = data;
    this.nameEl.textContent = name;
    
    if (name.includes('Sky Breaker')) this.nameEl.style.color = 'var(--accent-orange)';
    else if (name.includes('Generous')) this.nameEl.style.color = 'var(--accent-green)';
    else if (name.includes('Absent') || name.includes('Silent')) this.nameEl.style.color = 'var(--text-dim)';
    else if (name.includes('Capricious')) this.nameEl.style.color = 'var(--accent-gold)';
    else if (name.includes('Redeemer')) this.nameEl.style.color = 'var(--accent-magenta)';
    else this.nameEl.style.color = 'var(--text-bright)';

    if (counts) {
      const parts = [];
      if (counts.meteors > 0) parts.push(`Meteors: ${counts.meteors}`);
      if (counts.blessings > 0) parts.push(`Blessings: ${counts.blessings}`);
      if (counts.droughts > 0) parts.push(`Droughts: ${counts.droughts}`);
      
      if (parts.length > 0) {
        this.trendEl.textContent = 'Actions: ' + parts.join(' · ');
      } else {
        this.trendEl.textContent = 'Actions: None';
      }
    }
  }

  _reset() {
    this.nameEl.textContent = 'The Absent One';
    this.nameEl.style.color = 'var(--text-dim)';
    this.trendEl.textContent = 'Actions: None';
  }
}
