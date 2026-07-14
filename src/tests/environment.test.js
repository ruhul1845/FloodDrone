import { describe, expect, it } from 'vitest'
import { FloodDroneEnvironment } from '../simulation/floodDroneEnvironment'

describe('shared FloodDroneEnvironment', () => {
  it('returns transition probabilities summing to one', () => { const env=new FloodDroneEnvironment(); const s=env.reset({weather:'WINDY'}); const total=env.getTransitionOutcomes(s,'GO_J1').reduce((a,o)=>a+o.probability,0); expect(total).toBeCloseTo(1,8) })
  it('only recharges at C', () => { const env=new FloodDroneEnvironment(); const s={location:'H',battery:1,payload:'FOOD',target:'V1',weather:'SAFE'}; const o=env.getTransitionOutcomes(s,'RECHARGE')[0]; expect(o.nextState.battery).toBe(1); expect(o.reward).toBeLessThan(0) })
  it('uses a configurable maximum battery', () => { const env=new FloodDroneEnvironment({maxBattery:8}); expect(env.reset().battery).toBe(8); const s={location:'C2',battery:1,payload:'FOOD',target:'V4',weather:'SAFE'}; expect(env.getTransitionOutcomes(s,'RECHARGE')[0].nextState.battery).toBe(8) })
  it('penalizes invalid movement', () => { const env=new FloodDroneEnvironment(); const o=env.getTransitionOutcomes(env.reset(),'GO_V4')[0]; expect(o.reward).toBe(-20); expect(o.nextState.location).toBe('H') })
  it('terminates successful delivery', () => { const env=new FloodDroneEnvironment(); const s={location:'V3',battery:2,payload:'MEDICINE',target:'V3',weather:'SAFE'}; const o=env.getTransitionOutcomes(s,'DELIVER')[0]; expect(o.nextState.terminal).toBe(true); expect(o.nextState.success).toBe(true) })
  it('finishes delivery on the selected village area', () => { const env=new FloodDroneEnvironment(); const s={location:'V3',battery:2,payload:'MEDICINE',target:'V3-A2',weather:'SAFE'}; const o=env.getTransitionOutcomes(s,'DELIVER')[0]; expect(o.nextState.location).toBe('V3-A2'); expect(o.nextState.success).toBe(true) })
  it('terminates battery failure', () => { const env=new FloodDroneEnvironment(); const s={location:'H',battery:1,payload:'FOOD',target:'V1',weather:'SAFE'}; expect(env.getTransitionOutcomes(s,'GO_J1').every(o=>o.nextState.terminal)).toBe(true) })
})
