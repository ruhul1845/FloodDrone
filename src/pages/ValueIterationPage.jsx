import { useState } from 'react'
import { Download, Play } from 'lucide-react'
import { useApp } from '../appStore'
import PageIntro from '../components/common/PageIntro'
import ParameterInput from '../components/common/ParameterInput'
import MetricCard from '../components/common/MetricCard'
import { LinePlot } from '../components/charts/BasicCharts'
import { FloodDroneEnvironment } from '../simulation/floodDroneEnvironment'
import { runValueIteration } from '../algorithms/valueIteration'
import { evaluatePolicy } from '../simulation/evaluator'
import { exportJSON } from '../utils/exportResults'
import { areaTargets } from '../data/network'
import { buildMissionPlan } from '../simulation/allocationMissions'
import { sharedEnvironmentOptions } from '../simulation/sharedEnvironmentOptions'

const uniqueSorted = (values) => [...new Set(values)].sort((a, b) => a - b)

function evaluateViSetting(villages, resources, setting, episodes = 60, missionPlan = []) {
  const env = new FloodDroneEnvironment(sharedEnvironmentOptions(villages,resources,{ seed:42 }))
  const vi = runValueIteration(env, setting)
  const evaluation = evaluatePolicy(
    new FloodDroneEnvironment(sharedEnvironmentOptions(villages,resources,{ seed:99 })),
    (state) => vi.policy.get(env.encodeState(state)) || 'WAIT',
    { episodes, seed:99, missionPlan },
  )
  return { vi, evaluation }
}

function buildSensitivity(villages, resources, params, missionPlan) {
  const gammas = uniqueSorted([0.5, 0.7, 0.8, 0.9, 0.95, params.gamma])
  const thetas = uniqueSorted([0.001, 0.005, 0.01, 0.05, 0.1, params.theta])
  const gammaReward = gammas.map((gamma) => {
    const { evaluation } = evaluateViSetting(villages, resources, { ...params, gamma }, 60, missionPlan)
    return { gamma, totalReward: Number(evaluation.averageReward.toFixed(2)) }
  })
  const thetaIterations = thetas.map((theta) => {
    const env = new FloodDroneEnvironment(sharedEnvironmentOptions(villages,resources,{ seed:42 }))
    const vi = runValueIteration(env, { ...params, theta })
    return { theta, iterations:vi.iterations }
  })
  return { gammaReward, thetaIterations }
}

