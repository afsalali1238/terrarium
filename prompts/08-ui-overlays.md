# PROMPT 08 — UI Overlays, Ticker, Speed Control & index.html

## Context
Read `docs/CLAUDE.md` and `docs/ARCHITECTURE.md` before starting.
This prompt owns: `src/ui/Ticker.js`, `src/ui/SpeedControl.js`, `index.html`, global CSS

---

## The Philosophy of This System

The ticker is the civilization's voice. It is the primary feedback loop of the entire game. Every myth, every war, every religion — the player learns about it here. The visual hierarchy in the ticker is not decoration: it is the game communicating what matters. Myth entries must stand out. Communication entries must stop the player cold. The speed control must be invisible until needed.

---

## index.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Terrarium Planet</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/src/style.css">
</head>
<body>

  <!-- SCREEN: Fine-tuning interstitial (shown before setup) -->
  <div id="screen-finetuning" class="screen active">
    <!-- FinetuningScreen.js renders here -->
  </div>

  <!-- SCREEN: Setup -->
  <div id="screen-setup" class="screen">
    <!-- SetupScreen.js renders here -->
  </div>

  <!-- SCREEN: Game -->
  <div id="screen-game" class="screen">

    <!-- Canvas: planet rendering (PixiJS) -->
    <canvas id="planet-canvas"></canvas>

    <!-- Overlay: Planet stats top-left -->
    <div id="planet-stats"></div>

    <!-- Overlay: Speed control bottom-left -->
    <div id="speed-control"></div>

    <!-- Overlay: Ticker right side -->
    <div id="ticker-overlay"></div>

    <!-- Overlay: Intervention Bar bottom-center -->
    <div id="intervention-bar"></div>

    <!-- Overlay: Zoom back button -->
    <div id="zoom-back" class="hidden"></div>

    <!-- Overlay: Person card (zoom level 3) -->
    <div id="person-card" class="hidden"></div>

    <!-- Overlay: Follow thread (followed agent's life events) -->
    <div id="follow-thread" class="hidden"></div>

    <!-- Overlay: Post-mortem (full screen) -->
    <div id="postmortem-overlay" class="hidden"></div>

  </div>

  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

---

## Global CSS (src/style.css)

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --space:         #080818;
  --surface:       #0d0d1f;
  --surface-mid:   #1a1a2e;
  --surface-high:  #252540;
  --border:        #2a2a4a;
  --text:          #c8c8e8;
  --text-dim:      #6868a8;
  --text-bright:   #e8e8ff;
  --accent-green:  #6bffb8;
  --accent-orange: #ff8833;
  --accent-red:    #ff4444;
  --accent-gold:   #ffcc44;
  --accent-magenta:#ff44ff;
  --font-mono:     'Space Mono', monospace;
  --font-ui:       'Inter', system-ui, sans-serif;
}

body {
  background: var(--space);
  color: var(--text);
  font-family: var(--font-ui);
  overflow: hidden;
  width: 100vw;
  height: 100vh;
}

canvas#planet-canvas {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
}

.screen {
  position: absolute;
  inset: 0;
  display: none;
}
.screen.active { display: flex; }
.hidden { display: none !important; }

/* Screen transitions */
.screen-fade-out { animation: fadeOut 300ms ease forwards; }
.screen-fade-in  { animation: fadeIn 300ms ease forwards; }

