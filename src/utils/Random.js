export class Random {
  constructor(seed) {
    this.seed = seed ?? Date.now()
    this._state = this.seed
  }

  next() {
    this._state |= 0
    this._state = this._state + 0x6D2B79F5 | 0
    let t = Math.imul(this._state ^ this._state >>> 15, 1 | this._state)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }

  int(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min
  }

  pick(arr) {
    return arr[this.int(0, arr.length - 1)]
  }

  float(min, max) {
    return min + this.next() * (max - min)
  }
}

export let rng = new Random()

export function reseedRng(seed) {
  rng = new Random(seed)
}
