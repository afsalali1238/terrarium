import { NameGen } from '../utils/NameGen.js'
import { rng } from '../utils/Random.js'

export class Religion {
  constructor(mythSource, settlement) {
    this.id = Math.random().toString(36).slice(2)
    this.name = NameGen.religionName()
    this.foundingMyth = mythSource
    this.beliefs = []
    this.settlement = settlement
    this.believers = mythSource?.believers ?? 10
    this.hasSchism = false
    this.schisms = []
  }

  grow(amount) {
    this.believers = Math.min(this.believers + amount, 100000)
  }

  schism(triggerEvent, eventBus) {
    if (this.hasSchism) return null
    this.hasSchism = true
    const splinter = new Religion({ ...this.foundingMyth, believers: Math.floor(this.believers * 0.3) }, this.settlement)
    splinter.name = NameGen.sectName(this.name)
    splinter.beliefs = [`The old ${this.name} was wrong. ${triggerEvent} changed everything.`]
    this.believers = Math.floor(this.believers * 0.7)
    this.schisms.push(splinter)
    return splinter
  }
}

export class ReligionSystem {
  constructor(eventBus) {
    this.religions = []
    this.eventBus = eventBus
  }

  tryFormReligion(myth, settlement) {
    if (!myth || myth.believers < 20) return null
    const existing = this.religions.find(r => r.foundingMyth?.name === myth.name)
    if (existing) {
      existing.grow(5)
      return null
    }
    const religion = new Religion(myth, settlement)
    this.religions.push(religion)
    this.eventBus.emit('religion:formed', { religion })
    return religion
  }

  // Called when an intervention contradicts an existing religion's tone
  checkSchism(interventionType, eventBus) {
    if (this.religions.length === 0) return
    const candidates = this.religions.filter(r => !r.hasSchism && r.believers > 30)
    if (candidates.length === 0) return
    const target = rng.pick(candidates)

    // Bless contradicts destructive religions; drought/meteor contradicts abundance religions
    const contradicts = (
      (interventionType === 'bless' && target.name.match(/void|ash|fire|absence/i)) ||
      (interventionType !== 'bless' && target.name.match(/abundance|provider|generous/i))
    )
    if (!contradicts && rng.next() > 0.2) return

    const splinter = target.schism(`The ${interventionType}`, eventBus)
    if (splinter) {
      this.religions.push(splinter)
      eventBus.emit('myth:schism', { original: target, splinter })
    }
  }

  tick() {
    this.religions.forEach(r => {
      // Slow organic growth
      r.believers += rng.int(0, 3)
    })
  }
}
