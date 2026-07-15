import { useRef, useState } from 'react'
import { Download, Play, Square } from 'lucide-react'
import { useApp } from '../appStore'
import PageIntro from '../components/common/PageIntro'
import ParameterInput from '../components/common/ParameterInput'
import MetricCard from '../components/common/MetricCard'
import { LinePlot } from '../components/charts/BasicCharts'
import { FloodDroneEnvironment } from '../simulation/floodDroneEnvironment'
import { bestQAction, runQLearning } from '../algorithms/qLearning'
import { exportJSON } from '../utils/exportResults'
import { areaTargets } from '../data/network'
import { buildMissionPlan } from '../simulation/allocationMissions'
import { sharedEnvironmentOptions } from '../simulation/sharedEnvironmentOptions'

const rolling = (history, window = 50) => history.map((row,index) => {
  const chunk = history.slice(Math.max(0,index-window+1),index+1)
  return { ...row, rollingReward:chunk.reduce((sum,item) => sum + item.reward,0)/chunk.length, rollingSuccess:chunk.reduce((sum,item) => sum + item.success,0)/chunk.length*100 }
})
const uniqueSorted = (values) => [...new Set(values)].sort((a,b) => a-b)
const finalReward = (history) => {
  const count = Math.max(1, Math.min(history.length, Math.max(25, Math.round(history.length * 0.1))))
  return history.slice(-count).reduce((sum,row) => sum + row.reward,0) / count
}

function trainSetting(villages, resources, params, missionPlan = []) {
  const env = new FloodDroneEnvironment(sharedEnvironmentOptions(villages,resources,{ seed:params.seed, maxSteps:params.maxSteps }))
  return runQLearning(env, { ...params, missionPlan })
}

function buildSensitivity(villages, resources, params, missionPlan) {
  const sweepEpisodes = Math.max(100, Math.min(params.episodes, 1000))
  const alphas = uniqueSorted([0.1, 0.3, 0.5, 0.7, 0.9, params.alpha])
  const gammas = uniqueSorted([0.1, 0.3, 0.5, 0.7, 0.9, 0.95, params.gamma])
  const epsilons = uniqueSorted([0.05, 0.1, 0.2, 0.3, 0.5, 0.8, params.epsilon])
  const alphaReward = alphas.map((alpha) => {
    const run = trainSetting(villages, resources, { ...params, episodes:sweepEpisodes, alpha }, missionPlan)
    return { alpha, finalReward:Number(finalReward(run.history).toFixed(2)) }
  })
  const epsilonReward = epsilons.map((epsilon) => {
    const run = trainSetting(villages, resources, { ...params, episodes:sweepEpisodes, epsilon }, missionPlan)
    return { epsilon, finalReward:Number(finalReward(run.history).toFixed(2)) }
  })
  const gammaReward = gammas.map((gamma) => {
    const run = trainSetting(villages, resources, { ...params, episodes:sweepEpisodes, gamma }, missionPlan)
    return { gamma, totalReward:Number(finalReward(run.history).toFixed(2)) }
  })
  return { alphaReward, gammaReward, epsilonReward, sweepEpisodes }
}

