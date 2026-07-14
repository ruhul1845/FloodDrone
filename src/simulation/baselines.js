import { evaluateAllocation, repairAllocation } from '../algorithms/pso'
import { defaultVillages } from '../data/villages'
import { defaultResources } from '../data/defaultParameters'
import { SeededRandom } from './seededRandom'

function finalize(name, food, medicine, missions, batteries, villages, resources) {
  return { name, ...evaluateAllocation([...food, ...medicine, ...missions, ...batteries], villages, resources) }
}

export function getBaselines(villages = defaultVillages, resources = defaultResources, seed = 42) {
  const size = villages.length
  const equalFood = villages.map(() => Math.floor(resources.food / size)), equalMed = villages.map(() => Math.floor(resources.medicine / size))
  const equal = finalize('Equal allocation', equalFood, equalMed, villages.map(() => 8), villages.map(() => Math.floor(resources.batteries / size)), villages, resources)
  const rng = new SeededRandom(seed)
  const randomVector = repairAllocation(Array.from({ length: 4 * size }, (_, i) => rng.int(0, i < size ? villages[i].foodDemand : i < 2 * size ? villages[i - size].medicineDemand : i < 3 * size ? 15 : resources.batteries)), villages, resources)
  const random = { name: 'Seeded random', ...evaluateAllocation(randomVector, villages, resources) }
  const order = [...villages.keys()].sort((a, b) => villages[b].vulnerability - villages[a].vulnerability)
  const food = villages.map(() => 0), medicine = villages.map(() => 0), missions = villages.map(() => 0), batteries = villages.map(() => 0)
  let f = resources.food, m = resources.medicine, b = resources.batteries
  order.forEach((i) => { food[i] = Math.min(f, villages[i].foodDemand); f -= food[i]; medicine[i] = Math.min(m, villages[i].medicineDemand); m -= medicine[i]; missions[i] = Math.ceil((food[i] + medicine[i]) / resources.maxPayload); batteries[i] = Math.min(b, Math.max(1, Math.ceil(villages[i].distance / 8))); b -= batteries[i] })
  return [equal, random, finalize('Urgency-first', food, medicine, missions, batteries, villages, resources)]
}
