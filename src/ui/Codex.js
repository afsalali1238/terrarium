// Field Notes — the educational capstone. As you play, the game permanently records
// what you've discovered, each entry pairing the in-game event with the REAL science
// or history behind it. A layperson leaves with a small encyclopedia of why life is
// rare and how civilizations rise and fall. Persists in localStorage; self-contained.

const STORE = 'terrarium_codex'

const CATALOG = {
  'Failure Modes': {
    icon: '☠',
    entries: {
      atmosphere_low:  ['Atmosphere Collapse', 'A thin atmosphere can hold neither pressure nor oxygen. On Mars — about 1% of Earth\'s pressure — liquid water boils away and raw radiation reaches the ground.'],
      atmosphere_high: ['Pressure Crush', 'A crushing atmosphere traps heat. Venus\'s CO₂ blanket is ~90× Earth\'s pressure and bakes its surface to 460°C — a runaway greenhouse.'],
      water_low:       ['Moisture Failure', 'Without enough water there is no stable rain-and-nutrient cycle. A whole dry world struggles to ever start life.'],
      water_high:      ['Drowned World', 'An ocean world offers no dry land — and without dry land there is no fire, no metalworking, no path to technology.'],
      heat_low:        ['Thermal Stasis', 'Below freezing, water locks into ice and chemistry slows to a crawl. Life as we know it needs liquid water.'],
      heat_high:       ['Runaway Heat', 'Too hot and proteins fall apart and oceans evaporate. Earth sits in a narrow temperature band called the habitable zone.'],
      gravity_low:     ['Atmospheric Bleed', 'Weak gravity lets a world\'s air leak slowly into space — part of why Mars lost most of its atmosphere.'],
      gravity_high:    ['Gravity Crush', 'Strong gravity flattens everything. Tall structures, large bodies, and biological pumps all fail under the weight.'],
      starDistance_low:  ['The Dark Freeze', 'Far from its star, a world freezes in perpetual night — beyond the habitable zone, like the icy moons of the outer planets.'],
      starDistance_high: ['Stellar Scourge', 'Too close, a star\'s radiation strips the atmosphere and scorches the surface bare.'],
      soil_low:        ['Barren Ground', 'Bare rock offers no nutrients. A food chain has nothing to build its first link upon.'],
      natural:         ['Civilizational Entropy', 'Even a perfect world is not safe from its own people. War, plague, and spent resources end most civilizations from within.']
    }
  },
  'How They End': {
    icon: '◷',
    entries: {
      reckoning_transcend: ['The Last Understanding', 'A civilization that learns the truth of its world — that it is contained, and watched — and makes peace with it, ending gently. The rarest outcome of all.'],
      reckoning_collapse:  ['Death by Knowing', 'Most minds cannot bear the knowledge that they are watched. On reaching that truth, they tear their own world apart.']
    }
  },
  'Your Names': {
    icon: '✶',
    entries: {
      absent:     ['The Absent One', 'You barely touched their world. They came to believe their maker was gone, or sleeping, or never there at all.'],
      cruel:      ['The Sky Breaker', 'You ruled by fire. They remember you as something to be feared, and survival as never being noticed.'],
      generous:   ['The Generous Hand', 'You gave more than you took. They built their faith on gratitude, and faced the end unafraid.'],
      redeemer:   ['The Redeemer', 'You broke them and then mended them. They learned that suffering is followed by grace, if they endure.'],
      capricious: ['The Capricious One', 'Fire and harvest from the same hand. They could never decide what you were — and that terrified them most.']
    }
  },
  'Ages of a World': {
    icon: '⌛',
    entries: {
      dawn:          ['The Dawn', 'Fire, the first words, the first burial. Every human story began here, around 300,000 years ago.'],
      tribes:        ['The Tribes', 'The first places people refused to leave. Settling down — the Neolithic — changed our species forever.'],
      kingdoms:      ['The Kingdoms', 'Rulers, temples, the first written laws — and the first wars. Civilization, roughly 5,000 years ago.'],
      enlightenment: ['The Enlightenment', 'Calendars, telescopes, heresy and proof. A civilization begins to measure its own universe.'],
      industrial:    ['The Industrial Age', 'Engines, weapons, machines that think — and the first whispers that the sky might be a screen.'],
      reckoning:     ['The Reckoning', 'A civilization proves, beyond doubt, that its world has a boundary — and something beyond it, watching.']
    }
  }
}

export class Codex {
  constructor(eventBus, gameState) {
    this.eventBus = eventBus
    this.gameState = gameState
    this.data = this._load()
    this._build()

    eventBus.on('finetuning:complete', () => this._showButton(true))
    eventBus.on('ui:nav_setup', () => this._showButton(true))
    eventBus.on('setup:complete', () => { this._showButton(false); this._close() })
    eventBus.on('planet:death', (d) => { this._recordDeath(d); this._showButton(true) })
    eventBus.on('sim:epoch_change', ({ epoch }) => this._record('Ages of a World', epoch))
  }

  _load() {
    try { return JSON.parse(localStorage.getItem(STORE) || '{}') } catch (e) { return {} }
  }
  _save() { try { localStorage.setItem(STORE, JSON.stringify(this.data)) } catch (e) {} }