export default function QLearningPage() {
  const { villages, resources, qParams:params, setQParams:setParams, results, saveResult } = useApp()
  const [running,setRunning] = useState(false)
  const [error,setError] = useState('')
  const cancelRef = useRef(false)
  const [selected,setSelected] = useState({ target:'V3-A1', payload:'MEDICINE', weather:'WINDY', battery:resources.batteryCapacity })
  const result = results.ql
  const sensitivity = result?.sensitivity || { alphaReward:[], gammaReward:[], epsilonReward:[], sweepEpisodes:0 }
  const missionPlan = buildMissionPlan(results.pso,villages)

  const train = () => {
    setRunning(true); setError(''); cancelRef.current=false
    setTimeout(() => {
      if (cancelRef.current) return setRunning(false)
      try {
        const trained = trainSetting(villages, resources, params, missionPlan)
        const sensitivity = buildSensitivity(villages, resources, params, missionPlan)
        saveResult('ql', { ...trained, sensitivity, missionPlan, maxBattery:resources.batteryCapacity })
      } catch (e) { setError(e.message) } finally { setRunning(false) }
    }, 30)
  }
  const stop = () => { cancelRef.current=true; setRunning(false) }
  const env = new FloodDroneEnvironment(sharedEnvironmentOptions(villages,resources))
  const state = { location:'H', ...selected, battery:Math.min(selected.battery,resources.batteryCapacity) }
  const best = result ? bestQAction(result.qTable,env,state) : null
  const stateKey = env.encodeState(state)
  const chart = result ? rolling(result.history) : []
  const sampledChart = chart.filter((_,index) => index%Math.max(1,Math.floor(chart.length/300))===0)
  const batteryValues = Array.from({ length:resources.batteryCapacity },(_,index) => index+1)

  return <div>
    <PageIntro kicker="Part 2B · Model-free learning" title="Q-Learning Experiment" description="Train an epsilon-greedy agent and automatically measure how episodes, learning rate α, and exploration rate ε affect reward." actions={<><button className="btn-secondary" disabled={!result} onClick={() => exportJSON('q-learning-summary.json',result)}><Download size={16}/>Export</button>{running?<button className="btn-secondary !text-rose-700" onClick={stop}><Square size={16}/>Cancel training</button>:<button className="btn-primary" onClick={train}><Play size={16}/>Train & graph</button>}</>}/>
    {error && <div className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
    <div className="grid gap-5 xl:grid-cols-[330px_1fr]">
      <aside className="space-y-5">
        <section className="panel-pad"><h2 className="font-bold">Training parameters</h2><div className="mt-4 space-y-4">{[['episodes','Episodes',1],['alpha','Learning rate (α)',.01],['gamma','Discount factor (γ)',.01],['epsilon','Exploration rate (ε)',.01],['minEpsilon','Minimum epsilon',.01],['epsilonDecay','Epsilon decay',.0001],['maxSteps','Maximum steps',1],['seed','Random seed',1]].map(([key,label,step]) => <ParameterInput key={key} label={label} type="number" min="0" step={step} value={params[key]} onChange={(event) => setParams({...params,[key]:Number(event.target.value)})}/>)}</div></section>
        <section className="panel-pad"><h2 className="font-bold">Inspect learned state</h2><div className="mt-4 space-y-3">{[['target',areaTargets],['payload',['FOOD','MEDICINE','BOTH']],['weather',['SAFE','WINDY','SEVERE']],['battery',batteryValues]].map(([field,values]) => <label key={field}><span className="label">{field==='battery'?'Battery charge (%)':field}</span><select className="field" value={field==='battery'?Math.min(selected[field],resources.batteryCapacity):selected[field]} onChange={(event) => setSelected({...selected,[field]:field==='battery'?Number(event.target.value):event.target.value})}>{values.map((value) => <option key={value} value={value}>{field==='battery'?`${Math.round(value/resources.batteryCapacity*100)}%`:value}</option>)}</select></label>)}</div><div className="mt-4 rounded-xl bg-teal-50 p-4"><span className="text-xs font-semibold text-teal-700">Best learned action</span><strong className="mt-1 block text-xl">{best||'Train agent'}</strong></div></section>
      </aside>
      <main className="space-y-5">
        {running && <div className="panel-pad"><strong className="text-sm">Training and generating sensitivity graphs…</strong><p className="mt-1 text-xs text-slate-500">The α, γ, and ε sweeps use identical seeds and up to 1,000 episodes per setting.</p></div>}
        {missionPlan.length > 0 && <div className="rounded-xl bg-teal-50 p-3 text-xs text-teal-800">Training on {missionPlan.length} missions derived from the current PSO allocation.</div>}
        {!result ? <div className="panel-pad flex min-h-72 items-center justify-center text-center text-sm text-slate-500">Train the agent to populate its learning curve and parameter-sensitivity graphs.</div> : <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Success rate" value={`${result.successRate.toFixed(1)}%`}/><MetricCard label="Average reward" value={result.averageReward.toFixed(1)} tone="blue"/><MetricCard label="Final epsilon" value={result.finalEpsilon.toFixed(3)} tone="amber"/><MetricCard label="Learned Q-values" value={result.qTable.size.toLocaleString()} tone="rose"/></section>
          <section className="grid gap-5 lg:grid-cols-2"><GraphPanel title="Episodes vs Average Reward" description="The rolling average shows learning progress as the agent gains experience over more episodes."><LinePlot data={sampledChart} xKey="episode" lines={[{key:'rollingReward',name:'Rolling average reward'}]}/></GraphPanel><GraphPanel title="Learning Rate (α) vs Final Reward" description="A suitable α updates knowledge efficiently; values that are too low or high can reduce final performance."><LinePlot data={sensitivity.alphaReward} xKey="alpha" lines={[{key:'finalReward',name:'Final average reward',color:'#2563eb'}]}/></GraphPanel></section>
          <section className="grid gap-5 lg:grid-cols-2"><GraphPanel title="Discount Factor (γ) vs Total Reward" description="A higher γ gives future rewards more influence, while a lower γ emphasizes immediate outcomes."><LinePlot data={sensitivity.gammaReward} xKey="gamma" lines={[{key:'totalReward',name:'Average total reward',color:'#7c3aed'}]}/></GraphPanel><GraphPanel title="Exploration Rate (ε) vs Final Reward" description="Higher ε explores more actions, while lower ε relies more heavily on the current learned policy."><LinePlot data={sensitivity.epsilonReward} xKey="epsilon" lines={[{key:'finalReward',name:'Final average reward',color:'#f59e0b'}]}/></GraphPanel></section>
          <section className="grid gap-5 lg:grid-cols-2"><GraphPanel title="Episodes vs Success Rate" description="Rolling success percentage shows whether learning produces more completed deliveries over time."><LinePlot data={sampledChart} xKey="episode" lines={[{key:'rollingSuccess',name:'Rolling success %',color:'#2563eb'}]}/></GraphPanel></section>
          <section className="grid gap-5 lg:grid-cols-2"><div className="panel-pad"><h2 className="font-bold">Training summary</h2><dl className="mt-4 space-y-3 text-sm">{[['Episodes completed',result.episodes],['Sensitivity episodes/setting',sensitivity.sweepEpisodes],['Runtime',`${result.runtime.toFixed(1)} ms`],['Average steps',result.averageSteps.toFixed(2)],['Battery failure rate',`${result.batteryFailureRate.toFixed(1)}%`],['Critical medicine success',`${result.criticalSuccessRate.toFixed(1)}%`]].map(([label,value]) => <div key={label} className="flex justify-between border-b border-slate-100 pb-3"><dt className="text-slate-500">{label}</dt><dd className="font-bold">{value}</dd></div>)}</dl></div><div className="panel-pad"><h2 className="font-bold">Q-values for selected state</h2><p className="mt-1 break-all text-xs text-slate-400">{stateKey}</p><div className="mt-4 space-y-2">{env.getValidActions(state).map((action) => { const value=result.qTable.get(`${stateKey}::${action}`)||0; return <div key={action} className={`flex justify-between rounded-lg p-2 text-sm ${action===best?'bg-teal-50 text-teal-800':'bg-slate-50'}`}><span>{action}</span><strong>{value.toFixed(2)}</strong></div> })}</div></div></section>
        </>}
      </main>
    </div>
  </div>
}

function GraphPanel({ title, description, children }) {
  return <div className="panel-pad"><h2 className="font-bold">{title}</h2><p className="mt-1 min-h-10 text-xs leading-5 text-slate-500">{description}</p>{children}</div>
}
