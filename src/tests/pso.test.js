import { describe, expect, it } from 'vitest'
import { runPSO } from '../algorithms/pso'
import { defaultResources } from '../data/defaultParameters'
import { chattogramFloodLocalities } from '../simulation/dynamicVillageNetwork'

describe('Particle Swarm Optimization', () => {
  const run = () => runPSO({ swarmSize: 10, iterations: 15, seed: 11 })
  it('never exceeds available resources', () => { const r=run(); expect(r.food.reduce((a,b)=>a+b,0)).toBeLessThanOrEqual(defaultResources.food); expect(r.medicine.reduce((a,b)=>a+b,0)).toBeLessThanOrEqual(defaultResources.medicine); expect(r.batteries.reduce((a,b)=>a+b,0)).toBeLessThanOrEqual(defaultResources.batteries) })
  it('is reproducible with a fixed seed', () => { expect(run().vector).toEqual(run().vector) })
  it('records a non-decreasing best fitness', () => { const h=run().history; h.slice(1).forEach((row,i)=>expect(row.bestFitness).toBeGreaterThanOrEqual(h[i].bestFitness)) })
  it('optimizes a dynamic eight-village particle', () => { const r=runPSO({swarmSize:8,iterations:8,seed:3,villages:chattogramFloodLocalities});expect(r.vector).toHaveLength(32);expect(r.food).toHaveLength(8);expect(r.food.reduce((a,b)=>a+b,0)).toBeLessThanOrEqual(defaultResources.food);expect(r.medicine.reduce((a,b)=>a+b,0)).toBeLessThanOrEqual(defaultResources.medicine) })
})
