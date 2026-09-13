import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X, Search, FolderOpen, ArrowRight, Plus, Loader2,
  AlertTriangle, Shield, CheckCircle2, Network, BarChart3, Brain, FileText
} from 'lucide-react'
import { casesApi } from '../lib/api'
import { useCase } from '../lib/CaseContext'
import { formatDateTime } from '../lib/utils'

export default function CaseSelectorModal() {
  const navigate = useNavigate()
  const { isCaseSelectorOpen, closeCaseSelector, targetTool, setActiveCase, activeCaseId } = useCase()
  const [cases, setCases] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (isCaseSelectorOpen) {
      setLoading(true)
      casesApi
        .list({ limit: 50 })
        .then(res => {
          setCases(res.data?.items || [])
        })
        .catch(() => {
          setCases([])
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [isCaseSelectorOpen])

  if (!isCaseSelectorOpen) return null

  const filtered = cases.filter(c =>
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase()) ||
    c.investigator?.toLowerCase().includes(search.toLowerCase()) ||
    c.status?.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (c: any) => {
    setActiveCase(c.id, c.title)
    closeCaseSelector()
    if (targetTool?.path) {
      navigate(`/cases/${c.id}${targetTool.path}`)
    } else {
      navigate(`/cases/${c.id}`)
    }
  }

  const getToolIcon = () => {
    if (!targetTool) return FolderOpen
    switch (targetTool.path) {
      case '/graph': return Network
      case '/analytics': return BarChart3
      case '/ai': return Brain
      case '/reports': return FileText
      default: return FolderOpen
    }
  }

  const ToolIcon = getToolIcon()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl max-w-xl w-full flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <ToolIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">
                {targetTool ? `Select Case for ${targetTool.label}` : 'Select Active Case'}
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                {targetTool
                  ? `Choose an investigation case to launch ${targetTool.label}`
                  : 'Choose a case to focus your workspace analysis'}
              </p>
            </div>
          </div>
          <button
            onClick={closeCaseSelector}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by case name, investigator, status..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700/70 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              autoFocus
            />
          </div>
        </div>

        {/* Case List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-brand-400" />
              <span className="text-sm">Loading investigation cases...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 px-4">
              <FolderOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-300 font-medium text-sm">No matching cases found</p>
              <p className="text-slate-500 text-xs mt-1 mb-4">
                {search ? 'Try adjusting your search terms' : 'You need at least one case to use this tool'}
              </p>
              <button
                onClick={() => {
                  closeCaseSelector()
                  navigate('/cases/new')
                }}
                className="btn-brand inline-flex items-center gap-2 text-xs py-2 px-3"
              >
                <Plus className="w-3.5 h-3.5" /> Create New Case
              </button>
            </div>
          ) : (
            filtered.map(c => {
              const isCurrent = c.id === activeCaseId
              return (
                <button
                  key={c.id}
                  onClick={() => handleSelect(c)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between group ${
                    isCurrent
                      ? 'bg-brand-600/15 border-brand-500/40 text-white'
                      : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/80 hover:border-slate-600 text-slate-200'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm truncate text-white group-hover:text-brand-300 transition-colors">
                        {c.title}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] bg-brand-500/20 text-brand-300 border border-brand-500/30 px-1.5 py-0.5 rounded font-medium">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                      <span className="capitalize text-slate-400">
                        Status: <span className="text-slate-300 font-medium">{c.status}</span>
                      </span>
                      {c.priority && (
                        <span className="capitalize text-slate-400">
                          Priority: <span className="text-slate-300 font-medium">{c.priority}</span>
                        </span>
                      )}
                      <span>
                        Evidence: <span className="text-slate-300 font-medium">{c.evidence_count ?? 0}</span>
                      </span>
                      <span>
                        Entities: <span className="text-slate-300 font-medium">{c.entity_count ?? 0}</span>
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 text-slate-400 group-hover:text-brand-400 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            {filtered.length} case{filtered.length !== 1 ? 's' : ''} available
          </span>
          <button
            onClick={() => {
              closeCaseSelector()
              navigate('/cases/new')
            }}
            className="flex items-center gap-1.5 text-brand-400 hover:text-brand-300 font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> New Case
          </button>
        </div>
      </div>
    </div>
  )
}