  _record(section, key) {
    if (!key || !CATALOG[section]?.entries[key]) return
    this.data[section] = this.data[section] || {}
    if (!this.data[section][key]) { this.data[section][key] = true; this._save() }
  }

  _recordDeath(d) {
    if (!d) return
    if (/^reckoning_/.test(d.cause)) this._record('How They End', d.cause)
    else this._record('Failure Modes', d.cause)
    const n = d.playerName || ''
    const arch = /Sky Breaker|Fire|Void/i.test(n) ? 'cruel'
      : /Generous|Provider|Warm/i.test(n) ? 'generous'
      : /Redeemer|Mended/i.test(n) ? 'redeemer'
      : /Capricious|Dreamer|Tests/i.test(n) ? 'capricious'
      : 'absent'
    this._record('Your Names', arch)
  }

  _counts() {
    let total = 0, found = 0
    for (const sec of Object.keys(CATALOG)) {
      const keys = Object.keys(CATALOG[sec].entries)
      total += keys.length
      found += keys.filter(k => this.data[sec]?.[k]).length
    }
    return { total, found }
  }

  _build() {
    const style = document.createElement('style')
    style.textContent = `
      #codex-btn{position:fixed;bottom:16px;left:16px;z-index:200;display:none;
        background:rgba(8,8,24,0.85);color:#cfd6f5;border:1px solid #2a2a4a;border-radius:6px;
        padding:8px 12px;cursor:pointer;font-family:'Space Mono',monospace;font-size:12px;letter-spacing:1px}
      #codex-btn:hover{border-color:#4aff9a;color:#4aff9a}
      #codex-overlay{position:fixed;inset:0;z-index:210;display:none;background:rgba(4,5,12,0.92);
        backdrop-filter:blur(3px);overflow-y:auto;font-family:'Inter',system-ui,sans-serif}
      #codex-overlay.open{display:block}
      #codex-inner{max-width:760px;margin:0 auto;padding:40px 20px 80px}
      #codex-head{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px}
      #codex-head h1{font-family:'Space Mono',monospace;font-size:22px;color:#eef0ff;letter-spacing:2px}
      #codex-prog{font-family:'Space Mono',monospace;font-size:12px;color:#7a8ac0}
      #codex-sub{font-size:12px;color:#7070a0;margin-bottom:26px}
      .cx-sec{margin-bottom:30px}
      .cx-sec h2{font-family:'Space Mono',monospace;font-size:13px;letter-spacing:2px;color:#9a9ac8;
        text-transform:uppercase;border-bottom:1px solid #1e1e3a;padding-bottom:6px;margin-bottom:12px}
      .cx-entry{border:1px solid #1e1e3a;border-radius:8px;padding:12px 14px;margin-bottom:8px;background:rgba(20,20,40,0.4)}
      .cx-entry.locked{opacity:0.5}
      .cx-title{font-size:14px;color:#e0e0f0;margin-bottom:4px;font-weight:500}
      .cx-title.locked{color:#5a5a7a;font-family:'Space Mono',monospace}
      .cx-text{font-size:12.5px;color:#aab0d0;line-height:1.55}
      #codex-close{position:fixed;top:18px;right:22px;z-index:211;background:none;border:1px solid #2a2a4a;
        color:#cfd6f5;border-radius:6px;padding:8px 14px;cursor:pointer;font-family:'Space Mono',monospace;font-size:12px}
      #codex-close:hover{border-color:#ff8a8a;color:#ff8a8a}
    `
    document.head.appendChild(style)

    this.btn = document.createElement('button')
    this.btn.id = 'codex-btn'
    this.btn.textContent = '📖 Field Notes'
    this.btn.onclick = () => this._open()
    document.body.appendChild(this.btn)

    this.overlay = document.createElement('div')
    this.overlay.id = 'codex-overlay'
    this.overlay.innerHTML = '<button id="codex-close">CLOSE ✕</button><div id="codex-inner"></div>'
    document.body.appendChild(this.overlay)
    this.overlay.querySelector('#codex-close').onclick = () => this._close()
  }

  _showButton(v) { this.btn.style.display = v ? 'block' : 'none' }

  _open() {
    const { total, found } = this._counts()
    let html =
      '<div id="codex-head"><h1>FIELD NOTES</h1>' +
      '<span id="codex-prog">' + found + ' / ' + total + ' discovered</span></div>' +
      '<div id="codex-sub">What every world you create teaches about ours.</div>'

    for (const sec of Object.keys(CATALOG)) {
      html += '<div class="cx-sec"><h2>' + CATALOG[sec].icon + '  ' + sec + '</h2>'
      for (const key of Object.keys(CATALOG[sec].entries)) {
        const [title, text] = CATALOG[sec].entries[key]
        const unlocked = !!this.data[sec]?.[key]
        if (unlocked) {
          html += '<div class="cx-entry"><div class="cx-title">' + title + '</div><div class="cx-text">' + text + '</div></div>'
        } else {
          html += '<div class="cx-entry locked"><div class="cx-title locked">??? — undiscovered</div>' +
            '<div class="cx-text">Keep playing to uncover this.</div></div>'
        }
      }
      html += '</div>'
    }
    this.overlay.querySelector('#codex-inner').innerHTML = html
    this.overlay.classList.add('open')
  }

  _close() { this.overlay.classList.remove('open') }
}
