import { rng } from './Random.js'

const SYLLABLES = [
  'al','var','sel','mor','fen','tar','kael','dun','ori','ves','thal','ren','sev','aen','mir',
  'cor','bel','thra','wyn','vol','gar','lyr','nim','oss','pyr','quel','rho','syl','tor','umbr',
  'dra','esh','fal','grim','hesh','ith','jor','kor','lun','myr'
]
const SUFFIXES_PERSON = ['of the', 'from', 'the', 'of']
const SUFFIXES_PLACE = ['Crossing','Hold','Reach','Fen','Hollow','Shore','Rise','Watch','Moor','Gate','Spire','Deep','Vale','Marsh','Roost','Ford','Barrow','Steppe']
const PLACE_ADJ = ['High','Low','Old','New','Far','Grey','Iron','Salt','Ash','Pale','Broken','Last']
const RELIGION_PREFIXES = ['The','Order of','Faith of','Cult of','Brotherhood of','The Way of','Disciples of','Children of','Covenant of','The Quiet']
const RELIGION_SUBJECTS = ['Sky','Fire','Absence','Watcher','Void','Flame','Rain','Edge','Ash','Provider','Silence','Eye','Wall','Maker','Dreaming','Forgotten','Above','Pattern']
const PERSON_TITLES = ['the Elder','the Younger','the Doubter','the Faithful','the Wanderer','the Blind','the Bright','the Quiet','the Bold','the Lost']

export const NameGen = {
  syllable() { return rng.pick(SYLLABLES) },

  _root() {
    const root = this.syllable() + this.syllable()
    return root.charAt(0).toUpperCase() + root.slice(1)
  },

  humanName() {
    const first = this._root()
    const r = rng.next()
    // Several name shapes so people don't all read the same
    if (r < 0.45) return first                                          // "Kaelvar"
    if (r < 0.70) return `${first} ${rng.pick(PERSON_TITLES)}`           // "Kaelvar the Doubter"
    if (r < 0.88) return `${first} of ${this.settlementName()}`         // "Kaelvar of New Mir"
    return `${first} ${rng.pick(SUFFIXES_PERSON)} ${this._root()}`      // older-style patronymic
  },

  settlementName() {
    const root = this._root()
    const r = rng.next()
    if (r < 0.45) return `${root}'s ${rng.pick(SUFFIXES_PLACE)}`        // "Mir's Hold" (classic)
    if (r < 0.62) return `${rng.pick(PLACE_ADJ)} ${root}`              // "Iron Mir"
    if (r < 0.75) return root                                          // "Mir" (bare)
    if (r < 0.88) return `${root}${this.syllable()}`                   // "Mirfen" (compound)
    return `${rng.pick(['New','Old','Upper','Lower'])} ${root}`        // "New Mir"
  },

  // A settlement that has fallen — used for ruins / dark-age flavor
  ruinName(baseName) {
    if (!baseName) baseName = this.settlementName()
    return rng.pick([
      `the ruins of ${baseName}`,
      `what was once ${baseName}`,
      `the bones of ${baseName}`,
      `${baseName}, now empty`
    ])
  },

  religionName() {
    return `${rng.pick(RELIGION_PREFIXES)} ${rng.pick(RELIGION_SUBJECTS)}`
  },

  // A schism sect derived from a parent faith name
  sectName(parentName) {
    const subj = rng.pick(RELIGION_SUBJECTS)
    return rng.pick([
      `the Reformed ${subj}`,
      `the True ${subj}`,
      `the ${rng.pick(['Elder','Lesser','Outer','Hidden'])} ${subj}`,
      `${rng.pick(RELIGION_PREFIXES)} ${subj}`
    ])
  },

  mythName(interventionType) {
    const METEOR = ['The Screaming Sky','The Falling Mountain','The Fire Above','The Sky Break','The Ash Day','The Burning Year','The Day the Sky Fell']
    const DROUGHT = ['The Great Dry','The Empty River','The Silence of Rain','The Thirst Year','The Long Cracking','The Years of Dust']
    const BLESS = ["The Generous Season","The Full Year","The Provider's Touch","The Golden Harvest","The Year of Plenty","The Soft Rains"]
    const GENERIC = ['The Watching','The Absence','The Long Wait','The Stillness','The Quiet Above','The Unanswered']

    if (interventionType === 'meteor') return rng.pick(METEOR)
    if (interventionType === 'drought') return rng.pick(DROUGHT)
    if (interventionType === 'bless') return rng.pick(BLESS)
    return rng.pick(GENERIC)
  }
}
