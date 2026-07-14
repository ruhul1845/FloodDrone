export default function MetricCard({ label, value, detail, icon: Icon, tone = 'teal' }) {
  const tones = { teal: 'bg-teal-50 text-teal-700', blue: 'bg-sky-50 text-sky-700', amber: 'bg-amber-50 text-amber-700', rose: 'bg-rose-50 text-rose-700' }
  return <div className="panel p-4 md:p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>{detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}</div>{Icon && <span className={`rounded-xl p-2.5 ${tones[tone]}`}><Icon size={20}/></span>}</div></div>
}
