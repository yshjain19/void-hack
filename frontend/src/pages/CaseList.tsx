import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, Search, Filter, FolderOpen, ArrowRight,
  AlertTriangle, ChevronDown
} from 'lucide-react'
import { casesApi } from '../lib/api'
import { formatDateTime } from '../lib/utils'
import { RiskBadge } from '../components/RiskBadge'

const STATUS_OPTIONS = ['all', 'open', 'active', 'pending', 'closed', 'archived']
const PRIORITY_OPTIONS = ['all', 'critical', 'high', 'medium', 'low']

export default function CaseList() {
  const [cases, setCases] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [priority, setPriority] = useState('all')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 20

  const load = async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = {
        limit: PAGE_SIZE,
        skip: page * PAGE_SIZE,
      }
      if (search) params.search = search
      if (status !== 'all') params.status = status
      if (priority !== 'all') params.priority = priority
      const res = await casesApi.list(params)
      setCases(res.data.items || [])
      setTotal(res.data.total || 0)
    } catch {
      setCases(MOCK_CASES)
      setTotal(MOCK_CASES.length)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [search, status, priority, page])

  const priorityScore = (p: string) =>
    ({ critical: 0.9, high: 0.6, medium: 0.35, low: 0.1 }[p] ?? 0.1)

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Investigation Cases</h1>
          <p className="text-slate-400 text-sm mt-1">{total} cases total</p>
        </div>
        <Link to="/cases/new" className="btn-brand flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Case
        </Link>
      </div>

      {/* Filters */}
      <div className="glass p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search cases..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            className="form-input pl-9 text-sm"
          />
        </div>
        <div className="relative">
          <select
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(0) }}
            className="form-input text-sm pr-8 appearance-none cursor-pointer"
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s} className="bg-slate-900">
                {s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={priority}
            onChange={e => { setPriority(e.target.value); setPage(0) }}
            className="form-input text-sm pr-8 appearance-none cursor-pointer"
          >
            {PRIORITY_OPTIONS.map(p => (
              <option key={p} value={p} className="bg-slate-900">
                {p === 'all' ? 'All Priorities' : p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="glass overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : cases.length === 0 ? (
          <div className="text-center py-16">
            <FolderOpen className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400">No cases found</p>
            <Link to="/cases/new" className="text-brand-400 hover:underline text-sm mt-2 inline-block">
              Create your first case →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Case</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Investigator</th>
                  <th>Evidence</th>
                  <th>Entities</th>
                  <th>Reports</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cases.map(c => (
                  <tr key={c.id} className="group">
                    <td>
                      <Link
                        to={`/cases/${c.id}`}
                        className="text-slate-200 hover:text-brand-300 font-medium transition-colors"
                      >
                        {c.title}
                      </Link>
                      {c.tags && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {c.tags.split(',').slice(0, 3).map((tag: string) => (
                            <span key={tag} className="text-xs bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border status-${c.status}`}>
                        {c.status}
                      </span>
                    </td>
                    <td><RiskBadge score={priorityScore(c.priority)} /></td>
                    <td><span className="text-slate-400 text-sm">{c.investigator || '—'}</span></td>
                    <td>
                      <span className="text-slate-300 font-mono text-sm">{c.evidence_count}</span>
                    </td>
                    <td>
                      <span className="text-slate-300 font-mono text-sm">{c.entity_count}</span>
                    </td>
                    <td>
                      <span className="text-slate-300 font-mono text-sm">{c.report_count}</span>
                    </td>
                    <td>
                      <span className="text-slate-500 text-xs">{formatDateTime(c.created_at)}</span>
                    </td>
                    <td>
                      <Link to={`/cases/${c.id}`} className="text-brand-400 hover:text-brand-300 opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
            <span className="text-xs text-slate-500">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="btn-ghost text-xs py-1 px-3 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={(page + 1) * PAGE_SIZE >= total}
                className="btn-ghost text-xs py-1 px-3 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const MOCK_CASES = [
  { id: '1', title: 'Operation Wire Fraud Alpha', status: 'active', priority: 'critical', investigator: 'Det. Chen', evidence_count: 12, entity_count: 34, report_count: 2, tags: 'wire-fraud,financial', created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: '2', title: 'Phishing Campaign Analysis', status: 'open', priority: 'high', investigator: 'Agent Torres', evidence_count: 7, entity_count: 18, report_count: 0, tags: 'phishing,email', created_at: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: '3', title: 'Insider Threat — Finance Dept', status: 'pending', priority: 'medium', investigator: 'Dr. Patel', evidence_count: 3, entity_count: 9, report_count: 1, tags: 'insider-threat', created_at: new Date(Date.now() - 86400000 * 8).toISOString() },
  { id: '4', title: 'BEC Scheme Investigation', status: 'closed', priority: 'high', investigator: 'Det. Müller', evidence_count: 22, entity_count: 61, report_count: 5, tags: 'bec,email,financial', created_at: new Date(Date.now() - 86400000 * 30).toISOString() },
]