export default function ValueIterationPage() {
  const { villages, resources, viParams:params, setViParams:setParams, results, saveResult } = useApp()
  const [running,setRunning] = useState(false)
  const [error,setError] = useState('')
  const [selected,setSelected] = useState({ target:'V3-A1', payload:'MEDICINE', weather:'WINDY', battery:resources.batteryCapacity })
  const result = results.vi
  const sensitivity = result?.sensitivity || { gammaReward:[], thetaIterations:[] }
  const missionPlan = buildMissionPlan(results.pso,villages)
  const batteryValues = Array.from({ length:resources.batteryCapacity }, (_, index) => index + 1)

  const run = () => {
    setRunning(true); setError('')
    setTimeout(() => {
      try {
        const { vi, evaluation } = evaluateViSetting(villages, resources, params, 200, missionPlan)
        const sensitivity = buildSensitivity(villages, resources, params, missionPlan)
        saveResult('vi', { ...vi, evaluation, sensitivity, missionPlan, maxBattery:resources.batteryCapacity })
      } catch (e) { setError(e.message) } finally { setRunning(false) }
    }, 20)
  }

  const initial = { location:'H', ...selected, battery:Math.min(selected.battery, resources.batteryCapacity) }
  const key = new FloodDroneEnvironment(sharedEnvironmentOptions(villages,resources)).encodeState(initial)
  const recommended = result?.policy.get(key)

  return <div>
    <PageIntro kicker="Part 2A · Model-based planning" title="Value Iteration Experiment" description="Compute a complete tabular policy and automatically measure how discount factor γ and error tolerance θ affect performance." actions={<><button className="btn-secondary" disabled={!result} onClick={() => exportJSON('value-iteration.json',result)}><Download size={16}/>Export</button><button className="btn-primary" onClick={run} disabled={running}><Play size={16}/>{running ? 'Computing graphs…' : 'Run Value Iteration'}</button></>}/>
    {error && <div className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
    <div className="grid gap-5 xl:grid-cols-[330px_1fr]">
      <aside className="space-y-5">
        <section className="panel-pad"><h2 className="font-bold">Bellman parameters</h2><div className="mt-4 space-y-4"><ParameterInput label="Gamma (γ)" hint="Future reward discount, 0 ≤ γ < 1" type="number" min="0" max="0.999" step="0.01" value={params.gamma} onChange={(e) => setParams({...params,gamma:Number(e.target.value)})}/><ParameterInput label="Theta (θ)" hint="Convergence tolerance" type="number" min="0.000001" step="0.001" value={params.theta} onChange={(e) => setParams({...params,theta:Number(e.target.value)})}/><ParameterInput label="Maximum iterations" type="number" min="1" value={params.maxIterations} onChange={(e) => setParams({...params,maxIterations:Number(e.target.value)})}/></div></section>
        <section className="panel-pad"><h2 className="font-bold">Policy query</h2><div className="mt-4 space-y-3">{[['target',areaTargets],['payload',['FOOD','MEDICINE','BOTH']],['weather',['SAFE','WINDY','SEVERE']],['battery',batteryValues]].map(([field,values]) => <label key={field}><span className="label">{field === 'battery' ? 'Initial battery charge (%)' : `Initial ${field}`}</span><select className="field" value={field === 'battery' ? Math.min(selected[field],resources.batteryCapacity) : selected[field]} onChange={(e) => setSelected({...selected,[field]:field === 'battery' ? Number(e.target.value) : e.target.value})}>{values.map((value) => <option key={value} value={value}>{field === 'battery' ? `${Math.round(value/resources.batteryCapacity*100)}%` : value}</option>)}</select></label>)}</div><div className="mt-4 rounded-xl bg-teal-50 p-4"><span className="text-xs font-semibold text-teal-700">Recommended action</span><strong className="mt-1 block text-xl text-teal-900">{recommended || 'Run experiment'}</strong></div></section>
      </aside>
      <main className="space-y-5">
        {running && <div className="panel-pad text-sm text-slate-600">Computing the main policy and parameter-sensitivity graphs…</div>}
        {missionPlan.length > 0 && <div className="rounded-xl bg-teal-50 p-3 text-xs text-teal-800">Using {missionPlan.length} missions derived from the current PSO allocation.</div>}
        {!result ? <div className="panel-pad flex min-h-72 items-center justify-center text-center text-sm text-slate-500">Configure γ and θ, then run the experiment to generate convergence and sensitivity graphs.</div> : <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Iterations" value={result.iterations}/><MetricCard label="Converged" value={result.converged ? 'Yes' : 'No'} tone={result.converged?'teal':'rose'}/><MetricCard label="Success rate" value={`${result.evaluation.successRate.toFixed(1)}%`} tone="blue"/><MetricCard label="Average reward" value={result.evaluation.averageReward.toFixed(1)} tone="amber"/></section>
          <section className="grid gap-5 lg:grid-cols-2"><GraphPanel title="Discount Factor (γ) vs Total Reward" description="A higher γ gives future rewards more importance and can improve long-term decisions."><LinePlot data={sensitivity.gammaReward} xKey="gamma" lines={[{key:'totalReward',name:'Average total reward'}]}/></GraphPanel><GraphPanel title="Error Tolerance (θ) vs Convergence Iterations" description="A smaller θ demands a more precise solution and usually requires more iterations."><LinePlot data={sensitivity.thetaIterations} xKey="theta" lines={[{key:'iterations',name:'Convergence iterations',color:'#2563eb'}]}/></GraphPanel></section>
          <section className="grid gap-5 lg:grid-cols-2"><GraphPanel title="Bellman convergence" description="Maximum value change after each Value Iteration update."><LinePlot data={result.history} xKey="iteration" lines={[{key:'delta',name:'Maximum delta'}]}/></GraphPanel><div className="panel-pad"><h2 className="font-bold">Evaluation metrics</h2><dl className="mt-4 space-y-3 text-sm">{[['Charge resolution',`${result.maxBattery} levels`],['Initial state value',(result.values.get(key) ?? 0).toFixed(2)],['Runtime',`${result.runtime.toFixed(1)} ms`],['Average steps',result.evaluation.averageSteps.toFixed(2)],['Battery failures',`${result.evaluation.batteryFailureRate.toFixed(1)}%`]].map(([label,value]) => <div key={label} className="flex justify-between border-b border-slate-100 pb-3"><dt className="text-slate-500">{label}</dt><dd className="font-bold">{value}</dd></div>)}</dl></div></section>
        </>}
      </main>
    </div>
  </div>
}

function GraphPanel({ title, description, children }) {
  return <div className="panel-pad"><h2 className="font-bold">{title}</h2><p className="mt-1 min-h-10 text-xs leading-5 text-slate-500">{description}</p>{children}</div>
}