@keyframes fadeOut { to { opacity: 0; } }
@keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
```

---

## Ticker.js

The civilization's voice. The game's narrative output. Read constantly by the player.

### Position & Layout

```css
#ticker-overlay {
  position: absolute;
  right: 20px;
  top: 20px;
  bottom: 130px;
  width: 280px;
  background: rgba(8, 8, 24, 0.88);
  border: 1px solid var(--border);
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(4px);
}
```

### Entry Type System — Visual Hierarchy (critical)

```javascript
// These are the rules. Not suggestions. Rules.
const ENTRY_STYLES = {
  // MYTH & RELIGION — gold border, italic, gold year — THE PAYOFF
  myth: {
    borderLeft: '2px solid #ffcc44',
    background: 'rgba(255, 204, 68, 0.05)',
    textStyle: 'italic',
    yearColor: '#ffcc44',
    fontSize: '12px'
  },
  religion: {
    borderLeft: '2px solid #ffcc44',
    background: 'rgba(255, 204, 68, 0.05)',
    textStyle: 'italic',
    yearColor: '#ffcc44',
    fontSize: '12px'
  },

  // COMMUNICATION — magenta, larger, addressed format — STOPS THE PLAYER COLD
  // This is the "FROM: The Academy of Solenne" event
  communication: {
    borderLeft: '3px solid #ff44ff',
    background: 'rgba(255, 68, 255, 0.08)',
    textStyle: 'normal',
    yearColor: '#ff44ff',
    fontSize: '13px',
    fontWeight: '700',
    padding: '12px'  // more breathing room
  },

  // PLAYER NAME MENTIONED — no special border, but the line pulses
  // Handled via JS: if entry.text includes playerName → add 'name-glow' class
  // .name-glow animates brightness for 500ms

  // WAR & DEATH — red border, weight
  war: {
    borderLeft: '2px solid #ff4444',
    background: 'rgba(255, 68, 68, 0.04)',
    yearColor: '#ff6868',
    fontSize: '12px'
  },
  death: {
    borderLeft: '2px solid #ff4444',
    background: 'rgba(255, 68, 68, 0.04)',
    yearColor: '#ff6868',
    fontSize: '12px'
  },

  // ROUTINE — no border, dim text — background noise
  settlement: { yearColor: '#6868a8', fontSize: '11px' },
  birth:      { yearColor: '#6868a8', fontSize: '11px' },
  tech:       { yearColor: '#6868a8', fontSize: '11px' },

  // NOTABLE BIRTH (Asha mechanic) — gold border, NOT italic
  // Different from myth — same gold but different weight
  notable_birth: {
    borderLeft: '2px solid #ffcc44',
    background: 'rgba(255, 204, 68, 0.05)',
    textStyle: 'normal',
    fontWeight: '700',
    yearColor: '#ffcc44',
    fontSize: '12px'
  },

  // INTERVENTION — white border, player action
  intervention: {
    borderLeft: '2px solid rgba(255,255,255,0.3)',
    yearColor: '#ffffff',
    fontSize: '12px'
  },

  // DISCOVERY (anomaly / container) — magenta dim
  discovery: {
    borderLeft: '2px solid rgba(255, 68, 255, 0.5)',
    background: 'rgba(255, 68, 255, 0.03)',
    textStyle: 'italic',
    yearColor: 'rgba(255, 68, 255, 0.7)',
    fontSize: '12px'
  }
}
```

### Player Name Glow

```javascript
// After each entry is added: check if player's current name is in the text
// If yes: pulse the entry brightness for 500ms
function checkPlayerNameMention(entryEl, playerName) {
  if (!playerName) return
  if (entryEl.textContent.includes(playerName)) {
    entryEl.classList.add('name-glow')
    setTimeout(() => entryEl.classList.remove('name-glow'), 500)
  }
}

