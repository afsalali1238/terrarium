const SAVE_KEY = 'terrarium_planet_save'

export const SaveManager = {
  save(state) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        runHistory: state.runHistory?.slice(-5) ?? [],
        lastSliders: state.planet?.sliders ?? null,
        savedAt: Date.now()
      }))
    } catch(e) { console.warn('Save failed', e) }
  },
  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch(e) { return null }
  },
  clear() {
    localStorage.removeItem(SAVE_KEY)
  }
}
