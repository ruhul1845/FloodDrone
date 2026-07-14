export const defaultResources = { drones: 2, food: 320, medicine: 50, batteries: 8, batteryCapacity: 3, maxPayload: 10, maxRange: 25 }
export const defaultPso = { swarmSize: 40, iterations: 150, inertia: 0.7, c1: 1.5, c2: 1.5, seed: 42 }
export const defaultVi = { gamma: 0.9, theta: 0.001, maxIterations: 1000 }
export const defaultQl = { episodes: 5000, alpha: 0.3, gamma: 0.9, epsilon: 0.3, minEpsilon: 0.02, epsilonDecay: 0.999, maxSteps: 30, seed: 42 }
