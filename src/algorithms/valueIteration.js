import { defaultVi } from '../data/defaultParameters'

export function runValueIteration(environment, options = {}) {
  const params = { ...defaultVi, ...options }
  if (!(params.gamma >= 0 && params.gamma < 1)) throw new Error('Gamma must be between 0 and 1.')
  if (params.theta <= 0) throw new Error('Theta must be positive.')
  const allStates = environment.getAllStates()
  // Areas of one village share navigation, urgency, transitions, and rewards;
  // only the terminal delivery label differs. Solve one area and expand the
  // resulting values/policy to its sibling areas after convergence.
  const states = allStates.filter((state) => !state.target.includes('-A') || state.target.endsWith('-A1'))
  const values = new Map(states.map((s) => [environment.encodeState(s), 0])), policy = new Map(), history = []
  const started = performance.now()
  let converged = false, iteration = 0, delta = Infinity
  for (iteration = 1; iteration <= params.maxIterations; iteration++) {
    delta = 0; const nextValues = new Map(values)
    for (const state of states) {
      const key = environment.encodeState(state)
      if (state.battery === 0) { nextValues.set(key, -120); continue }
      let bestValue = -Infinity, bestAction = 'WAIT'
      for (const action of environment.getValidActions(state)) {
        const q = environment.getTransitionOutcomes(state, action).reduce((sum, o) => sum + o.probability * (o.reward + (o.nextState.terminal ? 0 : params.gamma * (values.get(environment.encodeState(o.nextState)) ?? 0))), 0)
        if (q > bestValue) { bestValue = q; bestAction = action }
      }
      nextValues.set(key, bestValue); policy.set(key, bestAction); delta = Math.max(delta, Math.abs(bestValue - values.get(key)))
    }
    values.clear(); nextValues.forEach((v, k) => values.set(k, v)); history.push({ iteration, delta })
    if (delta < params.theta) { converged = true; break }
  }
  for (const state of allStates) {
    const key = environment.encodeState(state)
    if (values.has(key)) continue
    const representative = { ...state, target: state.target.replace(/-A\d+$/, '-A1') }
    const representativeKey = environment.encodeState(representative)
    values.set(key, values.get(representativeKey))
    if (state.battery > 0) policy.set(key, policy.get(representativeKey))
  }
  return { values, policy, history, iterations: Math.min(iteration, params.maxIterations), finalDelta: delta, converged, runtime: performance.now() - started, parameters: params }
}
