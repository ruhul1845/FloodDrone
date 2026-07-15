import { useState } from 'react'
import { Download, GitCompareArrows, Play } from 'lucide-react'
import { useApp } from '../appStore'
import PageIntro from '../components/common/PageIntro'
import ParameterInput from '../components/common/ParameterInput'
import MetricCard from '../components/common/MetricCard'
import { BarPlot, LinePlot } from '../components/charts/BasicCharts'
import { FloodDroneEnvironment, WEATHER_TRANSITIONS } from '../simulation/floodDroneEnvironment'
import { runValueIteration } from '../algorithms/valueIteration'
import { bestQAction, runQLearning } from '../algorithms/qLearning'
import { evaluatePolicy } from '../simulation/evaluator'
import { exportCSV } from '../utils/exportResults'
import { buildMissionPlan } from '../simulation/allocationMissions'
import { sharedEnvironmentOptions } from '../simulation/sharedEnvironmentOptions'

const viFields = [
  ['gamma', 'Gamma (γ)', 0.01], ['theta', 'Theta (θ)', 0.001], ['maxIterations', 'Maximum iterations', 1],
]
const qFields = [
  ['episodes', 'Episodes', 1], ['alpha', 'Alpha (α)', 0.01], ['gamma', 'Gamma (γ)', 0.01],
  ['epsilon', 'Initial epsilon', 0.01], ['minEpsilon', 'Minimum epsilon', 0.01],
  ['epsilonDecay', 'Epsilon decay', 0.0001], ['maxSteps', 'Maximum steps', 1], ['seed', 'Random seed', 1],
]

