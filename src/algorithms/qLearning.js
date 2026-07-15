import { defaultQl } from '../data/defaultParameters'
import { PAYLOADS, TARGETS, WEATHERS } from '../simulation/floodDroneEnvironment'
import { SeededRandom } from '../simulation/seededRandom'

const qKey = (stateKey, action) => `${stateKey}::${action}`
export function bestQAction(qTable, env, state) {
  const stateKey = env.encodeState(state), actions = env.getValidActions(state)
  return actions.reduce((best, action) => (qTable.get(qKey(stateKey, action)) || 0) > (qTable.get(qKey(stateKey, best)) || 0) ? action : best, actions[0] || 'WAIT')
}

export function runQLearning(environment, options = {}) {
  const p = { ...defaultQl, ...options }
  if (!(p.epsilon >= 0 && p.epsilon <= 1) || !(p.gamma >= 0 && p.gamma < 1) || !(p.alpha > 0 && p.alpha <= 1)) throw new Error('Alpha, gamma, or epsilon is invalid.')
  const rng = new SeededRandom(p.seed), qTable = new Map(), history = [], started = performance.now()
  let epsilon = p.epsilon, criticalSuccess = 0, criticalEpisodes = 0
  for (let episode = 1; episode <= p.episodes; episode++) {
    const planned = p.missionPlan?.length ? rng.pick(p.missionPlan) : null
    const target = planned?.target || rng.pick(TARGETS), payload = planned?.payload || rng.pick(PAYLOADS), weather = rng.pick(WEATHERS)
    let state = environment.reset({ target, payload, weather }), rewardTotal = 0, success = false, batteryFailure = false, severeMoves = 0, step = 0
    const criticalMission = environment.villages.find((village) => target.startsWith(village.id))?.urgency === 'Critical' && payload !== 'FOOD'
    if (criticalMission) criticalEpisodes++
    for (step = 1; step <= p.maxSteps; step++) {
      const actions = environment.getValidActions(state), stateKey = environment.encodeState(state)
      const action = rng.next() < epsilon ? rng.pick(actions) : bestQAction(qTable, environment, state)
      if (state.weather === 'SEVERE' && action.startsWith('GO_')) severeMoves++
      const result = environment.step(action), nextActions = environment.getValidActions(result.state)
      const maxNext = result.done ? 0 : Math.max(0, ...nextActions.map((a) => qTable.get(qKey(environment.encodeState(result.state), a)) || 0))
      const key = qKey(stateKey, action), old = qTable.get(key) || 0
      qTable.set(key, old + p.alpha * (result.reward + p.gamma * maxNext - old))
      rewardTotal += result.reward; state = result.state
      if (result.done) { success = Boolean(state.success); batteryFailure = result.event === 'battery-failure'; break }
    }
    if (success && criticalMission) criticalSuccess++
    history.push({ episode, reward: rewardTotal, steps: step, success: success ? 1 : 0, epsilon, batteryFailure: batteryFailure ? 1 : 0, severeMoves })
    epsilon = Math.max(p.minEpsilon, epsilon * p.epsilonDecay)
  }
  const avg = (key) => history.reduce((s, h) => s + h[key], 0) / history.length
  return { qTable, history, finalEpsilon: epsilon, episodes: p.episodes, runtime: performance.now() - started, successRate: avg('success') * 100, averageReward: avg('reward'), averageSteps: avg('steps'), batteryFailureRate: avg('batteryFailure') * 100, criticalSuccessRate: criticalEpisodes ? criticalSuccess / criticalEpisodes * 100 : 0, parameters: p }
}
