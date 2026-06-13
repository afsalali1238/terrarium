export const SAFE_ZONES = {
  atmosphere:   [35, 65],
  water:        [20, 80],
  heat:         [30, 70],
  gravity:      [25, 75],
  starDistance: [30, 70],
  soil:         [20, 100]
}

export const FAILURE_NAMES = {
  atmosphere_low:      'Atmosphere Collapse',
  atmosphere_high:     'Toxic Pressure Death',
  water_low:           'Desert Extinction',
  water_high:          'Ocean World Extinction',
  heat_low:            'Frozen Stasis',
  heat_high:           'Thermal Runaway',
  gravity_low:         'Atmospheric Drift',
  gravity_high:        'Gravitational Crushing',
  starDistance_low:    'Frozen Dark',
  starDistance_high:   'Solar Scorching',
  soil_low:            'Starvation Collapse',
  natural:             'Natural Death'
}

export function checkConditions(sliders) {
  for (const [key, [min, max]] of Object.entries(SAFE_ZONES)) {
    const val = sliders[key]
    if (val < min) return { alive: false, failureCause: `${key}_low` }
    if (val > max) return { alive: false, failureCause: `${key}_high` }
  }
  return { alive: true, failureCause: null }
}

export function getSliderHealth(sliders) {
  // Returns 0.0–1.0 per slider
  const scores = {}
  for (const [key, [min, max]] of Object.entries(SAFE_ZONES)) {
    const val = sliders[key]
    const mid = (min + max) / 2
    const halfRange = (max - min) / 2
    const dist = Math.abs(val - mid)
    scores[key] = Math.max(0, 1 - dist / (halfRange * 1.5))
  }
  return scores
}

export function getLifeProbability(sliders) {
  const scores = getSliderHealth(sliders)
  const avg = Object.values(scores).reduce((s, v) => s + v, 0) / Object.keys(scores).length
  // Any single slider below its safe zone zeros the chance
  for (const [key, [min, max]] of Object.entries(SAFE_ZONES)) {
    if (sliders[key] < min || sliders[key] > max) {
      return Math.round(avg * 40) // hard cap when outside any zone
    }
  }
  return Math.round(avg * 100)
}

export function getFailurePostmortem(cause, sliders, myths, playerName) {
  const name = FAILURE_NAMES[cause] ?? FAILURE_NAMES.natural
  const descriptions = {
    atmosphere_low:    'The air thinned until there was nothing left to breathe. The last settlement burned its fires for warmth that never came.',
    atmosphere_high:   'Pressure built until lungs could not expand. The civilization drowned in its own sky.',
    water_low:         'The rivers ran dry. Crops failed. The last survivor walked toward a horizon that never changed.',
    water_high:        'The waters rose until there was no land. The people built boats, then rafts, then nothing.',
    heat_low:          'The cold came gradually, then all at once. The final myths speak of a sun that forgot to rise.',
    heat_high:         'The temperature climbed past endurance. The last record found was a single word: why.',
    gravity_low:       'With nothing to hold them, the settlements scattered. People drifted. Communities dissolved.',
    gravity_high:      'Nothing could grow tall. The weight crushed ambition before it could root.',
    starDistance_low:  'Without enough light, the growing season shortened year by year. Darkness won.',
    starDistance_high: 'The radiation stripped the surface bare. What the fires didn\'t take, the light did.',
    soil_low:          'The land gave nothing. Hunger preceded everything else. The myths stopped when the food did.',
    natural:           'They lived fully and completely. Then they did not.'
  }
  return {
    cause,
    name,
    description: descriptions[cause] ?? descriptions.natural,
    sliders,
    myths: myths ?? [],
    playerName: playerName ?? 'The Unnamed'
  }
}
