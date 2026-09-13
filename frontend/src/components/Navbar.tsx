import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Bell, Search, Activity, Wifi, WifiOff, Menu, Folder,
  CheckCircle2, ShieldCheck, X, User, Plus
} from 'lucide-react'
import { healthApi } from '../lib/api'
import { useCase } from '../lib/CaseContext'

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { toggleMobileMenu, activeCaseTitle, openCaseSelector } = useCase()
  const [online, setOnline] = useState<boolean | null>(null)
  const [search, setSearch] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(3)

  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

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

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false)
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      navigate(`/cases?search=${encodeURIComponent(search.trim())}`)
    }
  }

  return (
    <header className="h-16 bg-slate-900/60 backdrop-blur-xl border-b border-slate-800/60 flex items-center px-4 md:px-6 gap-3 shrink-0 relative z-30">
      {/* Mobile hamburger button */}
      <button
        onClick={toggleMobileMenu}
        className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
        aria-label="Toggle navigation menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title */}
      <div className="flex items-center gap-2 shrink-0">
        <Activity className="w-4 h-4 text-brand-400" />
        <h2 className="font-semibold text-slate-100 text-sm md:text-base">{title}</h2>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="hidden sm:block flex-1 max-w-md mx-auto relative">
        <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-brand-400">
          <Search className="w-4 h-4" />
        </button>
        <input
          type="text"
          placeholder="Search cases, entities... (Press Enter)"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="form-input pl-9 pr-4 py-1.5 text-sm"
        />
      </form>

      {/* Right side controls */}
      <div className="flex items-center gap-2 md:gap-3 ml-auto">
        {/* Active Case indicator */}
        {activeCaseTitle && (
          <button
            onClick={() => openCaseSelector()}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-slate-800/70 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-colors max-w-[160px]"
            title={`Active Case: ${activeCaseTitle} (Click to switch)`}
          >
            <Folder className="w-3 h-3 text-brand-400 shrink-0" />
            <span className="truncate font-medium">{activeCaseTitle}</span>
          </button>
        )}

        {/* Backend status pill */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
            online === null
              ? 'text-slate-500 border-slate-700 bg-slate-800/30'
              : online
              ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
              : 'text-red-400 border-red-500/30 bg-red-500/10'
          }`}
        >
          {online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          <span className="hidden xs:inline">
            {online === null ? 'Connecting...' : online ? 'API Online' : 'API Offline'}
          </span>
        </div>

        {/* Notifications Button & Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setNotificationsOpen(prev => !prev)
              setProfileOpen(false)
            }}
            className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
            title="System Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-4 z-50 animate-slide-up text-left">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <span className="font-semibold text-xs uppercase tracking-wider text-slate-300">
                  System Alerts
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => setUnreadCount(0)}
                    className="text-[11px] text-brand-400 hover:text-brand-300"
                  >
                    Mark as read
                  </button>
                )}
              </div>
              <div className="space-y-2.5 max-h-60 overflow-y-auto text-xs">
                <div className="p-2 rounded bg-slate-800/50 border border-slate-700/40">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-medium mb-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> ForensIQ Integrity Shield
                  </div>
                  <p className="text-slate-400">All evidence files protected with immutable SHA-256 custody chain hashing.</p>
                </div>
                <div className="p-2 rounded bg-slate-800/50 border border-slate-700/40">
                  <div className="flex items-center gap-1.5 text-brand-400 font-medium mb-0.5">
                    <Activity className="w-3.5 h-3.5" /> Anomaly Detection Engine
                  </div>
                  <p className="text-slate-400">Isolation Forest and risk scoring pipelines are operational.</p>
                </div>
                <div className="p-2 rounded bg-slate-800/50 border border-slate-700/40">
                  <div className="flex items-center gap-1.5 text-purple-400 font-medium mb-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> System Status
                  </div>
                  <p className="text-slate-400">{online ? 'FastAPI backend cluster connected successfully.' : 'Operating in local resilient mode.'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar & Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => {
              setProfileOpen(prev => !prev)
              setNotificationsOpen(false)
            }}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0 hover:ring-2 hover:ring-brand-400/50 transition-all cursor-pointer"
            title="User Profile"
            aria-label="User Profile"
          >
            FQ
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-4 z-50 animate-slide-up text-left">
              <div className="flex items-center gap-3 pb-3 mb-3 border-b border-slate-800">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
                  FQ
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-white truncate">Lead Investigator</p>
                  <p className="text-slate-500 text-xs truncate">ID: INV-88219</p>
                </div>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between py-1 text-slate-400">
                  <span>Clearance:</span>
                  <span className="text-brand-300 font-medium">Level 4 (Top Secret)</span>
                </div>
                <div className="flex justify-between py-1 text-slate-400">
                  <span>Target Case:</span>
                  <span className="text-slate-200 font-medium truncate max-w-[120px]">
                    {activeCaseTitle || 'None Selected'}
                  </span>
                </div>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-800 space-y-1.5">
                <button
                  onClick={() => {
                    setProfileOpen(false)
                    openCaseSelector()
                  }}
                  className="w-full text-left py-1.5 px-2 rounded hover:bg-slate-800 text-xs text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-2"
                >
                  <Folder className="w-3.5 h-3.5" /> Switch Target Case
                </button>
                <button
                  onClick={() => {
                    setProfileOpen(false)
                    navigate('/cases/new')
                  }}
                  className="w-full text-left py-1.5 px-2 rounded hover:bg-slate-800 text-xs text-slate-300 hover:text-white transition-colors flex items-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" /> Create New Case
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
