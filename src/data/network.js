export const network = {
  H: ['C', 'J1'], C: ['H', 'J2'], J1: ['H', 'V1', 'V2', 'J2', 'C2'],
  J2: ['C', 'C2', 'J1', 'V3', 'V4'], C2: ['J1', 'J2'],
  V1: ['J1'], V2: ['J1'], V3: ['J2'], V4: ['J2'],
}

export const nodeMeta = {
  H: { label: 'Relief Hub', x: 10, y: 50, kind: 'hub' }, C: { label: 'Charging 1', x: 31, y: 18, kind: 'charge' },
  J1: { label: 'Junction 1', x: 34, y: 70, kind: 'junction' }, J2: { label: 'Junction 2', x: 60, y: 43, kind: 'junction' },
  C2: { label: 'Charging 2', x: 53, y: 64, kind: 'charge' },
  V1: { label: 'Village 1', x: 56, y: 82, kind: 'village' }, V2: { label: 'Village 2', x: 77, y: 90, kind: 'village' },
  V3: { label: 'Village 3', x: 84, y: 20, kind: 'village' }, V4: { label: 'Village 4', x: 92, y: 57, kind: 'village' },
}

export const edges = [['H', 'C'], ['H', 'J1'], ['C', 'J2'], ['J1', 'J2'], ['J1', 'C2'], ['C2', 'J2'], ['J1', 'V1'], ['J1', 'V2'], ['J2', 'V3'], ['J2', 'V4']]

export const villageAreas = {
  V1: [
    { id: 'V1-A1', label: 'V1 · Area 1', x: 43, y: 91 }, { id: 'V1-A2', label: 'V1 · Area 2', x: 51, y: 95 },
    { id: 'V1-A3', label: 'V1 · Area 3', x: 62, y: 94 }, { id: 'V1-A4', label: 'V1 · Area 4', x: 68, y: 82 },
  ],
  V2: [
    { id: 'V2-A1', label: 'V2 · Area 1', x: 69, y: 72 }, { id: 'V2-A2', label: 'V2 · Area 2', x: 78, y: 75 },
    { id: 'V2-A3', label: 'V2 · Area 3', x: 87, y: 81 }, { id: 'V2-A4', label: 'V2 · Area 4', x: 92, y: 92 },
  ],
  V3: [
    { id: 'V3-A1', label: 'V3 · Area 1', x: 70, y: 8 }, { id: 'V3-A2', label: 'V3 · Area 2', x: 82, y: 7 },
    { id: 'V3-A3', label: 'V3 · Area 3', x: 94, y: 10 }, { id: 'V3-A4', label: 'V3 · Area 4', x: 73, y: 27 },
  ],
  V4: [
    { id: 'V4-A1', label: 'V4 · Area 1', x: 79, y: 46 }, { id: 'V4-A2', label: 'V4 · Area 2', x: 80, y: 58 },
    { id: 'V4-A3', label: 'V4 · Area 3', x: 84, y: 68 }, { id: 'V4-A4', label: 'V4 · Area 4', x: 95, y: 72 },
  ],
}

export const areaTargets = Object.values(villageAreas).flat().map((area) => area.id)
export const targetVillage = (target) => target.split('-')[0]
