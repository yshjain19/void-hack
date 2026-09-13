import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Bell, Search, Activity, Wifi, WifiOff } from 'lucide-react'
import { healthApi } from '../lib/api'

export default function Navbar() {
  const location = useLocation()
  const [online, setOnline] = useState<boolean | null>(null)
  const [search, setSearch] = useState('')

  // Page title map
  const titleMap: Record<string, string> = {
    '/': 'Dashboard',
    '/cases': 'Investigation Cases',
    '/cases/new': 'New Case',
    '/evidence/upload': 'Upload Evidence',
  }

  const title = titleMap[location.pathname] ||
    (location.pathname.includes('/graph') ? 'Entity Graph' :
     location.pathname.includes('/analytics') ? 'Analytics' :
     location.pathname.includes('/ai') ? 'AI Investigator' :
     location.pathname.includes('/reports') ? 'Reports' :
     'Case Detail')

  // Health check
  useEffect(() => {
    const check = async () => {
      try {
        await healthApi.check()
        setOnline(true)
      } catch {
        setOnline(false)
      }
    }
    check()
    const interval = setInterval(check, 30_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="h-16 bg-slate-900/60 backdrop-blur-xl border-b border-slate-800/60 flex items-center px-6 gap-4 shrink-0">
      {/* Page title */}
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-brand-400" />
        <h2 className="font-semibold text-slate-100">{title}</h2>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-md mx-auto relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search cases, entities..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="form-input pl-9 py-1.5 text-sm"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Backend status */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            online === null
              ? 'text-slate-500 border-slate-700 bg-slate-800/30'
              : online
              ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
              : 'text-red-400 border-red-500/30 bg-red-500/10'
          }`}
        >
          {online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {online === null ? 'Connecting...' : online ? 'API Online' : 'API Offline'}
        </div>

        {/* Notifications placeholder */}
        <button className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-500" />
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
          FQ
        </div>
      </div>
    </header>
  )
}