// CSS:
// .name-glow { animation: namePulse 500ms ease-out; }
// @keyframes namePulse { 0% { filter: brightness(1); } 50% { filter: brightness(2.5); } 100% { filter: brightness(1); } }
```

### Communication Entry (special rendering)

Communication events (`communication:outbound`) render differently:

```javascript
addCommunicationEntry({ tick, settlement, text }) {
  // Full-width entry with padding
  // FROM line in Space Mono, bold, magenta
  // Message text in regular weight, italic
  // No year prefix — these are addressed to the player, not a historical log
  // A horizontal rule above and below to separate from routine entries
  // The player cannot respond. That is the point.
  const el = document.createElement('div')
  el.className = 'ticker-communication'
  el.innerHTML = `
    <div class="ticker-rule"></div>
    <div class="ticker-from">FROM: The Academy of ${settlement}, Year ${tick}</div>
    <div class="ticker-comm-text">${text}</div>
    <div class="ticker-rule"></div>
  `
  this.prependEntry(el)
}
```

### Follow Thread Panel

When a player follows an agent (via clicking their name in the ticker), a small secondary panel appears below the ticker or adjacent to it:

```
┌────────────────────────┐
│  FOLLOWING             │
│  Asha of the Fen       │
│  ──────────────────    │
│  Age 12 — converted    │
│  to the Screaming Sky  │
│  Cult                  │
│                         │
│  Age 34 — became       │
│  a priest              │
│                         │
│  Age 67 — survived     │
│  the great plague      │
│                         │
│  [Unfollow]            │
└────────────────────────┘
```

Events emit from Agent._emitLifeEvent() → ticker adds to follow-thread panel only (not main ticker).

---

## SpeedControl.js

Minimal. Unobtrusive. Available when needed, invisible when not.

### Position

```css
#speed-control {
  position: absolute;
  bottom: 130px;
  left: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(8, 8, 24, 0.75);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 6px 10px;
}
```

### UI

```
[⏸] [0.5×] [1×] [4×]
```

- Four buttons: pause (⏸), 0.5×, 1×, 4×
- Active speed: slightly brighter, no bold or underline
- Keyboard: Spacebar = pause/resume, +/- = cycle speeds
- Changes `GameState.simSpeed` → SimEngine reads it next tick

### Keyboard Shortcuts

```javascript
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') togglePause()
  if (e.key === '+' || e.key === '=') increaseSpeed()
  if (e.key === '-') decreaseSpeed()
})
```

---

## Planet Stats Bar (top-left)

Minimal. Not the focus.

```
Year: 347    Pop: 4,821    [====----] health
```

Updates via `EventBus.on('sim:tick')`. Health bar color matches planet state.

---

## EventBus Listeners

```javascript
// Ticker
EventBus.on('sim:civ_event',       ({ event }) => ticker.addEntry(event))
EventBus.on('sim:guaranteed_myth', (data)      => ticker.addEntry({ ...data, type: 'myth' }))
EventBus.on('sim:notable_birth',   (data)      => ticker.addEntry({ ...data, type: 'notable_birth' }))
EventBus.on('myth:created',        ({ myth })  => ticker.addMythEntry(myth))
EventBus.on('religion:formed',     ({ rel })   => ticker.addEntry({ type: 'religion', text: rel.foundingText }))
EventBus.on('communication:outbound', (data)   => ticker.addCommunicationEntry(data))
EventBus.on('intervention:meteor', (data)      => ticker.addEntry({ type: 'intervention', text: `You sent a meteor toward ${data.nearestSettlement}.` }))
EventBus.on('intervention:drought',(data)      => ticker.addEntry({ type: 'intervention', text: 'You withheld the rain.' }))
EventBus.on('intervention:bless',  (data)      => ticker.addEntry({ type: 'intervention', text: 'You blessed the harvest.' }))
EventBus.on('planet:death',        ()          => ticker.freeze())
EventBus.on('setup:complete',      ()          => ticker.clear())
EventBus.on('player:name_changed', ({ name })  => ticker.updatePlayerName(name))
EventBus.on('zoom:agent_focused',  ({ agent }) => ticker.showFollowOption(agent))
```

---

## Screen Transitions

```javascript
export function showScreen(to) {
  const current = document.querySelector('.screen.active')
  if (current) {
    current.classList.add('screen-fade-out')
    setTimeout(() => {
      current.classList.remove('active', 'screen-fade-out')
      const next = document.getElementById(`screen-${to}`)
      next.classList.add('active', 'screen-fade-in')
      setTimeout(() => next.classList.remove('screen-fade-in'), 300)
    }, 300)
  }
}

// Flow:
// finetuning → setup (after 4.5 seconds, auto)
// setup → game (on 'setup:complete')
// game → game (postmortem overlays game, doesn't replace it)
// postmortem [retry] → setup (slider prefill)
```

---

## Output

1. `index.html` — complete shell with all screen divs and overlay anchors
2. `style.css` — full CSS with variables, screen system, ticker entry styles
3. `Ticker.js` — full visual hierarchy (myth gold, communication magenta, routine dim, name glow)
4. Communication entry special rendering (FROM: format, rules, padding)
5. Follow thread panel (secondary panel, life events from followed agent)
6. `SpeedControl.js` — pause + 0.5x/1x/4x with keyboard shortcuts
7. Planet stats bar (year, population, health bar)
8. All EventBus listeners wired correctly
9. Screen transitions (300ms fade between all screens)
