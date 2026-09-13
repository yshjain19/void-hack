import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import CaseList from './pages/CaseList'
import NewCase from './pages/NewCase'
import CaseDetail from './pages/CaseDetail'
import GraphView from './pages/GraphView'
import AnalyticsView from './pages/AnalyticsView'
import AIInvestigator from './pages/AIInvestigator'
import ReportsView from './pages/ReportsView'
import EvidenceUpload from './pages/EvidenceUpload'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden bg-slate-950">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Navbar />
          <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/cases" element={<CaseList />} />
              <Route path="/cases/new" element={<NewCase />} />
              <Route path="/cases/:id" element={<CaseDetail />} />
              <Route path="/cases/:id/graph" element={<GraphView />} />
              <Route path="/cases/:id/analytics" element={<AnalyticsView />} />
              <Route path="/cases/:id/ai" element={<AIInvestigator />} />
              <Route path="/cases/:id/reports" element={<ReportsView />} />
              <Route path="/evidence/upload" element={<EvidenceUpload />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}
