export class SeededRandom {
  constructor(seed = 42) {
    this.state = (Number(seed) >>> 0) || 1
  }

  next() {
    this.state = (1664525 * this.state + 1013904223) >>> 0
    return this.state / 4294967296
  }

  int(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min
  }

  pick(items) {
    return items[Math.floor(this.next() * items.length)]
  }
}

export const createRng = (seed) => new SeededRandom(seed)
