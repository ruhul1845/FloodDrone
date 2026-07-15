import { SeededRandom } from '../simulation/seededRandom'
import { defaultPso, defaultResources } from '../data/defaultParameters'
import { defaultVillages } from '../data/villages'

const roundNonNegative = (n) => Math.max(0, Math.round(n))
export const calculateLoad = (food, medicine) => 0.9 * food + 0.1 * medicine

function capGroup(values, start, length, cap) {
  let total = values.slice(start, start + length).reduce((a, b) => a + b, 0)
  while (total > cap) {
    const index = values.slice(start, start + length).reduce((best, value, i, arr) => value > arr[best] ? i : best, 0) + start
    values[index] -= 1; total -= 1
  }
}

export function repairAllocation(position, villages = defaultVillages, resources = defaultResources) {
  const size = villages.length
  const x = position.slice(0, 2 * size).map(roundNonNegative)
  for (let i = 0; i < size; i++) {
    x[i] = Math.min(x[i], villages[i].foodDemand)
    x[size + i] = Math.min(x[size + i], villages[i].medicineDemand)
  }
  capGroup(x, 0, size, resources.food); capGroup(x, size, size, resources.medicine)
  const critical = villages.findIndex((v) => v.urgency === 'Critical')
  if (critical >= 0 && resources.medicine > 0 && x[size + critical] === 0) {
    const donor = [...villages.keys()].find((i) => i !== critical && x[size + i] > 1)
    if (donor !== undefined) x[size + donor] -= 1
    x[size + critical] = 1; capGroup(x, size, size, resources.medicine)
  }
  return x
}

export function evaluateAllocation(vector, villages = defaultVillages, resources = defaultResources) {
  const size = villages.length
  const x = repairAllocation(vector, villages, resources)
  const food = x.slice(0, size), medicine = x.slice(size, 2 * size)
  const missions = villages.map((_, i) => Math.ceil(calculateLoad(food[i], medicine[i]) / resources.maxPayload))
  let unmetFood = 0, unmetMedicine = 0, criticalUnmet = 0, nonCriticalUnmet = 0, deliveryTime = 0, capacityViolations = 0
  const satisfaction = villages.map((v, i) => {
    const uf = Math.max(0, v.foodDemand - food[i]), um = Math.max(0, v.medicineDemand - medicine[i])
    unmetFood += uf; unmetMedicine += um
    if (v.urgency === 'Critical') criticalUnmet += um; else nonCriticalUnmet += um
    const neededMissions = Math.ceil(calculateLoad(food[i], medicine[i]) / resources.maxPayload)
    capacityViolations += Math.max(0, neededMissions - missions[i])
    deliveryTime += missions[i] * v.distance * 2 / 35
    return 0.6 * Math.min(1, food[i] / v.foodDemand) + 0.4 * Math.min(1, medicine[i] / v.medicineDemand)
  })
  const energy = missions.reduce((sum, m, i) => sum + m * villages[i].distance * 0.18, 0)
  const batteryHealth = Math.max(0, Math.min(100, Number(resources.batteryHealth) || 0))
  const batteryRisk = energy * (1 - batteryHealth / 100)
  const fairnessGap = Math.max(...satisfaction) - Math.min(...satisfaction)
  const cost = 100 * criticalUnmet + 40 * nonCriticalUnmet + 10 * unmetFood + 5 * deliveryTime + 3 * energy + 20 * batteryRisk + 100 * capacityViolations + 30 * fairnessGap
  return {
    vector: x, food, medicine, missions, batteryHealth, batteryRisk, cost, fitness: -cost, unmetFood, unmetMedicine,
    fairnessScore: (1 - fairnessGap) * 100, satisfaction: satisfaction.map((v) => v * 100), energy,
    deliveryTime, foodSatisfaction: (1 - unmetFood / villages.reduce((s, v) => s + v.foodDemand, 0)) * 100,
    medicineSatisfaction: (1 - unmetMedicine / villages.reduce((s, v) => s + v.medicineDemand, 0)) * 100,
    criticalCoverage: (() => { const critical = villages.filter((v) => v.urgency === 'Critical'); const demand = critical.reduce((s, v) => s + v.medicineDemand, 0); const allocated = critical.reduce((s, v) => s + medicine[villages.indexOf(v)], 0); return demand ? Math.min(100, allocated / demand * 100) : 100 })(),
  }
}

export function runPSO(options = {}) {
  const params = { ...defaultPso, ...options }
  const villages = options.villages || defaultVillages, resources = { ...defaultResources, ...options.resources }
  if (params.swarmSize < 2 || params.iterations < 1) throw new Error('Swarm size must be at least 2 and iterations must be positive.')
  const rng = new SeededRandom(params.seed)
  const max = [...villages.map((v) => v.foodDemand), ...villages.map((v) => v.medicineDemand)]
  const particles = Array.from({ length: params.swarmSize }, () => {
    const position = max.map((m) => rng.next() * m), velocity = max.map(() => rng.next() * 2 - 1)
    const score = evaluateAllocation(position, villages, resources)
    return { position, velocity, bestPosition: [...position], bestFitness: score.fitness }
  })
  let global = particles.reduce((a, p) => p.bestFitness > a.bestFitness ? p : a)
  let bestPosition = [...global.bestPosition], bestFitness = global.bestFitness
  const history = []
  for (let iteration = 1; iteration <= params.iterations; iteration++) {
    let sum = 0
    for (const p of particles) {
      p.velocity = p.velocity.map((v, d) => params.inertia * v + params.c1 * rng.next() * (p.bestPosition[d] - p.position[d]) + params.c2 * rng.next() * (bestPosition[d] - p.position[d]))
      p.position = p.position.map((x, d) => Math.max(0, Math.min(max[d], x + p.velocity[d])))
      const score = evaluateAllocation(p.position, villages, resources); sum += score.fitness
      if (score.fitness > p.bestFitness) { p.bestFitness = score.fitness; p.bestPosition = [...p.position] }
      if (score.fitness > bestFitness) { bestFitness = score.fitness; bestPosition = [...p.position] }
    }
    history.push({ iteration, bestFitness, averageFitness: sum / particles.length })
  }
  return { ...evaluateAllocation(bestPosition, villages, resources), history, parameters: params }
}
