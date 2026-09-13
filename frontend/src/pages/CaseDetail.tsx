import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Shield, Network, BarChart3, Brain, FileText,
  Upload, Edit3, CheckCircle, Loader2, Trash2, Clock
} from 'lucide-react'
import { casesApi, evidenceApi } from '../lib/api'
import { formatDateTime, formatBytes, truncateHash } from '../lib/utils'
import { RiskBadge } from '../components/RiskBadge'
import CustodyChain from '../components/CustodyChain'
import HashVerifier from '../components/HashVerifier'

type Tab = 'overview' | 'evidence' | 'custody'

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [caseData, setCaseData] = useState<any>(null)
  const [evidence, setEvidence] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('overview')
  const [selectedEvId, setSelectedEvId] = useState<string | null>(null)
  const [custodyLogs, setCustodyLogs] = useState<any[]>([])

  useEffect(() => {
    if (!id) return
    const load = async () => {
      setLoading(true)
      try {
        const [cRes, eRes] = await Promise.all([casesApi.get(id), evidenceApi.list(id)])
        setCaseData(cRes.data)
        setEvidence(eRes.data)
      } catch {
        setCaseData(MOCK_CASE)
        setEvidence(MOCK_EVIDENCE)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const loadCustody = async (evId: string) => {
    setSelectedEvId(evId)
    try {
      const res = await evidenceApi.getCustody(evId)
      setCustodyLogs(res.data)
    } catch {
      setCustodyLogs(MOCK_CUSTODY)
    }
    setTab('custody')
  }

  const handleDeleteCase = async () => {
    if (!confirm('Delete this entire case and all evidence? This cannot be undone.')) return
    try {
      await casesApi.delete(id!)
      navigate('/cases')
    } catch {
      alert('Failed to delete case')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const c = caseData || MOCK_CASE
  const priorityScore = ({ critical: 0.9, high: 0.6, medium: 0.35, low: 0.1 } as Record<string, number>)[c.priority] ?? 0.1

  return (
    <div className="space-y-5 max-w-7xl mx-auto animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2 mt-1">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-white">{c.title}</h1>
              <RiskBadge score={priorityScore} size="lg" />
              <span className={`px-3 py-1 rounded-full text-sm font-medium border status-${c.status}`}>
                {c.status}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1.5 text-sm text-slate-400 flex-wrap">
              {c.investigator && <span>👤 {c.investigator}</span>}
              <span><Clock className="w-3.5 h-3.5 inline mr-1" />{formatDateTime(c.created_at)}</span>
              <span>🗂️ {c.evidence_count} files</span>
              <span>🔗 {c.entity_count} entities</span>
            </div>
            {c.description && <p className="text-slate-500 text-sm mt-2 max-w-2xl">{c.description}</p>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 shrink-0">
          <Link to={`/evidence/upload?case_id=${id}`} className="btn-ghost flex items-center gap-2 text-sm">
            <Upload className="w-4 h-4" /> Upload Evidence
          </Link>
          <Link to={`/cases/${id}/graph`} className="btn-ghost flex items-center gap-2 text-sm">
            <Network className="w-4 h-4" /> Graph
          </Link>
          <Link to={`/cases/${id}/analytics`} className="btn-ghost flex items-center gap-2 text-sm">
            <BarChart3 className="w-4 h-4" /> Analytics
          </Link>
          <Link to={`/cases/${id}/ai`} className="btn-brand flex items-center gap-2 text-sm">
            <Brain className="w-4 h-4" /> AI Investigate
          </Link>
        </div>
      </div>

      {/* Quick nav pills */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'overview', label: 'Overview', icon: Shield },
          { key: 'evidence', label: `Evidence (${evidence.length})`, icon: Upload },
          { key: 'custody', label: 'Custody Chain', icon: CheckCircle },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as Tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
              tab === key
                ? 'bg-brand-600/20 text-brand-300 border-brand-500/40'
                : 'text-slate-400 border-slate-700/50 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
        <Link to={`/cases/${id}/reports`} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-400 border border-slate-700/50 hover:text-slate-200 hover:bg-slate-800/40 transition-all">
          <FileText className="w-4 h-4" /> Reports ({c.report_count})
        </Link>
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Case metadata */}
          <div className="lg:col-span-1 glass p-5 space-y-4">
            <h3 className="section-title">Case Metadata</h3>
            {[
              ['Case ID', c.id?.slice(0, 16) + '...'],
              ['Status', c.status],
              ['Priority', c.priority],
              ['Investigator', c.investigator || '—'],
              ['Created', formatDateTime(c.created_at)],
              ['Updated', formatDateTime(c.updated_at)],
              ['Evidence Files', c.evidence_count],
              ['Entities', c.entity_count],
              ['Reports', c.report_count],
            ].map(([k, v]) => (
              <div key={k as string} className="flex justify-between text-sm">
                <span className="text-slate-500">{k}</span>
                <span className="text-slate-300 font-medium">{v}</span>
              </div>
            ))}
            {c.tags && (
              <div>
                <p className="text-slate-500 text-xs mb-2">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {c.tags.split(',').map((t: string) => (
                    <span key={t} className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded">
                      {t.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <button onClick={handleDeleteCase} className="btn-danger w-full text-sm flex items-center justify-center gap-2 mt-4">
              <Trash2 className="w-4 h-4" /> Delete Case
            </button>
          </div>

          {/* Next steps */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass p-5">
              <h3 className="section-title mb-4">Investigation Workflow</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { step: '1', label: 'Upload Evidence', desc: 'Add files for analysis', to: `/evidence/upload?case_id=${id}`, icon: Upload, done: evidence.length > 0 },
                  { step: '2', label: 'Build Graph', desc: 'Extract entities & relationships', to: `/cases/${id}/graph`, icon: Network, done: c.entity_count > 0 },
                  { step: '3', label: 'Run Analytics', desc: 'Detect anomalies & risk', to: `/cases/${id}/analytics`, icon: BarChart3, done: false },
                  { step: '4', label: 'AI Investigation', desc: 'Get AI-powered insights', to: `/cases/${id}/ai`, icon: Brain, done: false },
                  { step: '5', label: 'Generate Report', desc: 'Export PDF/JSON report', to: `/cases/${id}/reports`, icon: FileText, done: c.report_count > 0 },
                ].map(({ step, label, desc, to, icon: Icon, done }) => (
                  <Link
                    key={step}
                    to={to}
                    className={`p-4 rounded-xl border transition-all group ${
                      done
                        ? 'bg-emerald-500/5 border-emerald-500/30'
                        : 'bg-slate-800/30 border-slate-700/50 hover:border-brand-500/40 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-brand-600/20 text-brand-400'
                      }`}>
                        {done ? <CheckCircle className="w-4 h-4" /> : step}
                      </div>
                      <Icon className={`w-4 h-4 ${done ? 'text-emerald-400' : 'text-slate-400 group-hover:text-brand-400'}`} />
                    </div>
                    <p className="text-sm font-semibold text-slate-200">{label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'evidence' && (
        <div className="glass overflow-hidden">
          {evidence.length === 0 ? (
            <div className="p-12 text-center">
              <Upload className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400">No evidence uploaded yet</p>
              <Link to={`/evidence/upload?case_id=${id}`} className="btn-brand mt-4 inline-flex items-center gap-2">
                <Upload className="w-4 h-4" /> Upload Evidence
              </Link>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>SHA-256 (partial)</th>
                  <th>Status</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {evidence.map(ev => (
                  <tr key={ev.id}>
                    <td>
                      <span className="text-slate-200 font-medium">{ev.original_filename}</span>
                      <p className="text-xs text-slate-500 mt-0.5">by {ev.uploaded_by}</p>
                    </td>
                    <td>
                      <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-800 text-slate-400 border border-slate-700">
                        {ev.file_type?.toUpperCase()}
                      </span>
                    </td>
                    <td><span className="text-slate-400 text-sm">{formatBytes(ev.file_size)}</span></td>
                    <td><code className="hash-text">{truncateHash(ev.sha256_hash)}</code></td>
                    <td>
                      {ev.parsed ? (
                        <span className="text-emerald-400 text-xs flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Parsed
                        </span>
                      ) : ev.parse_error ? (
                        <span className="text-red-400 text-xs">Parse Error</span>
                      ) : (
                        <span className="text-amber-400 text-xs flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> Processing
                        </span>
                      )}
                    </td>
                    <td><span className="text-slate-500 text-xs">{formatDateTime(ev.uploaded_at)}</span></td>
                    <td>
                      <button
                        onClick={() => loadCustody(ev.id)}
                        className="text-brand-400 hover:text-brand-300 text-xs flex items-center gap-1"
                      >
                        <Shield className="w-3 h-3" /> Custody
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'custody' && (
        <div className="space-y-4">
          {selectedEvId ? (
            <>
              <div className="glass p-4">
                <HashVerifier
                  evidenceId={selectedEvId}
                  storedHash={evidence.find(e => e.id === selectedEvId)?.sha256_hash || ''}
                />
              </div>
              <div className="glass p-5">
                <h3 className="section-title mb-4">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Chain of Custody
                </h3>
                <CustodyChain logs={custodyLogs} isValid={custodyLogs.length > 0} />
              </div>
            </>
          ) : (
            <div className="glass p-8 text-center">
              <Shield className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Select an evidence file from the Evidence tab to view its custody chain</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const MOCK_CASE = {
  id: 'mock-case-id-0001', title: 'Operation Wire Fraud Alpha', description: 'Investigation into suspected wire fraud involving multiple offshore accounts.',
  status: 'active', priority: 'critical', investigator: 'Det. Chen', tags: 'wire-fraud,financial,cross-border',
  evidence_count: 3, entity_count: 12, report_count: 0,
  created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  updated_at: new Date(Date.now() - 86400000).toISOString(),
}
const MOCK_EVIDENCE = [
  { id: 'ev-1', original_filename: 'transactions_Q3.xlsx', file_type: 'excel', file_size: 245_123, sha256_hash: 'a3f4b9c1d2e5...', parsed: true, uploaded_by: 'Det. Chen', uploaded_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 'ev-2', original_filename: 'suspicious_email.eml', file_type: 'email', file_size: 12_445, sha256_hash: 'b7e3a1c9f2d4...', parsed: true, uploaded_by: 'Agent Torres', uploaded_at: new Date(Date.now() - 7200000).toISOString() },
]
const MOCK_CUSTODY = [
  { id: 'c1', evidence_id: 'ev-1', action: 'UPLOADED', actor: 'Det. Chen', timestamp: new Date(Date.now() - 3600000).toISOString(), sequence: 0, prev_hash: '0'.repeat(64), chain_hash: 'abc123...', event_metadata: {} },
  { id: 'c2', evidence_id: 'ev-1', action: 'ACCESSED', actor: 'System', timestamp: new Date(Date.now() - 1800000).toISOString(), sequence: 1, prev_hash: 'abc123...', chain_hash: 'def456...', event_metadata: {} },
]
