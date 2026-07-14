import { describe, expect, it } from 'vitest'
import { FloodDroneEnvironment } from '../simulation/floodDroneEnvironment'
import { bestQAction, runQLearning } from '../algorithms/qLearning'

describe('Q-Learning', () => {
  const train=()=>runQLearning(new FloodDroneEnvironment({seed:5}),{episodes:80,seed:5,epsilon:.4,minEpsilon:.1,epsilonDecay:.95})
  it('updates a Q-table',()=>expect(train().qTable.size).toBeGreaterThan(0))
  it('is reproducible with a fixed seed',()=>{const a=train(),b=train();expect([...a.qTable]).toEqual([...b.qTable])})
  it('never decays epsilon below its minimum',()=>expect(train().finalEpsilon).toBeGreaterThanOrEqual(.1))
  it('produces an evaluable greedy policy',()=>{const env=new FloodDroneEnvironment(),r=train(),s=env.reset();expect(env.getValidActions(s)).toContain(bestQAction(r.qTable,env,s))})
})
