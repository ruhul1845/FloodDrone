import { Boxes, BrainCircuit, GitCompareArrows, GraduationCap } from 'lucide-react'
import PageIntro from '../components/common/PageIntro'
import PSOPage from './PSOPage'
import ValueIterationPage from './ValueIterationPage'
import QLearningPage from './QLearningPage'
import ComparisonPage from './ComparisonPage'

const sections = [
  ['pso','1. PSO',Boxes],
  ['value-iteration','2. Value Iteration',BrainCircuit],
  ['q-learning','3. Q-Learning',GraduationCap],
  ['comparison','4. Comparison',GitCompareArrows],
]

export default function UnifiedExperimentsPage() {
  return <div>
    <PageIntro kicker="Unified experiment workspace" title="Allocation, Planning, Learning & Comparison" description="Configure shared villages, resources, and algorithm parameters once. The same values persist across PSO, Value Iteration, Q-Learning, and the final controlled comparison."/>
    <nav className="sticky top-16 z-20 mb-8 flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-sm backdrop-blur">
      {sections.map(([id,label,Icon]) => <a key={id} href={`#${id}`} className="flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-teal-50 hover:text-teal-700"><Icon size={16}/>{label}</a>)}
    </nav>
    <div className="rounded-xl bg-teal-50 p-4 text-sm leading-6 text-teal-900"><strong>Shared settings are active.</strong> Village/resource changes made in PSO and VI/QL hyperparameter changes remain fixed while you move through this page. Comparison uses those same VI and Q-Learning values.</div>
    <section id="pso" className="scroll-mt-36 pt-10"><PSOPage/></section>
    <section id="value-iteration" className="mt-12 scroll-mt-36 border-t border-slate-200 pt-12"><ValueIterationPage/></section>
    <section id="q-learning" className="mt-12 scroll-mt-36 border-t border-slate-200 pt-12"><QLearningPage/></section>
    <section id="comparison" className="mt-12 scroll-mt-36 border-t border-slate-200 pt-12"><ComparisonPage/></section>
  </div>
}
