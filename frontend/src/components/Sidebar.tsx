import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, FolderOpen, Upload, Network,
  BarChart3, Brain, FileText, Shield, ChevronRight
} from 'lucide-react'
import { cn } from '../lib/utils'

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/cases', icon: FolderOpen, label: 'Cases' },
  { to: '/evidence/upload', icon: Upload, label: 'Upload Evidence' },
]

const TOOL_ITEMS = [
  { label: 'Entity Graph', icon: Network, path: '/graph' },
  { label: 'Analytics', icon: BarChart3, path: '/analytics' },
  { label: 'AI Investigator', icon: Brain, path: '/ai' },
  { label: 'Reports', icon: FileText, path: '/reports' },
]

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900/80 backdrop-blur-xl border-r border-slate-800/60 flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-5 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-lg leading-none">ForensIQ</h1>
            <p className="text-slate-500 text-xs mt-0.5">Forensic Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <p className="text-slate-600 text-xs font-semibold uppercase tracking-widest mb-3 px-3">
          Navigation
        </p>
        {NAV_ITEMS.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
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

        <div className="pt-4">
          <p className="text-slate-600 text-xs font-semibold uppercase tracking-widest mb-3 px-3">
            Case Tools
          </p>
          {TOOL_ITEMS.map(({ label, icon: Icon, path }) => (
            <div
              key={label}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 cursor-default select-none"
              title={`Navigate to a case first, then access ${label}`}
            >
              <Icon className="w-4 h-4" />
              {label}
              <span className="ml-auto text-xs bg-slate-800 text-slate-600 px-1.5 py-0.5 rounded">
                case
              </span>
            </div>
          ))}
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
