import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FolderOpen, Upload, Network,
  BarChart3, Brain, FileText, Shield, ChevronRight,
  X, RefreshCw
} from 'lucide-react'
import { cn } from '../lib/utils'
import { useCase, ToolItem } from '../lib/CaseContext'

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/cases', icon: FolderOpen, label: 'Cases' },
  { to: '/evidence/upload', icon: Upload, label: 'Upload Evidence' },
]

const TOOL_ITEMS: ToolItem[] = [
  { label: 'Entity Graph', icon: Network, path: '/graph' },
  { label: 'Analytics', icon: BarChart3, path: '/analytics' },
  { label: 'AI Investigator', icon: Brain, path: '/ai' },
  { label: 'Reports', icon: FileText, path: '/reports' },
]

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const {
    activeCaseId,
    activeCaseTitle,
    openCaseSelector,
    mobileMenuOpen,
    setMobileMenuOpen
  } = useCase()

  // Determine current case ID either from activeCaseId or URL
  const urlMatch = location.pathname.match(/^\/cases\/([^/]+)/)
  const currentCaseId = (urlMatch && urlMatch[1] !== 'new') ? urlMatch[1] : activeCaseId

  const handleToolClick = (tool: ToolItem) => {
    if (currentCaseId) {
      setMobileMenuOpen(false)
      navigate(`/cases/${currentCaseId}${tool.path}`)
    } else {
      openCaseSelector(tool)
    }
  }

  const isToolActive = (toolPath: string) => {
    return location.pathname.includes(toolPath)
  }

  return (
    <aside
      className={cn(
        'w-64 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/60 flex flex-col shrink-0 h-full z-50 transition-transform duration-300',
        'fixed inset-y-0 left-0 lg:static',
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      {/* Logo */}
      <div className="p-5 border-b border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-lg leading-none">ForensIQ</h1>
            <p className="text-slate-500 text-xs mt-0.5">Forensic Platform</p>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-slate-600 text-xs font-semibold uppercase tracking-widest mb-3 px-3">
          Navigation
        </p>
        {NAV_ITEMS.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('w-4 h-4', isActive ? 'text-brand-400' : '')} />
                {label}
                {isActive && <ChevronRight className="w-3 h-3 ml-auto text-brand-400" />}
              </>
            )}
          </NavLink>
        ))}

        {/* Case Tools Section */}
        <div className="pt-4">
          <div className="flex items-center justify-between mb-2 px-3">
            <p className="text-slate-600 text-xs font-semibold uppercase tracking-widest">
              Case Tools
            </p>
            <button
              onClick={() => openCaseSelector()}
              className="text-[11px] text-brand-400 hover:text-brand-300 flex items-center gap-1 font-medium transition-colors"
              title="Select or switch target case"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              Switch
            </button>
          </div>

          {/* Active Case Context Banner */}
          <div className="mx-1 mb-3 p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50 flex items-center justify-between">
            <div className="min-w-0 flex-1 mr-2">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
                Target Case
              </span>
              <p
                className="text-xs font-semibold text-slate-200 truncate mt-0.5"
                title={activeCaseTitle || currentCaseId || 'No case selected'}
              >
                {activeCaseTitle || (currentCaseId ? `Case #${currentCaseId.slice(0, 8)}` : 'None Selected')}
              </p>
            </div>
            <button
              onClick={() => openCaseSelector()}
              className="px-2 py-1 rounded bg-brand-600/20 text-brand-300 hover:bg-brand-600/40 border border-brand-500/30 text-[10px] font-medium shrink-0 transition-colors"
            >
              {currentCaseId ? 'Change' : 'Select'}
            </button>
          </div>

          {/* Case Tools List */}
          {TOOL_ITEMS.map(tool => {
            const Icon = tool.icon
            const active = isToolActive(tool.path)

            return (
              <button
                key={tool.label}
                onClick={() => handleToolClick(tool)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-left',
                  active
                    ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30 shadow-sm shadow-brand-500/10'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                )}
              >
                <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-brand-400' : 'text-slate-400')} />
                <span className="truncate">{tool.label}</span>
                {active ? (
                  <ChevronRight className="w-3.5 h-3.5 ml-auto text-brand-400 shrink-0" />
                ) : (
                  <span className="ml-auto text-[10px] bg-slate-800/80 text-slate-400 border border-slate-700/60 px-1.5 py-0.5 rounded font-mono shrink-0">
                    {currentCaseId ? 'ready' : 'select'}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800/60">
        <div className="glass p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
            <span className="text-xs text-slate-400">System Online</span>
          </div>
          <p className="text-xs text-slate-600 mt-1">ForensIQ v1.0.0</p>
        </div>
      </div>
    </aside>
  )
}
