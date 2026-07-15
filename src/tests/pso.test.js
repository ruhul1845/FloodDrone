import { describe, expect, it } from 'vitest'
import { calculateLoad, evaluateAllocation, runPSO } from '../algorithms/pso'
import { defaultResources } from '../data/defaultParameters'
import { chattogramFloodLocalities } from '../simulation/dynamicVillageNetwork'

describe('Particle Swarm Optimization', () => {
  it('weights food and medicine as 0.9 and 0.1 when calculating load', () => { expect(calculateLoad(10, 10)).toBe(10); expect(calculateLoad(20, 5)).toBe(18.5) })
  const run = () => runPSO({ swarmSize: 10, iterations: 15, seed: 11 })
  it('never exceeds available resources', () => { const r=run(); expect(r.food.reduce((a,b)=>a+b,0)).toBeLessThanOrEqual(defaultResources.food); expect(r.medicine.reduce((a,b)=>a+b,0)).toBeLessThanOrEqual(defaultResources.medicine) })
  it('uses only food and medicine in each particle', () => { expect(run().vector).toHaveLength(2 * 4) })
  it('reports battery health as a percentage', () => { expect(runPSO({ batteryHealth: 85, resources: { batteryHealth: 85 } }).batteryHealth).toBe(85) })
  it('penalizes energy more when battery health is low', () => { const vector=[80,50,100,60,10,5,20,8]; const healthy=evaluateAllocation(vector,undefined,{...defaultResources,batteryHealth:100}); const degraded=evaluateAllocation(vector,undefined,{...defaultResources,batteryHealth:40}); expect(degraded.batteryRisk).toBeGreaterThan(healthy.batteryRisk); expect(degraded.cost).toBeGreaterThan(healthy.cost) })
  it('is reproducible with a fixed seed', () => { expect(run().vector).toEqual(run().vector) })
  it('records a non-decreasing best fitness', () => { const h=run().history; h.slice(1).forEach((row,i)=>expect(row.bestFitness).toBeGreaterThanOrEqual(h[i].bestFitness)) })
  it('optimizes a dynamic eight-village particle', () => { const r=runPSO({swarmSize:8,iterations:8,seed:3,villages:chattogramFloodLocalities});expect(r.vector).toHaveLength(16);expect(r.food).toHaveLength(8);expect(r.food.reduce((a,b)=>a+b,0)).toBeLessThanOrEqual(defaultResources.food);expect(r.medicine.reduce((a,b)=>a+b,0)).toBeLessThanOrEqual(defaultResources.medicine) })
})
