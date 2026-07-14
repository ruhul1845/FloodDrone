import { defaultVillages } from '../data/villages'
import { areaTargets, network, targetVillage } from '../data/network'
import { SeededRandom } from './seededRandom'

export const LOCATIONS = Object.keys(network)
export const PAYLOADS = ['FOOD', 'MEDICINE', 'BOTH']
export const TARGETS = areaTargets
export const WEATHERS = ['SAFE', 'WINDY', 'SEVERE']
export const ACTIONS = ['GO_H', 'GO_C', 'GO_C2', 'GO_J1', 'GO_J2', 'GO_V1', 'GO_V2', 'GO_V3', 'GO_V4', 'DELIVER', 'RECHARGE', 'WAIT']

export const WEATHER_TRANSITIONS = {
  SAFE: { SAFE: 0.7, WINDY: 0.25, SEVERE: 0.05 },
  WINDY: { SAFE: 0.3, WINDY: 0.5, SEVERE: 0.2 },
  SEVERE: { SAFE: 0.1, WINDY: 0.35, SEVERE: 0.55 },
}

const movement = { SAFE: { success: 0.95, stay: 0.05, emergency: 0 }, WINDY: { success: 0.75, stay: 0.2, emergency: 0.05 }, SEVERE: { success: 0.4, stay: 0.4, emergency: 0.2 } }

export class FloodDroneEnvironment {
  constructor({ villages = defaultVillages, seed = 42, weatherTransitions = WEATHER_TRANSITIONS, maxSteps = 30, maxBattery = 3, networkGraph = network, targets = areaTargets } = {}) {
    this.villages = villages
    this.weatherTransitions = weatherTransitions
    this.maxSteps = maxSteps
    this.maxBattery = Math.max(1, Math.floor(Number(maxBattery) || 3))
    this.network = networkGraph
    this.targets = targets
    this.rng = new SeededRandom(seed)
    this.reset()
  }

  encodeState(s) { return `${s.location}|${s.battery}|${s.payload}|${s.target}|${s.weather}` }
  decodeState(key) { const [location, battery, payload, target, weather] = key.split('|'); return { location, battery: Number(battery), payload, target, weather } }
  isTerminal(s) { return Boolean(s.terminal) }

  getAllStates() {
    const states = []
    for (const location of Object.keys(this.network)) for (let battery = 0; battery <= this.maxBattery; battery++) for (const payload of PAYLOADS) for (const target of this.targets) for (const weather of WEATHERS) states.push({ location, battery, payload, target, weather })
    return states
  }

  getValidActions(s) {
    if (s.terminal) return []
    const moves = (this.network[s.location] || []).map((n) => `GO_${n}`)
    return [...moves, 'DELIVER', 'RECHARGE', 'WAIT']
  }

  getReward(state, action, nextState, event = '') {
    if (event === 'invalid') return -20
    if (event === 'battery-failure') return -120
    if (event === 'timeout') return -180
    if (action.startsWith('GO_')) return -2 - (state.weather === 'WINDY' ? 8 : state.weather === 'SEVERE' ? 25 : 0)
    if (action === 'RECHARGE') return ['C', 'C2'].includes(state.location) && state.battery <= 1 ? 25 : ['C', 'C2'].includes(state.location) ? 2 : -20
    if (action === 'WAIT') return state.weather === 'SAFE' ? -4 : 10
    if (action === 'DELIVER') {
      if (state.location !== targetVillage(state.target)) return -30
      const urgency = this.villages.find((v) => v.id === targetVillage(state.target))?.urgency
      if (state.payload === 'BOTH') return 120 + (urgency === 'Critical' ? 50 : urgency === 'High' ? 25 : 10)
      if (state.payload === 'FOOD') return 40
      return urgency === 'Critical' ? 150 : urgency === 'High' ? 100 : 80
    }
    return 0
  }

  getTransitionOutcomes(state, action) {
    if (state.terminal) return [{ probability: 1, nextState: state, reward: 0 }]
    const destination = action.startsWith('GO_') ? action.slice(3) : null
    const validMove = destination && (this.network[state.location] || []).includes(destination)
    if (destination && !validMove) return [{ probability: 1, nextState: { ...state }, reward: -20, event: 'invalid' }]
    if (action === 'RECHARGE') {
      const valid = ['C', 'C2'].includes(state.location)
      const nextState = { ...state, battery: valid ? this.maxBattery : state.battery }
      return [{ probability: 1, nextState, reward: this.getReward(state, action, nextState) }]
    }
    if (action === 'DELIVER') {
      const success = state.location === targetVillage(state.target)
      const nextState = { ...state, location: success ? state.target : state.location, terminal: success, success }
      return [{ probability: 1, nextState, reward: this.getReward(state, action, nextState) }]
    }
    if (action === 'WAIT') return this.#weatherOutcomes(state, state, action, 1)
    if (!destination) return [{ probability: 1, nextState: state, reward: -20, event: 'invalid' }]

    const m = movement[state.weather]
    const branches = [
      { p: m.success, location: destination, event: 'move' },
      { p: m.stay, location: state.location, event: 'stay' },
    ]
    if (m.emergency) branches.push({ p: m.emergency, location: state.weather === 'SEVERE' ? 'H' : 'H', event: 'emergency' })
    const outcomes = []
    for (const branch of branches) {
      const battery = Math.max(0, state.battery - 1)
      const failed = battery === 0
      const moved = { ...state, location: branch.location, battery, terminal: failed, success: false }
      if (failed) outcomes.push({ probability: branch.p, nextState: moved, reward: -120, event: 'battery-failure' })
      else outcomes.push(...this.#weatherOutcomes(state, moved, action, branch.p))
    }
    return this.#merge(outcomes)
  }

  #weatherOutcomes(original, next, action, branchProbability) {
    return Object.entries(this.weatherTransitions[original.weather]).map(([weather, p]) => {
      const nextState = { ...next, weather }
      return { probability: branchProbability * p, nextState, reward: this.getReward(original, action, nextState), event: action.startsWith('GO_') ? 'move' : 'wait' }
    })
  }

  #merge(outcomes) {
    const merged = new Map()
    for (const o of outcomes) {
      const k = `${this.encodeState(o.nextState)}|${o.nextState.terminal || false}|${o.reward}`
      if (merged.has(k)) merged.get(k).probability += o.probability
      else merged.set(k, { ...o })
    }
    return [...merged.values()]
  }

  sampleTransition(state, action, rng = this.rng) {
    const outcomes = this.getTransitionOutcomes(state, action)
    let roll = rng.next(), cumulative = 0
    for (const outcome of outcomes) { cumulative += outcome.probability; if (roll <= cumulative + 1e-10) return outcome }
    return outcomes.at(-1)
  }

  reset(options = {}) {
    this.steps = 0
    const requestedBattery = options.battery == null ? this.maxBattery : Number(options.battery)
    this.state = { location: 'H', battery: Math.max(1, Math.min(this.maxBattery, requestedBattery)), payload: options.payload || 'BOTH', target: options.target || 'V3-A1', weather: options.weather || 'SAFE' }
    return { ...this.state }
  }

  step(action) {
    const outcome = this.sampleTransition(this.state, action)
    this.steps += 1
    this.state = { ...outcome.nextState }
    if (!this.state.terminal && this.steps >= this.maxSteps) {
      this.state.terminal = true; this.state.success = false
      return { state: { ...this.state }, reward: -180, done: true, event: 'timeout' }
    }
    return { state: { ...this.state }, reward: outcome.reward, done: Boolean(this.state.terminal), event: outcome.event }
  }
}
