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
      const items = res.data.items || []
      if (items.length > 0) {
        setCases(items)
        setTotal(res.data.total || items.length)
      } else {
        setCases(MOCK_CASES)
        setTotal(MOCK_CASES.length)
      }
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
    <div className="space-y-5 max-w-7xl mx-auto animate-slide-up">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-950 tracking-tight">Investigation Cases</h1>
          <p className="text-zinc-500 text-sm mt-0.5">{total} total active & archived cases</p>
        </div>
        <Link to="/cases/new" className="btn-brand flex items-center gap-2 text-sm shadow-sm">
          <Plus className="w-4 h-4" />
          <span>New Case</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="glass p-4 flex flex-wrap gap-3 items-center border-zinc-200/90 shadow-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search cases by keyword or tag..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            className="form-input pl-9 text-sm"
          />
        </div>
        <div className="relative min-w-[130px]">
          <select
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(0) }}
            className="form-input text-sm pr-8 appearance-none cursor-pointer"
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s} className="bg-white text-zinc-900">
                {s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
        </div>
        <div className="relative min-w-[130px]">
          <select
            value={priority}
            onChange={e => { setPriority(e.target.value); setPage(0) }}
            className="form-input text-sm pr-8 appearance-none cursor-pointer"
          >
            {PRIORITY_OPTIONS.map(p => (
              <option key={p} value={p} className="bg-white text-zinc-900">
                {p === 'all' ? 'All Priorities' : p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="glass overflow-hidden border-zinc-200/90 shadow-xs">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : cases.length === 0 ? (
          <div className="text-center py-16">
            <FolderOpen className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-700 font-bold text-base">No matching investigation cases found</p>
            <p className="text-zinc-500 text-xs mt-1">Try resetting the filter criteria or register a new investigation</p>
            <Link to="/cases/new" className="btn-brand text-xs inline-flex items-center gap-1.5 mt-4">
              <Plus className="w-3.5 h-3.5" />
              Create New Case
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Case Identification</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Lead Investigator</th>
                  <th>Evidence</th>
                  <th>Entities</th>
                  <th>Reports</th>
                  <th>Registered</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cases.map(c => (
                  <tr key={c.id} className="group">
                    <td>
                      <Link
                        to={`/cases/${c.id}`}
                        className="text-zinc-950 hover:text-red-600 font-bold transition-colors block"
                      >
                        {c.title}
                      </Link>
                      {c.tags && (
                        <div className="flex gap-1.5 mt-1 flex-wrap">
                          {c.tags.split(',').slice(0, 3).map((tag: string) => (
                            <span key={tag} className="text-[10px] font-semibold bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded border border-zinc-200">
                              #{tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border status-${c.status}`}>
                        {c.status}
                      </span>
                    </td>
                    <td><RiskBadge score={priorityScore(c.priority)} /></td>
                    <td><span className="text-zinc-700 text-xs font-semibold">{c.investigator || 'Unassigned'}</span></td>
                    <td>
                      <span className="text-zinc-800 font-mono text-xs font-bold">{c.evidence_count}</span>
                    </td>
                    <td>
                      <span className="text-zinc-800 font-mono text-xs font-bold">{c.entity_count}</span>
                    </td>
                    <td>
                      <span className="text-zinc-800 font-mono text-xs font-bold">{c.report_count}</span>
                    </td>
                    <td>
                      <span className="text-zinc-500 text-xs font-medium">{formatDateTime(c.created_at)}</span>
                    </td>
                    <td>
                      <Link to={`/cases/${c.id}`} className="text-zinc-400 hover:text-red-600 p-1 inline-block transition-colors">
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200 bg-zinc-50/70">
            <span className="text-xs font-semibold text-zinc-500">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total} cases
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
  { id: 'case-01', title: 'Operation Apex Offshore — Shell Laundering', status: 'active', priority: 'critical', investigator: 'Agent Sarah Vance', evidence_count: 8, entity_count: 26, report_count: 3, tags: 'bvi,shell-corp,ubo,money-laundering', created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'case-02', title: 'Circular Wire Fraud & Escrow Drain', status: 'active', priority: 'high', investigator: 'Det. Marcus Chen', evidence_count: 14, entity_count: 38, report_count: 2, tags: 'wire-fraud,escrow,round-tripping', created_at: new Date(Date.now() - 86400000 * 4).toISOString() },
  { id: 'case-03', title: 'Falcon Energy Phantom Invoicing Loop', status: 'open', priority: 'critical', investigator: 'Forensic Lead Elena Rostova', evidence_count: 19, entity_count: 42, report_count: 4, tags: 'phantom-invoicing,procurement,kickbacks', created_at: new Date(Date.now() - 86400000 * 7).toISOString() },
  { id: 'case-04', title: 'Silicon Alpha Executive BEC Compromise', status: 'pending', priority: 'high', investigator: 'Special Agent Torres', evidence_count: 6, entity_count: 15, report_count: 1, tags: 'bec,email-spoofing,social-engineering', created_at: new Date(Date.now() - 86400000 * 11).toISOString() },
  { id: 'case-05', title: 'Panama Layered Trust Embezzlement', status: 'closed', priority: 'medium', investigator: 'Dr. Arthur Sterling', evidence_count: 11, entity_count: 31, report_count: 2, tags: 'trust-funds,embezzlement,offshore', created_at: new Date(Date.now() - 86400000 * 25).toISOString() },
  { id: 'case-06', title: 'Cryptocurrency Wash Trading Syndicate', status: 'open', priority: 'critical', investigator: 'CyberTrace Cyber Taskforce', evidence_count: 27, entity_count: 64, report_count: 5, tags: 'crypto,wash-trading,tether-flow', created_at: new Date(Date.now() - 86400000 * 32).toISOString() },
]
