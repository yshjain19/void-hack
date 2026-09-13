import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, BarChart3, Zap, AlertTriangle, RefreshCw, Loader2, TrendingUp } from 'lucide-react'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Legend
} from 'recharts'
import { analyticsApi } from '../lib/api'
import { RiskBadge, RiskBar } from '../components/RiskBadge'
import { getRiskColor } from '../lib/utils'
import { useCase } from '../lib/CaseContext'

export default function AnalyticsView() {
  const { id: caseId } = useParams<{ id: string }>()
  const { setActiveCase } = useCase()
  const [anomalies, setAnomalies] = useState<any[]>([])
  const [entities, setEntities] = useState<any[]>([])
  const [running, setRunning] = useState(false)
  const [loading, setLoading] = useState(true)
  const [runResult, setRunResult] = useState<any>(null)

  useEffect(() => {
    if (caseId) setActiveCase(caseId)
  }, [caseId])

  const load = async () => {
    setLoading(true)
    try {
      const [aRes, eRes] = await Promise.all([
        analyticsApi.getAnomalies(caseId!),
        analyticsApi.getRiskScores(caseId!),
      ])
      setAnomalies(aRes.data)
      setEntities(eRes.data)
    } catch {
      setAnomalies(MOCK_ANOMALIES)
      setEntities(MOCK_ENTITIES)
    } finally {
      setLoading(false)
    }
  }

  const runDetection = async () => {
    setRunning(true)
    try {
      const [aRes, rRes] = await Promise.all([
        analyticsApi.runAnomaly(caseId!),
        analyticsApi.runRisk(caseId!),
      ])
      setRunResult(aRes.data)
      await load()
    } catch {
      alert('Run detection failed — using mock data')
      setAnomalies(MOCK_ANOMALIES)
      setEntities(MOCK_ENTITIES)
      setLoading(false)
    } finally {
      setRunning(false)
    }
  }

  useEffect(() => { load() }, [caseId])

  // Chart data
  const scatterData = anomalies.map((a, i) => ({
    x: a.row_index ?? i,
    y: Math.abs(a.anomaly_score),
    anomaly: a.is_anomaly,
    explanation: a.explanation,
  }))

  const topEntities = entities.slice(0, 10)
  const entityTypeGroups = entities.reduce((acc: Record<string, number>, e: any) => {
    acc[e.entity_type] = (acc[e.entity_type] || 0) + 1
    return acc
  }, {})

  const typeData = Object.entries(entityTypeGroups).map(([name, count]) => ({ name, count }))

  return (
    <div className="space-y-5 max-w-7xl mx-auto animate-slide-up">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to={`/cases/${caseId}`} className="btn-ghost p-2">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <BarChart3 className="w-5 h-5 text-brand-400" />
          <div>
            <h2 className="font-bold text-white">Analytics & Anomaly Detection</h2>
            <p className="text-xs text-slate-500">
              {anomalies.length} anomalies · {entities.length} entities scored
            </p>
          </div>
        </div>
        <button onClick={runDetection} disabled={running} className="btn-brand flex items-center gap-2">
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {running ? 'Running...' : 'Run Detection'}
        </button>
      </div>

      {/* Run result banner */}
      {runResult && (
        <div className="glass p-4 border-l-4 border-brand-500 flex items-center gap-4 animate-fade-in">
          <TrendingUp className="w-5 h-5 text-brand-400 shrink-0" />
          <div className="flex flex-wrap gap-4 md:gap-6 text-sm">
            <div><span className="text-slate-500">Total Records:</span> <strong className="text-slate-200">{runResult.total_records}</strong></div>
            <div><span className="text-slate-500">Anomalies:</span> <strong className="text-red-400">{runResult.anomalies_found}</strong></div>
            <div><span className="text-slate-500">Rate:</span> <strong className="text-amber-400">{(runResult.anomaly_rate * 100).toFixed(2)}%</strong></div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Anomaly scatter */}
            <div className="glass p-5">
              <h3 className="section-title mb-4">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                Anomaly Scatter Plot
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="x" name="Record" tick={{ fill: '#64748b', fontSize: 11 }} label={{ value: 'Record Index', position: 'insideBottom', fill: '#475569', fontSize: 11, dy: 10 }} />
                  <YAxis dataKey="y" name="Anomaly Score" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', fontSize: 12 }}
                    formatter={(v: any, name: string) => [typeof v === 'number' ? v.toFixed(4) : v, name]}
                  />
                  <Scatter
                    data={scatterData.filter(d => !d.anomaly)}
                    fill="rgba(99,102,241,0.5)"
                    name="Normal"
                  />
                  <Scatter
                    data={scatterData.filter(d => d.anomaly)}
                    fill="rgba(239,68,68,0.8)"
                    name="Anomaly"
                    shape="triangle"
                  />
                  <Legend iconType="circle" formatter={v => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Entity type distribution */}
            <div className="glass p-5">
              <h3 className="section-title mb-4">
                <BarChart3 className="w-4 h-4 text-brand-400" />
                Entity Type Distribution
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={typeData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', fontSize: 12 }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {typeData.map((_, i) => (
                      <Cell key={i} fill={['#4f46e5','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4'][i % 6]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top risk entities */}
          <div className="glass p-5">
            <h3 className="section-title mb-4">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              High-Risk Entities (Top {Math.min(topEntities.length, 10)})
            </h3>
            {topEntities.length === 0 ? (
              <p className="text-slate-500 text-sm py-4 text-center">No entities scored yet. Run Detection first.</p>
            ) : (
              <div className="space-y-3">
                {topEntities.map(e => (
                  <div key={e.id} className="flex items-center gap-4">
                    <span className="text-xs font-mono text-slate-500 w-20 uppercase">{e.entity_type}</span>
                    <span className="text-sm text-slate-300 flex-1 truncate">{e.label}</span>
                    <div className="w-40 shrink-0">
                      <RiskBar score={e.risk_score} />
                    </div>
                    <RiskBadge score={e.risk_score} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Anomaly table */}
          {anomalies.length > 0 && (
            <div className="glass overflow-hidden">
              <div className="p-4 border-b border-slate-800">
                <h3 className="section-title">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  Detected Anomalies ({anomalies.length})
                </h3>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Score</th>
                    <th>Algorithm</th>
                    <th>Explanation</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {anomalies.slice(0, 20).map(a => (
                    <tr key={a.id}>
                      <td><code className="text-xs text-slate-400">{a.row_index ?? '—'}</code></td>
                      <td>
                        <code className={`text-xs font-mono ${a.is_anomaly ? 'text-red-400' : 'text-amber-400'}`}>
                          {a.anomaly_score?.toFixed(4)}
                        </code>
                      </td>
                      <td><span className="text-xs text-slate-400 capitalize">{a.algorithm?.replace('_', ' ')}</span></td>
                      <td><span className="text-xs text-slate-400">{a.explanation || '—'}</span></td>
                      <td>
                        {a.is_anomaly ? (
                          <span className="risk-critical">ANOMALY</span>
                        ) : (
                          <span className="risk-medium">BORDERLINE</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}

const MOCK_ANOMALIES = Array.from({ length: 15 }, (_, i) => ({
  id: `a${i}`, is_anomaly: i < 5, anomaly_score: i < 5 ? -(0.3 + Math.random() * 0.5) : -(0.05 + Math.random() * 0.1),
  algorithm: 'isolation_forest', row_index: Math.floor(Math.random() * 500),
  explanation: i < 5 ? `Transaction amount 4.2σ above mean; unusual velocity pattern` : 'Borderline',
}))

const MOCK_ENTITIES = [
  { id: 'e1', entity_type: 'account',      label: 'ACC-88421-OFFSHORE',      risk_score: 0.91 },
  { id: 'e2', entity_type: 'person',       label: 'John Doe',                risk_score: 0.82 },
  { id: 'e3', entity_type: 'organization', label: 'Shell Corp LLC',           risk_score: 0.79 },
  { id: 'e4', entity_type: 'ip',           label: '185.220.101.47',           risk_score: 0.73 },
  { id: 'e5', entity_type: 'email',        label: 'j.doe@protonmail.com',     risk_score: 0.55 },
  { id: 'e6', entity_type: 'organization', label: 'Panama Holdings SA',       risk_score: 0.88 },
]
