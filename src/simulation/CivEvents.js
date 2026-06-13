import { rng } from '../utils/Random.js'
import { NameGen } from '../utils/NameGen.js'

// ============================================================================
// The civilization moves through EPOCHS. Each epoch has one-time milestone
// events (the story spine) and recurring ambient events (texture). When an
// epoch's milestones are exhausted and it has lasted long enough, it advances
// to the next — so the civilization keeps moving forward instead of looping.
// ============================================================================

export const EPOCH_ORDER = ['dawn', 'tribes', 'kingdoms', 'enlightenment', 'industrial', 'reckoning']

export function nextEpoch(current) {
  const i = EPOCH_ORDER.indexOf(current)
  return i >= 0 && i < EPOCH_ORDER.length - 1 ? EPOCH_ORDER[i + 1] : null
}

// Player archetype derived from what they actually did. Drives the finale.
export function getArchetype(log) {
  if (!log || !log.length) return 'absent'
  const meteors = log.filter(e => e.type === 'meteor').length
  const droughts = log.filter(e => e.type === 'drought').length
  const blessings = log.filter(e => e.type === 'bless').length
  const total = meteors + droughts + blessings
  if (total === 0) return 'absent'
  if (meteors > 0 && blessings > 0) return 'redeemer'
  if (meteors > blessings + droughts) return 'cruel'
  if (blessings > meteors + droughts) return 'generous'
  return 'capricious'
}

export function getResolution(archetype) {
  return (archetype === 'cruel' || archetype === 'capricious') ? 'collapse' : 'transcend'
}

// ---------------------------------------------------------------------------
// Epoch content. milestones fire once (gated); ambient repeats with variety.
// Text uses {settlement}, {settlement2}, {name}, {count} tokens.
// ---------------------------------------------------------------------------
export const EPOCHS = {
  dawn: {
    techReq: 0, minDwell: 30, maxDwell: 90,
    milestones: [
      { id: 'dawn_fire', gate: p => p.tick >= 4, myth: true,
        text: 'Fire was tamed for the first time. They gathered around it and felt, dimly, that they had been handed something.' },
      { id: 'dawn_words', gate: p => p.tick >= 8, myth: true,
        text: 'The first words passed between two people who were not kin. A thing could now outlive the mouth that spoke it.' },
      { id: 'dawn_dead', gate: p => p.tick >= 14, myth: true,
        text: 'For the first time the dead were buried instead of left behind. Someone had decided they should not simply vanish.' },
      { id: 'dawn_sky', gate: p => p.tick >= 20, myth: false,
        text: 'They began to watch the night sky and argue about the lights. No one guessed correctly. No one ever would.' }
    ],
    ambient: [
      'A long winter thinned the bands. The survivors moved south and did not speak of it.',
      'A child wandered too far from {settlement} and came back with a story no one believed.',
      'They followed the herds and left no mark on the land behind them.',
      'An old one died knowing more than anyone, and took most of it with them.'
    ]
  },

  tribes: {
    techReq: 0, minDwell: 40, maxDwell: 120,
    milestones: [
      { id: 'tribes_settle', gate: p => p.population >= 15, myth: true,
        text: '{settlement} became the first place people refused to leave. They had decided the land was theirs.' },
      { id: 'tribes_totem', gate: p => p.tick - p.epochStartTick >= 12, myth: true,
        text: 'The people of {settlement} carved an eye above their gate — a watcher to watch the watcher. No one could say where the idea came from.' },
      { id: 'tribes_song', gate: p => p.tick - p.epochStartTick >= 24, myth: true,
        text: 'A song was made in {settlement} that everyone already seemed to know. It was about something above, and about being small.' }
    ],
    ambient: [
      'A feud between two families in {settlement} lasted three generations and was forgotten in one.',
      'A storyteller walked from {settlement} to {settlement2}, trading tales for bread.',
      'The harvest in {settlement} was ordinary. The people were, briefly, content.',
      'A river shifted its course and {settlement} moved to follow it.',
      '{settlement} and {settlement2} met without bloodshed and traded. It would not always go so well.'
    ]
  },

  kingdoms: {
    techReq: 1, minDwell: 60, maxDwell: 180,
    milestones: [
      { id: 'kingdoms_king', gate: p => p.population >= 80, myth: true,
        text: '{settlement} crowned its first ruler, who claimed the right came from above. Few dared ask how they knew.' },
      { id: 'kingdoms_temple', gate: (p, t) => t >= 1, myth: true,
        text: 'The first true temple rose in {settlement}, with a roof, a door, and an eye carved over both.' },
      { id: 'kingdoms_war', gate: p => p.settlements.length >= 2, myth: true,
        text: 'The first war between {settlement} and {settlement2} was long, and is remembered as the War of {name}.' },
      { id: 'kingdoms_plague', gate: p => p.population > 50, myth: true,
        text: 'A sickness took half of {settlement}. The priests said the watcher was displeased; the physicians said nothing, and worked.' },
      { id: 'kingdoms_law', gate: (p, t) => t >= 2, myth: false,
        text: '{settlement} wrote down its first laws. The opening line concerned what was owed to the one above.' }
    ],
    ambient: [
      'A trade caravan reached {settlement} carrying goods no one could name.',
      'Two noble houses of {settlement} married, and the feasting lasted a week.',
      'A border skirmish near {settlement2} ended in a treaty no one intended to keep.',
      'A famine year passed. {settlement} survived on stored grain and old prayers.',
      'A heretic in {settlement} claimed the watcher did not exist. He was not seen again.'
    ]
  },

  enlightenment: {
    techReq: 3, minDwell: 70, maxDwell: 200,
    milestones: [
      { id: 'enl_calendar', gate: (p, t) => t >= 3, myth: true,
        text: 'The scholars of {settlement} proved the seasons follow a fixed and perfect cycle. Too perfect, one wrote, to be an accident.' },
      { id: 'enl_anomaly', gate: (p, t) => t >= 3, myth: true,
        text: 'An astronomer in {settlement} documented repeating patterns at the edge of the sky. Her papers were ordered burned. Copies survived.' },
      { id: 'enl_school', gate: (p, t) => t >= 4, myth: true,
        text: 'The Containment School was founded in {settlement}: the world has walls, and something stands outside them. They were called heretics, then read in secret.' },
      { id: 'enl_library', gate: (p, t) => t >= 4, myth: false,
        text: '{settlement} built a great library to hold everything known. Cataloguing it, the scholars saw how much had been arranged for them.' }
    ],
    ambient: [
      'A new instrument let the people of {settlement} see further than ever. They did not always like what they saw.',
      'A public debate in {settlement} on the nature of the sky drew crowds and settled nothing.',
      'A physician in {settlement} cured a disease the priests had called a punishment.',
      'A philosopher of {settlement} asked, in writing, why anything exists at all. The question spread like fire.'
    ]
  },

  industrial: {
    techReq: 4, minDwell: 60, maxDwell: 160,
    milestones: [
      { id: 'ind_engine', gate: (p, t) => t >= 4, myth: false,
        text: 'The first great engines roared to life in {settlement}. The world grew louder, faster, and harder to ignore from outside.' },
      { id: 'ind_weapon', gate: (p, t) => t >= 5, myth: true,
        text: 'A weapon of impossible power was tested beyond {settlement}. For an instant, the people made a light to rival the sky.' },
      { id: 'ind_signal', gate: (p, t) => t >= 5, myth: true, special: 'communication',
        text: 'FROM: The Academy of {settlement}\n\n"If something watches — we are not asking to be saved. We are asking to be told the truth. We only want to know if we are real."' },
      { id: 'ind_screen', gate: (p, t) => t >= 5, myth: true,
        text: 'A theory spread through {settlement} faster than any before it: the sky is a screen, the world a kind of stage. Millions believed; millions mocked the believers. Both kept watching the sky.' },
      { id: 'ind_minds', gate: (p, t) => t >= 5, myth: true,
        text: 'Machines that think were built in {settlement}. The philosophers said: now we know how it feels to be a watcher — and how little it tells you.' }
    ],
    ambient: [
      'A great city rose around {settlement}, brighter at night than the stars above it.',
      'The workers of {settlement} laid down their tools until they were heard.',
      'A new medicine doubled the lives of everyone in {settlement}.',
      'Two powers near {settlement} built weapons they prayed never to use.'
    ]
  },

  // Reckoning has no pooled content — SimEngine drives its staged finale beats.
  reckoning: { techReq: 5, minDwell: 0, maxDwell: 99999, milestones: [], ambient: [] }
}

