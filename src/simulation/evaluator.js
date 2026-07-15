import { SeededRandom } from './seededRandom'
import { PAYLOADS, TARGETS, WEATHERS } from './floodDroneEnvironment'

export function evaluatePolicy(environment, policyFn, { episodes = 200, seed = 99, missionPlan = [] } = {}) {
  const rng = new SeededRandom(seed), rows = [], started = performance.now()
  for (let i = 0; i < episodes; i++) {
    const planned = missionPlan.length ? rng.pick(missionPlan) : null
    const target = planned?.target || rng.pick(TARGETS), payload = planned?.payload || rng.pick(PAYLOADS), weather = rng.pick(WEATHERS)
    let state = environment.reset({ target, payload, weather }), totalReward = 0, invalid = 0, severe = 0, step = 0
    for (step = 1; step <= environment.maxSteps; step++) {
      const action = policyFn(state)
      if (state.weather === 'SEVERE' && action.startsWith('GO_')) severe++
      if (!environment.getValidActions(state).includes(action)) invalid++
      const result = environment.step(action); totalReward += result.reward; state = result.state
      if (result.done) break
    }
    const critical = environment.villages.find((village) => target.startsWith(village.id))?.urgency === 'Critical' && payload !== 'FOOD'
    rows.push({ totalReward, success: state.success ? 1 : 0, criticalSuccess: state.success && critical ? 1 : 0, critical, foodSuccess: state.success && payload === 'FOOD' ? 1 : 0, food: payload === 'FOOD', steps: step, battery: state.battery, batteryFailure: state.battery === 0 && !state.success ? 1 : 0, invalid, severe })
  }
  const avg = (key) => rows.reduce((s, r) => s + Number(r[key]), 0) / rows.length
  const conditional = (num, den) => { const d = rows.filter((r) => r[den]); return d.length ? d.reduce((s, r) => s + r[num], 0) / d.length * 100 : 0 }
  return { averageReward: avg('totalReward'), successRate: avg('success') * 100, criticalSuccessRate: conditional('criticalSuccess', 'critical'), foodSuccessRate: conditional('foodSuccess', 'food'), averageSteps: avg('steps'), averageBattery: avg('battery'), batteryFailureRate: avg('batteryFailure') * 100, invalidActions: rows.reduce((s, r) => s + r.invalid, 0), severeMoves: rows.reduce((s, r) => s + r.severe, 0), runtime: performance.now() - started }
}
