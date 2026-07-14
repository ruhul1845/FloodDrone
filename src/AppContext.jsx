import { useState } from 'react'
import { defaultResources } from './data/defaultParameters'
import { defaultVillages } from './data/villages'
import { AppContext } from './appStore'

export function AppProvider({ children }) {
  const [villages, setVillages] = useState(defaultVillages)
  const [resources, setResources] = useState(defaultResources)
  const [results, setResults] = useState({ pso: null, vi: null, ql: null, comparison: null })
  const saveResult = (key, value) => setResults((current) => ({ ...current, [key]: value }))
  const resetData = () => { setVillages(defaultVillages); setResources(defaultResources) }
  return <AppContext.Provider value={{ villages, setVillages, resources, setResources, results, saveResult, resetData }}>{children}</AppContext.Provider>
}