// Resolve narrative tokens against the current world state.
function fillText(text, planet, s, settlements) {
  const s2 = settlements.find(x => x !== s)
  return text
    .replace(/{settlement2}/g, s2?.name ?? 'a rival settlement')
    .replace(/{settlement}/g, s?.name ?? 'the settlement')
    .replace(/{name}/g, NameGen.mythName())
    .replace(/{count}/g, rng.int(20, 400))
}

// Returns an event object or null. Called by SimEngine every 10 ticks.
export function generateEvent(planet) {
  if (planet.population < 2) return null
  if (planet.epoch === 'reckoning') return null   // SimEngine handles the finale

  const settlements = planet.settlements
  if (!settlements.length) return null
  const s = settlements[rng.int(0, settlements.length - 1)]
  const maxTech = settlements.reduce((m, x) => Math.max(m, x.techLevel), 0)

  const meta = EPOCHS[planet.epoch]
  if (!meta) return null

  // Collect milestones that haven't fired and whose gate passes.
  const ready = meta.milestones.filter(m =>
    !planet.firedMilestones[m.id] && (!m.gate || m.gate(planet, maxTech))
  )

  // Prefer advancing the story (fire a milestone) most of the time.
  if (ready.length && rng.next() < 0.65) {
    const m = rng.pick(ready)
    planet.firedMilestones[m.id] = true
    return {
      type: m.id,
      text: fillText(m.text, planet, s, settlements),
      feedsMyth: !!m.myth,
      special: m.special
    }
  }

  // Otherwise an ambient beat (texture, mostly not myth-worthy).
  const raw = rng.pick(meta.ambient)
  return {
    type: 'ambient',
    text: fillText(raw, planet, s, settlements),
    feedsMyth: false
  }
}
