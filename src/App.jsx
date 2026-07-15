import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppProvider } from './AppContext'
import AppLayout from './components/layout/AppLayout'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const EnvironmentPage = lazy(() => import('./pages/EnvironmentPage'))
const UnifiedExperimentsPage = lazy(() => import('./pages/UnifiedExperimentsPage'))
const MethodologyPage = lazy(() => import('./pages/MethodologyPage'))
const loading = <div className="panel-pad flex min-h-48 items-center justify-center"><span className="h-6 w-6 animate-spin rounded-full border-2 border-teal-700 border-t-transparent"/></div>
export default function App() { return <AppProvider><BrowserRouter><Suspense fallback={loading}><Routes><Route element={<AppLayout/>}><Route index element={<Dashboard/>}/><Route path="experiments" element={<UnifiedExperimentsPage/>}/>{['pso','value-iteration','q-learning','comparison'].map((path) => <Route key={path} path={path} element={<Navigate to="/experiments" replace/>}/>) }<Route path="environment" element={<EnvironmentPage/>}/><Route path="methodology" element={<MethodologyPage/>}/></Route></Routes></Suspense></BrowserRouter></AppProvider> }
