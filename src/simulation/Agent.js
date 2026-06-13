import { NameGen } from '../utils/NameGen.js'
import { rng } from '../utils/Random.js'

let _nextId = 0
function generateId() { return ++_nextId }

export class Agent {
  constructor(x, y, settlement) {
    this.id = generateId()
    this.name = NameGen.humanName()
    this.x = x
    this.y = y
    this.settlement = settlement
    this.role = 'settler'     // settler | builder | priest | wanderer
    this.age = 0
    this.beliefs = []
    this.isAlive = true
    this.isFollowed = false
  }

  tick(eventBus) {
    if (!this.isAlive) return
    this.age++
    if (this.age > 80) {
      this._die(eventBus)
      return
    }
    this._wander()
    if (this.isFollowed) this._emitLifeEvent(eventBus)
  }

  _die(eventBus) {
    this.isAlive = false
    if (this.isFollowed) {
      eventBus.emit('agent:death', { agent: this, text: `${this.name} died at age ${this.age}.` })
    }
  }

  _wander() {
    if (this.role === 'wanderer') {
      this.x += rng.float(-1, 1)
      this.y += rng.float(-1, 1)
    } else {
      this.x += rng.float(-0.2, 0.2)
      this.y += rng.float(-0.2, 0.2)
    }
    // Clamp to planet bounds (0–100 coordinate space)
    this.x = Math.max(1, Math.min(99, this.x))
    this.y = Math.max(1, Math.min(99, this.y))
  }

  _emitLifeEvent(eventBus) {
    const milestones = [20, 40, 60, 80]
    if (milestones.includes(this.age)) {
      const texts = {
        20: `${this.name} has come of age.`,
        40: `${this.name} is now an elder, still alive.`,
        60: `${this.name} is very old. The young ask questions they cannot answer.`,
        80: `${this.name} has reached the end. Their story closes here.`
      }
      eventBus.emit('agent:milestone', { agent: this, text: texts[this.age] })
    }
  }
}