export default function ComparisonPage() {
  const { villages, resources, setResources, viParams, setViParams, qParams, setQParams, results, saveResult } = useApp()
  const [episodes, setEpisodes] = useState(200)
  const [stage, setStage] = useState('idle')
  const [error, setError] = useState('')
  const comparison = results.comparison
  const missionPlan = buildMissionPlan(results.pso,villages)
  const running = stage !== 'idle'

  const runBoth = () => {
    setError('')
    setStage('value-iteration')
    setTimeout(() => {
      try {
        const actualWeather = { ...WEATHER_TRANSITIONS, WINDY: { SAFE: 0.25, WINDY: 0.4, SEVERE: 0.35 } }
        const maxBattery = resources.batteryCapacity

        const modelEnv = new FloodDroneEnvironment(sharedEnvironmentOptions(villages,resources,{ weatherTransitions:actualWeather }))
        const vi = runValueIteration(modelEnv, viParams)
        setStage('q-learning')

        const trainingEnv = new FloodDroneEnvironment(sharedEnvironmentOptions(villages,resources,{ seed:qParams.seed, weatherTransitions:actualWeather, maxSteps:qParams.maxSteps }))
        const ql = runQLearning(trainingEnv, { ...qParams, missionPlan })
        setStage('evaluation')

        const viEvalEnv = new FloodDroneEnvironment(sharedEnvironmentOptions(villages,resources,{ seed:202, weatherTransitions:actualWeather, maxSteps:qParams.maxSteps }))
        const qEvalEnv = new FloodDroneEnvironment(sharedEnvironmentOptions(villages,resources,{ seed:202, weatherTransitions:actualWeather, maxSteps:qParams.maxSteps }))
        const viMetrics = evaluatePolicy(viEvalEnv, (state) => vi.policy.get(modelEnv.encodeState(state)) || 'WAIT', { episodes, seed:101, missionPlan })
        const qMetrics = evaluatePolicy(qEvalEnv, (state) => bestQAction(ql.qTable, qEvalEnv, state), { episodes, seed:101, missionPlan })

        setStage('gamma-sweep')
        const gammaSweepEpisodes = Math.max(100, Math.min(qParams.episodes, 1000))
        const gammaEvaluationMissions = Math.max(20, Math.min(episodes, 60))
        const gammaValues = [...new Set([0.1, 0.3, 0.5, 0.7, 0.9, 0.95, viParams.gamma, qParams.gamma])].sort((a,b) => a-b)
        const gammaComparison = gammaValues.map((gamma) => {
          const sweepModelEnv = new FloodDroneEnvironment(sharedEnvironmentOptions(villages,resources,{ seed:42, weatherTransitions:actualWeather }))
          const sweepVi = runValueIteration(sweepModelEnv, { ...viParams, gamma })
          const sweepTrainingEnv = new FloodDroneEnvironment(sharedEnvironmentOptions(villages,resources,{ seed:qParams.seed, weatherTransitions:actualWeather, maxSteps:qParams.maxSteps }))
          const sweepQl = runQLearning(sweepTrainingEnv, { ...qParams, gamma, episodes:gammaSweepEpisodes, missionPlan })
          const sweepViEvalEnv = new FloodDroneEnvironment(sharedEnvironmentOptions(villages,resources,{ seed:303, weatherTransitions:actualWeather, maxSteps:qParams.maxSteps }))
          const sweepQlEvalEnv = new FloodDroneEnvironment(sharedEnvironmentOptions(villages,resources,{ seed:303, weatherTransitions:actualWeather, maxSteps:qParams.maxSteps }))
          const sweepViMetrics = evaluatePolicy(sweepViEvalEnv, (state) => sweepVi.policy.get(sweepModelEnv.encodeState(state)) || 'WAIT', { episodes:gammaEvaluationMissions, seed:303, missionPlan })
          const sweepQlMetrics = evaluatePolicy(sweepQlEvalEnv, (state) => bestQAction(sweepQl.qTable,sweepQlEvalEnv,state), { episodes:gammaEvaluationMissions, seed:303, missionPlan })
          return { gamma, valueIterationReward:Number(sweepViMetrics.averageReward.toFixed(2)), qLearningReward:Number(sweepQlMetrics.averageReward.toFixed(2)) }
        })

        const completeComparison = {
          maxBattery, batteryHealth: resources.batteryHealth, episodes, vi: viMetrics, ql: qMetrics,
          gammaComparison, gammaSweepEpisodes, gammaEvaluationMissions, missionPlan,
          viParameters: { ...viParams }, qParameters: { ...qParams },
        }
        saveResult('comparison', completeComparison)
      } catch (caught) {
        setError(caught.message)
      } finally {
        setStage('idle')
      }
    }, 30)
  }

  const rows = comparison ? [
    { algorithm: 'Value Iteration', modelRequired: 'Yes', exploration: 'No', ...comparison.vi },
    { algorithm: 'Q-Learning', modelRequired: 'No', exploration: 'Yes', ...comparison.ql },
  ] : []
  const interpretation = comparison
    ? comparison.vi.successRate >= comparison.ql.successRate
      ? 'Value Iteration achieved the higher measured success rate under the shared weather conditions used by both algorithms.'
      : 'Q-Learning achieved the higher measured success rate under the shared weather conditions used by both algorithms.'
    : ''
  const stageText = { 'value-iteration': 'Computing Value Iteration…', 'q-learning': 'Training Q-Learning…', evaluation: 'Evaluating both policies…', 'gamma-sweep': 'Comparing discount factors…' }

  return <div>
    <PageIntro
      kicker="Value Iteration + Q-Learning · One workflow"
      title="Run & Compare Both Algorithms"
      description="Configure both algorithms here. One run computes Value Iteration, trains Q-Learning, then automatically evaluates both policies on identical test missions."
      actions={<>
        <button className="btn-secondary" disabled={!comparison || running} onClick={() => exportCSV('algorithm-comparison.csv', rows)}><Download size={16}/>Export CSV</button>
        <button className="btn-primary" disabled={running} onClick={runBoth}><Play size={16}/>{running ? stageText[stage] : 'Run both & compare'}</button>
      </>}
    />

    {error && <div className="mb-5 rounded-xl bg-rose-50 p-4 text-sm font-medium text-rose-700">{error}</div>}
    {running && <div className="mb-5 flex items-center gap-3 rounded-xl border border-teal-100 bg-teal-50 p-4 text-sm text-teal-900"><span className="h-5 w-5 animate-spin rounded-full border-2 border-teal-700 border-t-transparent"/><div><strong>{stageText[stage]}</strong><p className="mt-0.5 text-xs text-teal-700">The comparison starts automatically after both algorithms complete.</p></div></div>}
    {missionPlan.length > 0 && <div className="mb-5 rounded-xl bg-teal-50 p-3 text-xs text-teal-800">Comparison uses {missionPlan.length} missions derived from the current PSO allocation and the shared VI/QL parameters above.</div>}

    <section className="grid gap-5 xl:grid-cols-2">
      <div className="panel-pad">
        <div className="flex items-center justify-between"><div><p className="eyebrow">Model-based</p><h2 className="mt-1 text-lg font-bold">Value Iteration settings</h2></div><span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">VI</span></div>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">{viFields.map(([key,label,step]) => <ParameterInput key={key} label={label} type="number" min={key === 'gamma' ? 0 : 0.000001} max={key === 'gamma' ? 0.999 : undefined} step={step} value={viParams[key]} disabled={running} onChange={(event) => setViParams((current) => ({ ...current, [key]: Number(event.target.value) }))}/>)}</div>
        <p className="mt-4 rounded-xl bg-sky-50 p-3 text-xs leading-5 text-sky-800">Uses an explicit transition model with the same weather conditions used during controlled evaluation.</p>
      </div>

      <div className="panel-pad">
        <div className="flex items-center justify-between"><div><p className="eyebrow">Model-free</p><h2 className="mt-1 text-lg font-bold">Q-Learning settings</h2></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">QL</span></div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{qFields.map(([key,label,step]) => <ParameterInput key={key} label={label} type="number" min="0" step={step} value={qParams[key]} disabled={running} onChange={(event) => setQParams((current) => ({ ...current, [key]: Number(event.target.value) }))}/>)}</div>
        <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">Trains through sampled interaction with the actual environment and uses epsilon-greedy exploration.</p>
      </div>
    </section>

    <section className="panel-pad mt-5">
      <div className="grid gap-5 lg:grid-cols-2 lg:items-end">
        <ParameterInput label="Battery health (%)" hint="Enter a percentage from 0 to 100" type="number" min="0" max="100" step="1" value={resources.batteryHealth} disabled={running} onChange={(event) => setResources((current) => ({ ...current, batteryHealth: Math.max(0, Math.min(100, Number(event.target.value) || 0)) }))}/>
        <ParameterInput label="Evaluation missions" hint="Identical episodes for both policies" type="number" min="10" step="10" value={episodes} disabled={running} onChange={(event) => setEpisodes(Math.max(10, Math.floor(Number(event.target.value) || 10)))}/>
      </div>
    </section>

    {!comparison ? <section className="panel-pad mt-5 flex min-h-64 flex-col items-center justify-center text-center"><GitCompareArrows className="text-teal-700" size={34}/><h2 className="mt-3 font-bold">Ready for a complete experiment</h2><p className="mt-2 max-w-md text-sm leading-6 text-slate-500">Set both parameter groups and select “Run both & compare.” Results will appear here automatically.</p></section> : <>
      <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="VI success" value={`${comparison.vi.successRate.toFixed(1)}%`}/><MetricCard label="Q-learning success" value={`${comparison.ql.successRate.toFixed(1)}%`} tone="blue"/><MetricCard label="VI avg reward" value={comparison.vi.averageReward.toFixed(1)} tone="amber"/><MetricCard label="Q-learning avg reward" value={comparison.ql.averageReward.toFixed(1)} tone="rose"/></section>
      <section className="panel-pad mt-5"><h2 className="font-bold">Discount Factor (γ) vs Total Reward</h2><p className="mt-1 text-xs leading-5 text-slate-500">Both algorithms are tested at the same γ values and evaluated on identical seeded missions. Value Iteration is teal; Q-Learning is amber.</p><LinePlot data={comparison.gammaComparison} xKey="gamma" lines={[{key:'valueIterationReward',name:'Value Iteration reward',color:'#0f766e'},{key:'qLearningReward',name:'Q-Learning reward',color:'#f59e0b'}]}/><p className="mt-2 text-xs text-slate-400">Q-Learning sweep: {comparison.gammaSweepEpisodes} episodes per γ. Evaluation: {comparison.gammaEvaluationMissions} identical missions per algorithm.</p></section>
      <section className="mt-5 grid gap-5 lg:grid-cols-2"><div className="panel-pad"><h2 className="font-bold">Measured performance</h2><BarPlot data={rows} xKey="algorithm" bars={[{key:'successRate',name:'Success %'},{key:'criticalSuccessRate',name:'Critical medicine %',color:'#e11d48'},{key:'batteryFailureRate',name:'Battery failure %',color:'#f59e0b'}]}/></div><div className="panel-pad"><h2 className="font-bold">Evidence-based interpretation</h2><p className="mt-4 text-sm leading-7 text-slate-600">{interpretation}</p><div className="mt-5 rounded-xl bg-slate-50 p-4 text-xs leading-6 text-slate-500">Generated from {comparison.episodes} identical test missions at {comparison.batteryHealth}% battery health. VI: γ {comparison.viParameters.gamma}, θ {comparison.viParameters.theta}. QL: α {comparison.qParameters.alpha}, γ {comparison.qParameters.gamma}, {comparison.qParameters.episodes} training episodes.</div></div></section>
      <section className="panel-pad mt-5 overflow-x-auto"><h2 className="font-bold">Full automatic comparison</h2><table className="mt-4 w-full min-w-[900px] text-left text-sm"><thead><tr className="border-b text-xs uppercase text-slate-500"><th className="pb-3">Algorithm</th><th>Model</th><th>Exploration</th><th>Reward</th><th>Success</th><th>Critical</th><th>Food</th><th>Steps</th><th>Battery failures</th><th>Severe moves</th></tr></thead><tbody>{rows.map((row) => <tr key={row.algorithm} className="border-b border-slate-100"><td className="py-3 font-bold">{row.algorithm}</td><td>{row.modelRequired}</td><td>{row.exploration}</td><td>{row.averageReward.toFixed(1)}</td><td>{row.successRate.toFixed(1)}%</td><td>{row.criticalSuccessRate.toFixed(1)}%</td><td>{row.foodSuccessRate.toFixed(1)}%</td><td>{row.averageSteps.toFixed(1)}</td><td>{row.batteryFailureRate.toFixed(1)}%</td><td>{row.severeMoves}</td></tr>)}</tbody></table></section>
    </>}
  </div>
}
