import { describe, expect, it } from 'vitest'
import { FloodDroneEnvironment } from '../simulation/floodDroneEnvironment'
import { chooseSafeMissionAction } from '../simulation/manualPolicy'
import { buildVillageScenario } from '../simulation/dynamicVillageNetwork'

function runMission({ seed = 7, target = 'V3-A1', battery = 18 } = {}) {
  const env = new FloodDroneEnvironment({ seed, maxBattery: battery, maxSteps: 30 })
  let state = env.reset({ target, payload: 'BOTH', weather: 'SAFE' })
  const trace = []
  while (!state.terminal) {
    const action = chooseSafeMissionAction(state)
    const result = env.step(action)
    trace.push({ from: state.location, action, to: result.state.location, weather: state.weather, battery: result.state.battery })
    state = result.state
  }
  return { state, trace }
}

describe('manual mission controller', () => {
  it('reaches V3-A1 with battery capacity 18', () => { const run=runMission(); expect(run.state.success, JSON.stringify(run.trace)).toBe(true); expect(run.state.location).toBe('V3-A1') })
  it('reaches each village area with the default deterministic seed', () => { for (const target of ['V1-A2','V2-A3','V3-A4','V4-A1']) expect(runMission({target}).state.success).toBe(true) })
  it('supports a generated eighth village and its areas', () => { const scenario=buildVillageScenario(8),env=new FloodDroneEnvironment({seed:7,maxBattery:18,villages:scenario.villages,networkGraph:scenario.graph,targets:scenario.targets});let state=env.reset({target:'V8-A4'});while(!state.terminal){const result=env.step(chooseSafeMissionAction(state,scenario.graph));state=result.state}expect(state.success).toBe(true);expect(state.location).toBe('V8-A4') })
})
