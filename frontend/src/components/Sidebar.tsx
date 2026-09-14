import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FolderOpen, Upload, Network,
  BarChart3, Brain, FileText, Shield, ChevronRight,
  X, RefreshCw
} from 'lucide-react'
import { cn } from '../lib/utils'
import { useCase, ToolItem } from '../lib/CaseContext'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/cases', icon: FolderOpen, label: 'Cases', exact: false },
  { to: '/evidence/upload', icon: Upload, label: 'Upload Evidence', exact: false },
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
        'w-64 bg-white/95 backdrop-blur-xl border-r border-zinc-200 flex flex-col shrink-0 h-full z-50 transition-transform duration-300 shadow-sm',
        'fixed inset-y-0 left-0 lg:static',
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      {/* Logo */}
      <div className="p-5 border-b border-zinc-200 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group" title="Return to CyberTrace Home">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-md shadow-red-600/30 group-hover:scale-105 transition-transform">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-zinc-950 text-lg leading-none tracking-tight">Cyber<span className="text-red-600">Trace</span></h1>
            <p className="text-zinc-500 text-[11px] font-medium mt-0.5 uppercase tracking-wider">Forensic Platform</p>
          </div>
        </Link>

        {/* Mobile close button */}
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-zinc-400 text-[11px] font-bold uppercase tracking-wider mb-2 px-3">
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
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200',
                isActive
                  ? 'bg-red-50 text-red-700 border border-red-200 shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/80'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('w-4 h-4', isActive ? 'text-red-600' : 'text-zinc-500')} />
                <span>{label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-red-600" />}
              </>
            )}
          </NavLink>
        ))}

        {/* Case Tools Section */}
        <div className="pt-5">
          <div className="flex items-center justify-between mb-2 px-3">
            <p className="text-zinc-400 text-[11px] font-bold uppercase tracking-wider">
              Case Tools
            </p>
            <button
              onClick={() => openCaseSelector()}
              className="text-[11px] text-red-600 hover:text-red-700 flex items-center gap-1 font-semibold transition-colors"
              title="Select or switch target case"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              Switch
            </button>
          </div>

          {/* Active Case Context Banner */}
          <div className="mx-1 mb-3 p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/90 flex items-center justify-between shadow-xs">
            <div className="min-w-0 flex-1 mr-2">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                Target Case
              </span>
              <p
                className="text-xs font-bold text-zinc-900 truncate mt-0.5"
                title={activeCaseTitle || currentCaseId || 'No case selected'}
              >
                {activeCaseTitle || (currentCaseId ? `Case #${currentCaseId.slice(0, 8)}` : 'None Selected')}
              </p>
            </div>
            <button
              onClick={() => openCaseSelector()}
              className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-black text-white text-[10px] font-semibold shrink-0 transition-colors shadow-xs"
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
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 text-left',
                  active
                    ? 'bg-red-50 text-red-700 border border-red-200 shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/80'
                )}
              >
                <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-red-600' : 'text-zinc-500')} />
                <span className="truncate">{tool.label}</span>
                {active ? (
                  <ChevronRight className="w-3.5 h-3.5 ml-auto text-red-600 shrink-0" />
                ) : (
                  <span className="ml-auto text-[10px] bg-zinc-100 text-zinc-500 border border-zinc-200 px-1.5 py-0.5 rounded font-mono shrink-0 font-medium">
                    {currentCaseId ? 'ready' : 'select'}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-200">
        <div className="glass p-3 rounded-lg border border-zinc-200/80">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-slow" />
            <span className="text-xs font-semibold text-zinc-700">Forensics Engine Online</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1 font-mono">CyberTrace Core v1.0.0</p>
        </div>
      </div>
    </aside>
  )
}
