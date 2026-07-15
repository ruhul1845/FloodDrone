import { buildVillageScenario } from './dynamicVillageNetwork'

export function sharedEnvironmentOptions(villages, resources, extra = {}) {
  const scenario = buildVillageScenario(villages.length)
  return {
    villages,
    maxBattery:resources.batteryCapacity,
    networkGraph:scenario.graph,
    targets:scenario.targets,
    ...extra,
  }
}
