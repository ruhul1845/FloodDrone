import { evaluateAllocation, repairAllocation } from '../algorithms/pso'
import { defaultVillages } from '../data/villages'
import { defaultResources } from '../data/defaultParameters'
import { SeededRandom } from './seededRandom'

function finalize(name, food, medicine, villages, resources) {
  return { name, ...evaluateAllocation([...food, ...medicine], villages, resources) }
}

export function getBaselines(villages = defaultVillages, resources = defaultResources, seed = 42) {
  const size = villages.length
  const equalFood = villages.map(() => Math.floor(resources.food / size)), equalMed = villages.map(() => Math.floor(resources.medicine / size))
  const equal = finalize('Equal allocation', equalFood, equalMed, villages, resources)
  const rng = new SeededRandom(seed)
  const randomVector = repairAllocation(Array.from({ length: 2 * size }, (_, i) => rng.int(0, i < size ? villages[i].foodDemand : villages[i - size].medicineDemand)), villages, resources)
  const random = { name: 'Seeded random', ...evaluateAllocation(randomVector, villages, resources) }
  const order = [...villages.keys()].sort((a, b) => villages[b].vulnerability - villages[a].vulnerability)
  const food = villages.map(() => 0), medicine = villages.map(() => 0)
  let f = resources.food, m = resources.medicine
  order.forEach((i) => { food[i] = Math.min(f, villages[i].foodDemand); f -= food[i]; medicine[i] = Math.min(m, villages[i].medicineDemand); m -= medicine[i] })
  return [equal, random, finalize('Urgency-first', food, medicine, villages, resources)]
}
