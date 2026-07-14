import { useEffect } from 'react'
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import { BatteryCharging, Cloud, Crosshair, PackageOpen } from 'lucide-react'

function FitScenario({ coordinates }) {
  const map = useMap()
  useEffect(() => {
    const points = Object.values(coordinates)
    if (points.length) map.fitBounds(L.latLngBounds(points), { padding:[35,35], maxZoom:12 })
  }, [coordinates, map])
  return null
}

const coreLabels = { H:'Relief Hub', C:'Charging 1', C2:'Charging 2', J1:'Junction 1', J2:'Junction 2' }
const coreStyle = (id, active) => ({
  radius:active ? 12 : 9,
  color:active ? '#5eead4' : id.startsWith('C') ? '#7dd3fc' : id === 'H' ? '#2dd4bf' : '#cbd5e1',
  fillColor:active ? '#0f766e' : id.startsWith('C') ? '#0284c7' : id === 'H' ? '#0f766e' : '#475569',
  fillOpacity:1, weight:active ? 5 : 3,
})

export default function OpenStreetDroneMap({ state, maxBattery, scenario }) {
  const dronePosition = scenario.coordinates[state.location] || scenario.coordinates.H
  return <div>
    <MapContainer center={scenario.center} zoom={10} scrollWheelZoom className="openstreet-map-canvas">
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <FitScenario coordinates={scenario.coordinates}/>

      {scenario.edges.map(([from,to]) => <Polyline key={`${from}-${to}`} positions={[scenario.coordinates[from],scenario.coordinates[to]]} pathOptions={{ color:'#0f766e', weight:3, opacity:.6, dashArray:'7 8' }}/>) }
      {Object.values(scenario.areas).flat().map((area) => <Polyline key={`${area.parent}-${area.id}`} positions={[scenario.coordinates[area.parent],area.position]} pathOptions={{ color:'#ea580c', weight:2, opacity:.65, dashArray:'3 8' }}/>) }

      {Object.entries(scenario.coordinates).filter(([id]) => !id.includes('-A')).map(([id,position]) => {
        const active=state.location===id, village=id.startsWith('V')
        const locality=village?scenario.villages.find((item)=>item.id===id):null
        const style=village ? { radius:10, color:active?'#5eead4':'#fed7aa', fillColor:active?'#0f766e':'#f97316', fillOpacity:1, weight:active?5:3 } : coreStyle(id,active)
        return <CircleMarker key={id} center={position} pathOptions={style} radius={style.radius}><Tooltip permanent direction="bottom" offset={[0,10]} className="node-map-label">{active?'DRONE · ':''}{coreLabels[id] || locality?.name || `Village ${id.slice(1)}`}</Tooltip><Popup><strong>{coreLabels[id] || locality?.name || id}</strong>{locality?<><br/><span>{locality.floodContext}</span><br/><small>{locality.coordinateNote}</small><br/><a href={locality.sourceUrl} target="_blank" rel="noreferrer">Source: {locality.sourceLabel}</a></>:<><br/>Drone network node</>}</Popup></CircleMarker>
      })}

      {Object.values(scenario.areas).flat().map((area) => {
        const target=state.target===area.id, active=state.location===area.id
        return <CircleMarker key={area.id} center={area.position} radius={target||active?9:6} pathOptions={{ color:active?'#5eead4':target?'#fb7185':'#fdba74', fillColor:active?'#0f766e':target?'#ffe4e6':'#ffedd5', fillOpacity:1, weight:target||active?4:2 }}><Tooltip permanent direction="right" offset={[7,0]} className="area-map-label">{active?'DRONE · ':target?'TARGET · ':''}{area.label}</Tooltip><Popup><strong>{area.label}</strong><br/>Simulated delivery area</Popup></CircleMarker>
      })}

      {!state.location.includes('-A') && <CircleMarker center={dronePosition} radius={5} pathOptions={{ color:'#fff',fillColor:'#0f172a',fillOpacity:1,weight:2 }} />}
    </MapContainer>
    <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4"><span className="flex items-center gap-2 rounded-lg bg-slate-50 p-2"><Crosshair size={15}/>Target: {state.target}</span><span className="flex items-center gap-2 rounded-lg bg-slate-50 p-2"><BatteryCharging size={15}/>Battery: {state.battery}/{maxBattery}</span><span className="flex items-center gap-2 rounded-lg bg-slate-50 p-2"><PackageOpen size={15}/>{state.payload}</span><span className="flex items-center gap-2 rounded-lg bg-slate-50 p-2"><Cloud size={15}/>{state.weather}</span></div>
  </div>
}
