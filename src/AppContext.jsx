import { useState } from 'react'
import { defaultPso, defaultQl, defaultResources, defaultVi } from './data/defaultParameters'
import { defaultVillages } from './data/villages'
import { AppContext } from './appStore'

export function AppProvider({ children }) {
  const [villages, setVillages] = useState(defaultVillages)
  const [resources, setResources] = useState(defaultResources)
  const [psoParams, setPsoParams] = useState(defaultPso)
  const [viParams, setViParams] = useState(defaultVi)
  const [qParams, setQParams] = useState(defaultQl)
  const [results, setResults] = useState({ pso: null, vi: null, ql: null, comparison: null })
  const saveResult = (key, value) => setResults((current) => ({ ...current, [key]: value }))
  const resetData = () => { setVillages(defaultVillages); setResources(defaultResources); setPsoParams(defaultPso); setViParams(defaultVi); setQParams(defaultQl); setResults({ pso:null, vi:null, ql:null, comparison:null }) }
  return <AppContext.Provider value={{ villages, setVillages, resources, setResources, psoParams, setPsoParams, viParams, setViParams, qParams, setQParams, results, saveResult, resetData }}>{children}</AppContext.Provider>
}
