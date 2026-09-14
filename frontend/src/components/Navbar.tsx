import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Bell, Search, Activity, Wifi, WifiOff, Menu, Folder,
  CheckCircle2, ShieldCheck, X, User, Plus, Sparkles, KeyRound
} from 'lucide-react'
import { healthApi } from '../lib/api'
import { useCase } from '../lib/CaseContext'
import ApiKeyModal from './ApiKeyModal'
import { getAiConfig, AIConfig } from '../lib/aiConfig'

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { toggleMobileMenu, activeCaseTitle, openCaseSelector } = useCase()
  const [online, setOnline] = useState<boolean | null>(null)
  const [search, setSearch] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(3)
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false)
  const [aiConfigState, setAiConfigState] = useState<AIConfig>(getAiConfig())

  useEffect(() => {
    const handleConfigChange = () => setAiConfigState(getAiConfig())
    window.addEventListener('cybertrace_ai_config_changed', handleConfigChange)
    return () => window.removeEventListener('cybertrace_ai_config_changed', handleConfigChange)
  }, [])

  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  // Page title map
  const titleMap: Record<string, string> = {
    '/': 'Dashboard',
    '/dashboard': 'Dashboard',
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
    <header className="h-16 bg-white/95 backdrop-blur-xl border-b border-zinc-200 flex items-center px-4 md:px-6 gap-3 shrink-0 relative z-30 shadow-xs">
      {/* Mobile hamburger button */}
      <button
        onClick={toggleMobileMenu}
        className="lg:hidden p-2 rounded-lg text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
        aria-label="Toggle navigation menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center border border-red-200/80">
          <Activity className="w-4 h-4 text-red-600" />
        </div>
        <h2 className="font-bold text-zinc-900 text-sm md:text-base tracking-tight">{title}</h2>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="hidden sm:block flex-1 max-w-md mx-auto relative">
        <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-red-600 transition-colors">
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
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 transition-colors max-w-[170px]"
            title={`Active Case: ${activeCaseTitle} (Click to switch)`}
          >
            <Folder className="w-3.5 h-3.5 text-red-600 shrink-0" />
            <span className="truncate font-semibold">{activeCaseTitle}</span>
          </button>
        )}

        {/* Backend status pill */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
            online === null
              ? 'text-zinc-500 border-zinc-200 bg-zinc-100'
              : online
              ? 'text-emerald-700 border-emerald-200 bg-emerald-50'
              : 'text-red-700 border-red-200 bg-red-50'
          }`}
        >
          {online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          <span className="hidden xs:inline">
            {online === null ? 'Connecting...' : online ? 'API Online' : 'API Offline'}
          </span>
        </div>

        {/* AI Engine & API Keys Trigger */}
        <button
          onClick={() => setApiKeyModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 shadow-xs hover:border-red-300"
          title={`AI Engine: ${aiConfigState.provider.toUpperCase()} ${aiConfigState.apiKey ? '(Live Key Active)' : '(Built-in Offline)'} - Click to configure`}
        >
          <Sparkles className="w-3.5 h-3.5 text-red-600 shrink-0" />
          <span className="hidden sm:inline font-bold">
            {aiConfigState.provider === 'gemini' ? 'Gemini AI' : aiConfigState.provider === 'openai' ? 'OpenAI' : aiConfigState.provider === 'anthropic' ? 'Claude' : aiConfigState.provider === 'ollama' ? 'Ollama' : 'AI Engine'}
          </span>
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${aiConfigState.apiKey ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50' : 'bg-amber-500'}`}
            title={aiConfigState.apiKey ? 'Live API Key configured' : 'Using built-in forensic intelligence'}
          />
        </button>

        {/* Notifications Button & Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setNotificationsOpen(prev => !prev)
              setProfileOpen(false)
            }}
            className="relative p-2 rounded-lg text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
            title="System Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-600 ring-2 ring-white animate-pulse" />
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-zinc-200 rounded-xl shadow-xl p-4 z-50 animate-slide-up text-left">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-200">
                <span className="font-bold text-xs uppercase tracking-wider text-zinc-900">
                  System Alerts
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => setUnreadCount(0)}
                    className="text-[11px] font-semibold text-red-600 hover:text-red-700"
                  >
                    Mark as read
                  </button>
                )}
              </div>
              <div className="space-y-2.5 max-h-60 overflow-y-auto text-xs">
                <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold mb-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> CyberTrace Integrity Shield
                  </div>
                  <p className="text-zinc-600">All evidence files protected with immutable SHA-256 custody chain hashing.</p>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
                  <div className="flex items-center gap-1.5 text-red-600 font-bold mb-0.5">
                    <Activity className="w-3.5 h-3.5" /> Anomaly Detection Engine
                  </div>
                  <p className="text-zinc-600">Isolation Forest and risk scoring pipelines are operational.</p>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
                  <div className="flex items-center gap-1.5 text-zinc-800 font-bold mb-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-red-600" /> System Status
                  </div>
                  <p className="text-zinc-600">{online ? 'FastAPI backend cluster connected successfully.' : 'Operating in local resilient mode.'}</p>
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
            className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-xs font-bold text-white shrink-0 hover:ring-2 hover:ring-red-500/40 transition-all cursor-pointer shadow-sm"
            title="User Profile"
            aria-label="User Profile"
          >
            FQ
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-zinc-200 rounded-xl shadow-xl p-4 z-50 animate-slide-up text-left">
              <div className="flex items-center gap-3 pb-3 mb-3 border-b border-zinc-200">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-sm">
                  FQ
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-zinc-950 truncate">Lead Investigator</p>
                  <p className="text-zinc-500 text-xs truncate font-mono">ID: INV-88219</p>
                </div>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 text-zinc-600">
                  <span>Clearance:</span>
                  <span className="text-red-700 font-bold">Level 4 (Top Secret)</span>
                </div>
                <div className="flex justify-between py-1 text-zinc-600">
                  <span>Target Case:</span>
                  <span className="text-zinc-900 font-semibold truncate max-w-[120px]">
                    {activeCaseTitle || 'None Selected'}
                  </span>
                </div>
              </div>
              <div className="pt-3 mt-3 border-t border-zinc-200 space-y-1.5">
                <button
                  onClick={() => {
                    setProfileOpen(false)
                    openCaseSelector()
                  }}
                  className="w-full text-left py-2 px-2.5 rounded-lg hover:bg-zinc-100 text-xs font-semibold text-zinc-900 hover:text-red-600 transition-colors flex items-center gap-2"
                >
                  <Folder className="w-3.5 h-3.5 text-red-600" /> Switch Target Case
                </button>
                <button
                  onClick={() => {
                    setProfileOpen(false)
                    navigate('/cases/new')
                  }}
                  className="w-full text-left py-2 px-2.5 rounded-lg hover:bg-zinc-100 text-xs font-semibold text-zinc-900 hover:text-red-600 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5 text-red-600" /> Create New Case
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global API Key Configuration Dialog */}
      <ApiKeyModal
        isOpen={apiKeyModalOpen}
        onClose={() => setApiKeyModalOpen(false)}
        onSaved={() => setAiConfigState(getAiConfig())}
      />
    </header>
  )
}
