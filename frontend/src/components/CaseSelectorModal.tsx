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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-2xl max-w-xl w-full flex flex-col max-h-[85vh] overflow-hidden text-zinc-900">
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
              <ToolIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-950 text-lg">
                {targetTool ? `Select Case for ${targetTool.label}` : 'Select Active Case'}
              </h3>
              <p className="text-zinc-500 text-xs mt-0.5">
                Choose an investigation to analyze with this forensic tool
              </p>
            </div>
          </div>
          <button
            onClick={closeCaseSelector}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-zinc-200 bg-zinc-50/70">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter cases by title, analyst, status..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-input pl-9 text-sm"
              autoFocus
            />
          </div>
        </div>

        {/* Case list */}
        <div className="p-4 space-y-2.5 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-zinc-400">
              <Loader2 className="w-6 h-6 animate-spin text-red-600" />
              <span className="text-xs font-semibold">Loading available cases...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-zinc-500 space-y-3">
              <FolderOpen className="w-10 h-10 text-zinc-300 mx-auto" />
              <p className="text-sm font-semibold text-zinc-700">No matching investigation cases found</p>
              <button
                onClick={() => {
                  closeCaseSelector()
                  navigate('/cases/new')
                }}
                className="btn-brand text-xs inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Create New Investigation
              </button>
            </div>
          ) : (
            filtered.map(c => {
              const isSelected = c.id === activeCaseId
              return (
                <button
                  key={c.id}
                  onClick={() => handleSelect(c)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 group ${
                    isSelected
                      ? 'bg-red-50/80 border-red-300 ring-1 ring-red-500/30'
                      : 'bg-white hover:bg-zinc-50/90 border-zinc-200 hover:border-red-300'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-zinc-950 group-hover:text-red-700 transition-colors">
                        {c.title}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded-full">
                          ACTIVE
                        </span>
                      )}
                      <span className={`text-[11px] px-2 py-0.5 rounded-md border font-semibold ${
                        c.priority === 'critical' ? 'bg-red-100 text-red-800 border-red-200' :
                        c.priority === 'high' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-zinc-100 text-zinc-800 border-zinc-200'
                      }`}>
                        {c.priority}
                      </span>
                    </div>
                    {c.description && (
                      <p className="text-xs text-zinc-600 truncate mt-1">{c.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-zinc-400 font-medium">
                      <span>{c.investigator ? `Analyst: ${c.investigator}` : 'Unassigned'}</span>
                      <span>•</span>
                      <span>{c.evidence_count || 0} evidence</span>
                      <span>•</span>
                      <span>{formatDateTime(c.created_at)}</span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 group-hover:bg-red-600 group-hover:text-white text-zinc-500 flex items-center justify-center shrink-0 transition-all">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between">
          <button
            onClick={() => {
              closeCaseSelector()
              navigate('/cases/new')
            }}
            className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Create New Case
          </button>
          <button
            onClick={closeCaseSelector}
            className="btn-ghost text-xs py-1.5 px-3"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
