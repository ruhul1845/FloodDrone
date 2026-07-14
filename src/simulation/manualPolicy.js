import { network, targetVillage } from '../data/network'

const CHARGERS = ['C', 'C2']

export function shortestRoute(from, target, graph = network) {
  const queue = [[from, []]], seen = new Set([from])
  while (queue.length) {
    const [node, path] = queue.shift()
    if (node === target) return path
    for (const next of graph[node] || []) {
      if (!seen.has(next)) {
        seen.add(next)
        queue.push([next, [...path, next]])
      }
    }
  }
  return []
}

function nearestReachableCharger(state, graph) {
  return CHARGERS
    .map((charger) => ({ charger, route: shortestRoute(state.location, charger, graph) }))
    .filter(({ route }) => route.length > 0 && route.length < state.battery)
    .sort((a, b) => a.route.length - b.route.length)[0]
}

export function chooseSafeMissionAction(state, graph = network) {
  const destination = targetVillage(state.target)
  if (state.location === destination) return 'DELIVER'
  if (state.weather !== 'SAFE') return 'WAIT'

  const route = shortestRoute(state.location, destination, graph)
  if (!route.length) return 'WAIT'

  // Reserve one unit so the drone never arrives empty. Recharge only when the
  // actual route cannot be completed with the current battery.
  const requiredBattery = route.length + 1
  if (CHARGERS.includes(state.location) && state.battery < requiredBattery) return 'RECHARGE'
  if (state.battery < requiredBattery) {
    const charger = nearestReachableCharger(state, graph)
    if (charger) return `GO_${charger.route[0]}`
  }
  return `GO_${route[0]}`
}
