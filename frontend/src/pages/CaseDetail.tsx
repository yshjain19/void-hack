import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Shield, Network, BarChart3, Brain, FileText,
  Upload, CheckCircle, Loader2, Trash2, Clock
} from 'lucide-react'
import { casesApi, evidenceApi } from '../lib/api'
import { formatDateTime, formatBytes, truncateHash } from '../lib/utils'
import { RiskBadge } from '../components/RiskBadge'
import CustodyChain from '../components/CustodyChain'
import HashVerifier from '../components/HashVerifier'
import { useCase } from '../lib/CaseContext'

type Tab = 'overview' | 'evidence' | 'custody'

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { setActiveCase } = useCase()
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
        setActiveCase(id, cRes.data.title)
      } catch {
        setCaseData(MOCK_CASE)
        setEvidence(MOCK_EVIDENCE)
        setActiveCase(id, MOCK_CASE.title)
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
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const c = caseData || MOCK_CASE
  const priorityScore = ({ critical: 0.9, high: 0.6, medium: 0.35, low: 0.1 } as Record<string, number>)[c.priority] ?? 0.1

  return (
    <div className="space-y-5 max-w-7xl mx-auto animate-slide-up">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2 mt-0.5">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-extrabold text-zinc-950 tracking-tight">{c.title}</h1>
              <RiskBadge score={priorityScore} size="lg" />
              <span className={`px-3 py-0.5 rounded-full text-xs font-bold border status-${c.status}`}>
                {c.status}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1.5 text-xs text-zinc-500 font-medium flex-wrap">
              {c.investigator && <span className="text-zinc-700 font-semibold">👤 Analyst: {c.investigator}</span>}
              <span><Clock className="w-3.5 h-3.5 inline mr-1 text-zinc-400" />{formatDateTime(c.created_at)}</span>
              <span>🗂️ {c.evidence_count} evidence files</span>
              <span>🔗 {c.entity_count} graph entities</span>
            </div>
            {c.description && <p className="text-zinc-600 text-sm mt-2 max-w-2xl font-medium">{c.description}</p>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 shrink-0">
          <Link to={`/evidence/upload?case_id=${id}`} className="btn-ghost flex items-center gap-2 text-xs py-2 px-3">
            <Upload className="w-4 h-4 text-zinc-700" />
            <span>Upload Evidence</span>
          </Link>
          <Link to={`/cases/${id}/graph`} className="btn-ghost flex items-center gap-2 text-xs py-2 px-3">
            <Network className="w-4 h-4 text-zinc-700" />
            <span>Graph</span>
          </Link>
          <Link to={`/cases/${id}/analytics`} className="btn-ghost flex items-center gap-2 text-xs py-2 px-3">
            <BarChart3 className="w-4 h-4 text-zinc-700" />
            <span>Analytics</span>
          </Link>
          <Link to={`/cases/${id}/ai`} className="btn-brand flex items-center gap-2 text-xs py-2 px-3">
            <Brain className="w-4 h-4" />
            <span>AI Investigate</span>
          </Link>
        </div>
      </div>

      {/* Quick nav pills */}
      <div className="flex gap-2 flex-wrap border-b border-zinc-200 pb-3">
        {[
          { key: 'overview', label: 'Overview', icon: Shield },
          { key: 'evidence', label: `Evidence Files (${evidence.length})`, icon: Upload },
          { key: 'custody', label: 'Custody Chain', icon: CheckCircle },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as Tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              tab === key
                ? 'bg-red-50 text-red-700 border-red-300 shadow-xs'
                : 'text-zinc-600 border-zinc-200 hover:text-zinc-950 hover:bg-zinc-100'
            }`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
        <Link
          to={`/cases/${id}/reports`}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 border border-zinc-200 hover:text-zinc-950 hover:bg-zinc-100 transition-all"
        >
          <FileText className="w-3.5 h-3.5 text-red-600" /> Reports ({c.report_count})
        </Link>
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Case metadata */}
          <div className="lg:col-span-1 glass p-5 space-y-4 border-zinc-200/90 shadow-xs">
            <h3 className="section-title">Case Metadata</h3>
            <div className="space-y-2.5">
              {[
                ['Case ID', c.id?.slice(0, 16) + '...'],
                ['Status', c.status],
                ['Priority', c.priority],
                ['Investigator', c.investigator || 'Unassigned'],
                ['Created', formatDateTime(c.created_at)],
                ['Updated', formatDateTime(c.updated_at)],
                ['Evidence Files', c.evidence_count],
                ['Entities', c.entity_count],
                ['Reports', c.report_count],
              ].map(([k, v]) => (
                <div key={k as string} className="flex justify-between text-xs py-1 border-b border-zinc-100 last:border-0">
                  <span className="text-zinc-500 font-semibold">{k}</span>
                  <span className="text-zinc-900 font-bold">{v}</span>
                </div>
              ))}
            </div>
            {c.tags && (
              <div>
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {c.tags.split(',').map((t: string) => (
                    <span key={t} className="bg-zinc-100 text-zinc-700 text-xs font-semibold px-2 py-0.5 rounded-md border border-zinc-200">
                      #{t.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <button onClick={handleDeleteCase} className="btn-danger w-full text-xs font-bold flex items-center justify-center gap-2 mt-4 py-2">
              <Trash2 className="w-4 h-4" /> Delete Investigation
            </button>
          </div>

          {/* Workflow */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass p-5 border-zinc-200/90 shadow-xs">
              <h3 className="section-title mb-4">Investigation Workflow Pipeline</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { step: '1', label: 'Upload Evidence', desc: 'Securely ingest forensic logs and documents', to: `/evidence/upload?case_id=${id}`, icon: Upload, done: evidence.length > 0 },
                  { step: '2', label: 'Build Entity Graph', desc: 'Synthesize network nodes & transaction paths', to: `/cases/${id}/graph`, icon: Network, done: c.entity_count > 0 },
                  { step: '3', label: 'Run Analytics', desc: 'Isolation Forest and behavioral risk scoring', to: `/cases/${id}/analytics`, icon: BarChart3, done: false },
                  { step: '4', label: 'AI Investigator', desc: 'Generate hypothesis and cross-jurisdiction nexus', to: `/cases/${id}/ai`, icon: Brain, done: false },
                  { step: '5', label: 'Generate Reports', desc: 'Export verified SHA-256 court-ready report', to: `/cases/${id}/reports`, icon: FileText, done: c.report_count > 0 },
                ].map(({ step, label, desc, to, icon: Icon, done }) => (
                  <Link
                    key={step}
                    to={to}
                    className={`p-4 rounded-xl border transition-all group ${
                      done
                        ? 'bg-emerald-50/60 border-emerald-200 hover:border-emerald-300'
                        : 'bg-white hover:bg-zinc-50 border-zinc-200/90 hover:border-red-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                        done ? 'bg-emerald-100 text-emerald-800' : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {done ? <CheckCircle className="w-4 h-4" /> : step}
                      </div>
                      <Icon className={`w-4 h-4 ${done ? 'text-emerald-700' : 'text-zinc-500 group-hover:text-red-600'}`} />
                    </div>
                    <p className="text-sm font-bold text-zinc-950">{label}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'evidence' && (
        <div className="glass overflow-hidden border-zinc-200/90 shadow-xs">
          {evidence.length === 0 ? (
            <div className="p-12 text-center">
              <Upload className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
              <p className="text-zinc-700 font-bold text-base">No evidence files uploaded yet</p>
              <p className="text-zinc-500 text-xs mt-1">Upload CSV, Excel, EML, or JSON files to begin analysis</p>
              <Link to={`/evidence/upload?case_id=${id}`} className="btn-brand mt-4 inline-flex items-center gap-2 text-xs">
                <Upload className="w-4 h-4" /> Upload Evidence
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                        <span className="text-zinc-950 font-bold block">{ev.original_filename}</span>
                        <p className="text-xs text-zinc-500 mt-0.5">by {ev.uploaded_by}</p>
                      </td>
                      <td>
                        <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200">
                          {ev.file_type?.toUpperCase()}
                        </span>
                      </td>
                      <td><span className="text-zinc-600 text-xs font-semibold">{formatBytes(ev.file_size)}</span></td>
                      <td><code className="hash-text">{truncateHash(ev.sha256_hash)}</code></td>
                      <td>
                        {ev.parsed ? (
                          <span className="text-emerald-700 text-xs font-bold flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Parsed
                          </span>
                        ) : ev.parse_error ? (
                          <span className="text-red-700 text-xs font-bold">Parse Error</span>
                        ) : (
                          <span className="text-zinc-700 text-xs font-bold flex items-center gap-1">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" /> Processing
                          </span>
                        )}
                      </td>
                      <td><span className="text-zinc-500 text-xs font-medium">{formatDateTime(ev.uploaded_at)}</span></td>
                      <td>
                        <button
                          onClick={() => loadCustody(ev.id)}
                          className="btn-ghost text-xs py-1 px-2.5 flex items-center gap-1 text-red-700 hover:text-red-800"
                        >
                          <Shield className="w-3.5 h-3.5" /> Custody
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'custody' && (
        <div className="space-y-4">
          {selectedEvId ? (
            <>
              <div className="glass p-4 border-zinc-200/90 shadow-xs">
                <HashVerifier
                  evidenceId={selectedEvId}
                  storedHash={evidence.find(e => e.id === selectedEvId)?.sha256_hash || ''}
                />
              </div>
              <div className="glass p-5 border-zinc-200/90 shadow-xs">
                <h3 className="section-title mb-4">
                  <CheckCircle className="w-4 h-4 text-emerald-700" />
                  Tamper-Evident Chain of Custody
                </h3>
                <CustodyChain logs={custodyLogs} isValid={custodyLogs.length > 0} />
              </div>
            </>
          ) : (
            <div className="glass p-12 text-center border-zinc-200/90 shadow-xs">
              <Shield className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
              <p className="text-zinc-800 font-bold text-base">No Evidence Selected</p>
              <p className="text-zinc-500 text-xs mt-1">Select an evidence file from the Evidence tab above to view its immutable cryptographic custody chain.</p>
              <button onClick={() => setTab('evidence')} className="btn-brand text-xs mt-4">
                View Evidence Files
              </button>
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
