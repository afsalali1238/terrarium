const SAVE_KEY = 'terrarium_planet_save'

export const SaveManager = {
  save(state) {
    try {
      // Serialize full state to support resume
      const payload = {
        runHistory: state.runHistory?.slice(-5) ?? [],
        lastSliders: state.planet?.sliders ?? null,
        savedAt: Date.now(),
        resumeState: null
      }
      if (state.planet && state.planet.isAlive) {
        payload.resumeState = {
          planet: state.planet, // Planet is JSON serializable
          influence: state.influence,
          devotion: state.devotion,
          interventionLog: state.interventionLog,
          myths: state.myths,
          tick: state.planet.tick
        }
      }
      localStorage.setItem(SAVE_KEY, JSON.stringify(payload))
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
