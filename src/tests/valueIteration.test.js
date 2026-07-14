import { describe, expect, it } from 'vitest'
import { FloodDroneEnvironment } from '../simulation/floodDroneEnvironment'
import { runValueIteration } from '../algorithms/valueIteration'

describe('Value Iteration', () => {
  it('converges and emits valid policies', () => { const env=new FloodDroneEnvironment(); const r=runValueIteration(env,{theta:.05,maxIterations:250}); expect(r.converged).toBe(true); env.getAllStates().filter(s=>s.battery>0).forEach(s=>expect(env.getValidActions(s)).toContain(r.policy.get(env.encodeState(s)))) })
  it('smaller theta requires at least as many iterations', () => { const env=new FloodDroneEnvironment(); const loose=runValueIteration(env,{theta:.1,maxIterations:250}), tight=runValueIteration(env,{theta:.01,maxIterations:250}); expect(tight.iterations).toBeGreaterThanOrEqual(loose.iterations) })
})
