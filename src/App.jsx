import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppProvider } from './AppContext'
import AppLayout from './components/layout/AppLayout'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const PSOPage = lazy(() => import('./pages/PSOPage'))
const EnvironmentPage = lazy(() => import('./pages/EnvironmentPage'))
const ValueIterationPage = lazy(() => import('./pages/ValueIterationPage'))
const QLearningPage = lazy(() => import('./pages/QLearningPage'))
const ComparisonPage = lazy(() => import('./pages/ComparisonPage'))
const MethodologyPage = lazy(() => import('./pages/MethodologyPage'))
const loading = <div className="panel-pad flex min-h-48 items-center justify-center"><span className="h-6 w-6 animate-spin rounded-full border-2 border-teal-700 border-t-transparent"/></div>
export default function App() { return <AppProvider><BrowserRouter><Suspense fallback={loading}><Routes><Route element={<AppLayout/>}><Route index element={<Dashboard/>}/><Route path="pso" element={<PSOPage/>}/><Route path="environment" element={<EnvironmentPage/>}/><Route path="value-iteration" element={<ValueIterationPage/>}/><Route path="q-learning" element={<QLearningPage/>}/><Route path="comparison" element={<ComparisonPage/>}/><Route path="methodology" element={<MethodologyPage/>}/></Route></Routes></Suspense></BrowserRouter></AppProvider> }
