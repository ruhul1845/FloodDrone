import { BatteryCharging, Cloud, Crosshair, MapPin, PackageOpen } from 'lucide-react'
import { edges, nodeMeta, villageAreas } from '../../data/network'

export default function NetworkMap({ state, maxBattery = 3 }) {
  return <div>
    <div className="network-map-canvas" style={{ minHeight: '620px', height: '72vh' }}>
      <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
        {edges.map(([a,b]) => <line key={`${a}${b}`} x1={`${nodeMeta[a].x}%`} y1={`${nodeMeta[a].y}%`} x2={`${nodeMeta[b].x}%`} y2={`${nodeMeta[b].y}%`} stroke="#94b8b0" strokeWidth="2" strokeDasharray="5 5"/>)}
        {Object.entries(villageAreas).flatMap(([village, areas]) => areas.map((area) => <line key={`${village}-${area.id}`} x1={`${nodeMeta[village].x}%`} y1={`${nodeMeta[village].y}%`} x2={`${area.x}%`} y2={`${area.y}%`} stroke="#f0a46a" strokeWidth="1.5" strokeDasharray="3 7" opacity=".75"/>))}
      </svg>

      {Object.values(villageAreas).flat().map((area) => { const active=state.location===area.id,target=state.target===area.id; return <div key={area.id} className="absolute -translate-x-1/2 -translate-y-1/2 text-center" style={{ left:`${area.x}%`, top:`${area.y}%` }}>
        <div className={`mx-auto flex h-9 w-9 items-center justify-center rounded-xl border-2 shadow-md ${active?'border-teal-300 bg-teal-700 text-white ring-4 ring-teal-200/60':target?'border-rose-300 bg-rose-100 text-rose-700 ring-4 ring-rose-100':'border-white bg-amber-100 text-amber-700'}`}>{active?<span className="text-[10px] font-bold">DR</span>:<MapPin size={16}/>}</div>
        <span className={`mt-1 block whitespace-nowrap rounded-md bg-white/95 px-2 py-0.5 text-[10px] font-bold shadow-sm ${target?'text-rose-700':'text-amber-800'}`}>{area.label}</span>
      </div> })}

      {Object.entries(nodeMeta).map(([id,n]) => {
        const active = state.location === id, target = state.target === id
        return <div key={id} className="absolute -translate-x-1/2 -translate-y-1/2 text-center" style={{ left:`${n.x}%`, top:`${n.y}%` }}>
          <div className={`relative z-10 mx-auto flex h-12 w-12 items-center justify-center rounded-full border-4 text-xs font-bold shadow-sm transition ${active ? 'border-teal-300 bg-teal-700 text-white ring-4 ring-teal-200/50' : target ? 'border-rose-300 bg-rose-50 text-rose-700' : n.kind === 'charge' ? 'border-sky-200 bg-sky-600 text-white' : n.kind === 'village' ? 'border-orange-200 bg-orange-500 text-white' : 'border-white bg-slate-600 text-white'}`}>{active ? 'DR' : id}</div>
          <span className="relative z-20 mt-1 block whitespace-nowrap rounded bg-white/90 px-1 text-[10px] font-semibold text-slate-600 shadow-sm">{n.label}</span>
        </div>
      })}
    </div>

    <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
      <span className="flex items-center gap-2 rounded-lg bg-slate-50 p-2"><Crosshair size={15}/>Target: {state.target}</span>
      <span className="flex items-center gap-2 rounded-lg bg-slate-50 p-2"><BatteryCharging size={15}/>Battery: {state.battery}/{maxBattery}</span>
      <span className="flex items-center gap-2 rounded-lg bg-slate-50 p-2"><PackageOpen size={15}/>{state.payload}</span>
      <span className="flex items-center gap-2 rounded-lg bg-slate-50 p-2"><Cloud size={15}/>{state.weather}</span>
    </div>
  </div>
}
