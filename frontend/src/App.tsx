import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import CaseSelectorModal from './components/CaseSelectorModal'
import ToolRedirect from './components/ToolRedirect'
import Dashboard from './pages/Dashboard'
import CaseList from './pages/CaseList'
import NewCase from './pages/NewCase'
import CaseDetail from './pages/CaseDetail'
import GraphView from './pages/GraphView'
import AnalyticsView from './pages/AnalyticsView'
import AIInvestigator from './pages/AIInvestigator'
import ReportsView from './pages/ReportsView'
import EvidenceUpload from './pages/EvidenceUpload'
import LandingPage from './pages/LandingPage'
import { CaseProvider, useCase } from './lib/CaseContext'

function AppLayout() {
  const { mobileMenuOpen, setMobileMenuOpen } = useCase()

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 text-zinc-900 relative">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 animate-fade-in bg-zinc-50">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/cases" element={<CaseList />} />
            <Route path="/cases/new" element={<NewCase />} />
            <Route path="/cases/:id" element={<CaseDetail />} />
            <Route path="/cases/:id/graph" element={<GraphView />} />
            <Route path="/cases/:id/analytics" element={<AnalyticsView />} />
            <Route path="/cases/:id/ai" element={<AIInvestigator />} />
            <Route path="/cases/:id/reports" element={<ReportsView />} />
            <Route path="/evidence/upload" element={<EvidenceUpload />} />

            {/* Direct Tool Routes */}
            <Route path="/graph" element={<GraphView />} />
            <Route path="/analytics" element={<AnalyticsView />} />
            <Route path="/ai" element={<AIInvestigator />} />
            <Route path="/reports" element={<ReportsView />} />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>

      {/* Global Case Selector Dialog */}
      <CaseSelectorModal />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <CaseProvider>
        <Routes>
          {/* Public Root / Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Internal Application Layout */}
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </CaseProvider>
    </BrowserRouter>
  )
}

