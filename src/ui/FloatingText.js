export class FloatingText {
  constructor(el, eventBus) {
    this.el = el;
    this.eventBus = eventBus;
    this._build();
    this.eventBus.on('ui:floating_text', (data) => this._spawn(data));
  }

  _build() {
    if (!document.getElementById('floating-text-styles')) {
      const s = document.createElement('style');
      s.id = 'floating-text-styles';
      s.textContent = `
        .floating-text-container {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 150;
          overflow: hidden;
        }
        .floating-text-item {
          position: absolute;
          font-family: 'Space Mono', monospace;
          font-size: 20px;
          font-weight: bold;
          text-shadow: 0 2px 8px rgba(0,0,0,0.8);
          pointer-events: none;
          animation: floatUp 2s ease-out forwards;
        }
        @keyframes floatUp {
          0% { opacity: 0; transform: translate(-50%, 0) scale(0.5); }
          10% { opacity: 1; transform: translate(-50%, -20px) scale(1.2); }
          100% { opacity: 0; transform: translate(-50%, -100px) scale(1); }
        }
      `;
      document.head.appendChild(s);
    }
    this.container = document.createElement('div');
    this.container.className = 'floating-text-container';
    this.el.appendChild(this.container);
  }

  _spawn({ text, color, x, y }) {
    const item = document.createElement('div');
    item.className = 'floating-text-item';
    item.textContent = text;
    item.style.color = color || '#fff';
    item.style.left = (x !== undefined ? x : window.innerWidth / 2) + 'px';
    item.style.top = (y !== undefined ? y : window.innerHeight / 2) + 'px';
    
    this.container.appendChild(item);
    
    setTimeout(() => {
      if (item.parentNode) item.parentNode.removeChild(item);
    }, 2000);
  }
}
