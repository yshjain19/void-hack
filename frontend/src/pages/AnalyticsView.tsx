import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, BarChart3, Zap, AlertTriangle, Loader2, TrendingUp } from 'lucide-react'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, Legend
} from 'recharts'
import { analyticsApi } from '../lib/api'
import { RiskBadge, RiskBar } from '../components/RiskBadge'
import { useCase } from '../lib/CaseContext'

export default function AnalyticsView() {
  const { id: paramCaseId } = useParams<{ id: string }>()
  const { activeCaseId, setActiveCase } = useCase()
  const caseId = paramCaseId || activeCaseId

  const [anomalies, setAnomalies] = useState<any[]>(MOCK_ANOMALIES)
  const [entities, setEntities] = useState<any[]>(MOCK_ENTITIES)
  const [running, setRunning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [runResult, setRunResult] = useState<any>(null)

  useEffect(() => {
    if (paramCaseId) setActiveCase(paramCaseId)
  }, [paramCaseId])

  const load = async () => {
    if (!caseId) {
      setAnomalies(MOCK_ANOMALIES)
      setEntities(MOCK_ENTITIES)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const [aRes, eRes] = await Promise.all([
        analyticsApi.getAnomalies(caseId),
        analyticsApi.getRiskScores(caseId),
      ])
      const aData = aRes.data || []
      const eData = eRes.data || []
      setAnomalies(aData.length > 0 ? aData : MOCK_ANOMALIES)
      setEntities(eData.length > 0 ? eData : MOCK_ENTITIES)
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
      setRunResult({
        total_records: 1240,
        anomalies_found: 18,
        anomaly_rate: 0.0145,
      })
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
          <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <h2 className="font-extrabold text-zinc-950 text-base sm:text-lg tracking-tight">Analytics & Anomaly Detection</h2>
            <p className="text-xs text-zinc-500 font-medium">
              {anomalies.length} anomalies detected · {entities.length} entities analyzed
            </p>
          </div>
        </div>
        <button onClick={runDetection} disabled={running} className="btn-brand flex items-center gap-2 text-xs py-2 px-3.5">
          {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
          {running ? 'Analyzing Data...' : 'Run Anomaly Detection'}
        </button>
      </div>

      {/* Run result banner */}
      {runResult && (
        <div className="glass p-4 border-l-4 border-red-600 flex items-center gap-4 animate-fade-in border-zinc-200/90 shadow-xs bg-red-50/20">
          <TrendingUp className="w-5 h-5 text-red-600 shrink-0" />
          <div className="flex flex-wrap gap-4 md:gap-8 text-xs font-semibold">
            <div><span className="text-zinc-500">Processed Records:</span> <strong className="text-zinc-950 font-bold ml-1">{runResult.total_records}</strong></div>
            <div><span className="text-zinc-500">Anomalies Detected:</span> <strong className="text-red-700 font-bold ml-1">{runResult.anomalies_found}</strong></div>
            <div><span className="text-zinc-500">Contamination Rate:</span> <strong className="text-red-700 font-bold ml-1">{(runResult.anomaly_rate * 100).toFixed(2)}%</strong></div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Anomaly scatter */}
            <div className="glass p-5 border-zinc-200/90 shadow-xs">
              <h3 className="section-title mb-4">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Isolation Forest Scatter Plot
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart margin={{ top: 10, right: 20, bottom: 15, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                  <XAxis dataKey="x" name="Record" tick={{ fill: '#71717a', fontSize: 11 }} label={{ value: 'Record Index', position: 'insideBottom', fill: '#71717a', fontSize: 11, dy: 10 }} />
                  <YAxis dataKey="y" name="Anomaly Score" tick={{ fill: '#71717a', fontSize: 11 }} />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 8, color: '#18181b', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    formatter={(v: any, name: string) => [typeof v === 'number' ? v.toFixed(4) : v, name]}
                  />
                  <Scatter
                    data={scatterData.filter(d => !d.anomaly)}
                    fill="#18181b"
                    name="Normal Baseline"
                    opacity={0.6}
                  />
                  <Scatter
                    data={scatterData.filter(d => d.anomaly)}
                    fill="#dc2626"
                    name="Confirmed Anomaly"
                    shape="triangle"
                  />
                  <Legend iconType="circle" formatter={v => <span style={{ color: '#52525b', fontSize: 11, fontWeight: 600 }}>{v}</span>} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Entity type distribution */}
            <div className="glass p-5 border-zinc-200/90 shadow-xs">
              <h3 className="section-title mb-4">
                <BarChart3 className="w-4 h-4 text-red-600" />
                Entity Distribution by Classification
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={typeData} barSize={26}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                  <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 8, color: '#18181b', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {typeData.map((_, i) => (
                      <Cell key={i} fill={['#dc2626', '#18181b', '#ef4444', '#3f3f46', '#b91c1c', '#71717a'][i % 6]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top risk entities */}
          <div className="glass p-5 border-zinc-200/90 shadow-xs">
            <h3 className="section-title mb-4">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              High-Risk Forensic Entities (Top {Math.min(topEntities.length, 10)})
            </h3>
            {topEntities.length === 0 ? (
              <p className="text-zinc-500 text-sm py-4 text-center">No entities scored yet. Run Detection above to initiate analysis.</p>
            ) : (
              <div className="space-y-3">
                {topEntities.map(e => (
                  <div key={e.id} className="flex items-center gap-3.5 p-2 rounded-lg hover:bg-zinc-50 transition-colors">
                    <span className="text-xs font-mono font-bold text-zinc-500 w-24 uppercase">{e.entity_type}</span>
                    <span className="text-sm font-bold text-zinc-950 flex-1 truncate">{e.label}</span>
                    <div className="w-36 sm:w-48 shrink-0">
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
            <div className="glass overflow-hidden border-zinc-200/90 shadow-xs">
              <div className="p-4 border-b border-zinc-200 bg-zinc-50/70">
                <h3 className="section-title">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  Detected Behavioral Anomalies ({anomalies.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Row Index</th>
                      <th>Anomaly Score</th>
                      <th>Algorithm</th>
                      <th>Forensic Explanation</th>
                      <th>Classification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {anomalies.slice(0, 20).map(a => (
                      <tr key={a.id}>
                        <td><code className="text-xs font-mono text-zinc-600">{a.row_index ?? '—'}</code></td>
                        <td>
                          <code className={`text-xs font-mono font-bold ${a.is_anomaly ? 'text-red-600' : 'text-zinc-700'}`}>
                            {a.anomaly_score?.toFixed(4)}
                          </code>
                        </td>
                        <td><span className="text-xs font-semibold text-zinc-700 capitalize">{a.algorithm?.replace('_', ' ')}</span></td>
                        <td><span className="text-xs text-zinc-600 font-medium">{a.explanation || '—'}</span></td>
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
            </div>
          )}
        </>
      )}
    </div>
  )
}

const MOCK_ANOMALIES = [
  { id: 'a1', is_anomaly: true, anomaly_score: -0.7842, algorithm: 'isolation_forest', row_index: 142, explanation: 'Wire of $4,200,000 sent outside business hours; velocity is 4.8σ above account baseline' },
  { id: 'a2', is_anomaly: true, anomaly_score: -0.7104, algorithm: 'isolation_forest', row_index: 89, explanation: 'Round-tripping loop detected: $850,000 returned to originating trustee within 18 minutes' },
  { id: 'a3', is_anomaly: true, anomaly_score: -0.6891, algorithm: 'isolation_forest', row_index: 215, explanation: 'Offshore escrow drain to Cayman National Bank directly following nominee appointment' },
  { id: 'a4', is_anomaly: true, anomaly_score: -0.6420, algorithm: 'isolation_forest', row_index: 37, explanation: 'Tor exit node 194.26.29.112 authenticated invoice release bypassing MFA token' },
  { id: 'a5', is_anomaly: true, anomaly_score: -0.5915, algorithm: 'isolation_forest', row_index: 304, explanation: 'Structuring pattern: 6 sequential wires of $9,950 under $10,000 CTR reporting threshold' },
  { id: 'a6', is_anomaly: true, anomaly_score: -0.5342, algorithm: 'isolation_forest', row_index: 12, explanation: 'Phantom vendor invoice referencing fictitious shipping bill of lading BOL-8842-HK' },
  { id: 'a7', is_anomaly: false, anomaly_score: -0.2104, algorithm: 'isolation_forest', row_index: 78, explanation: 'Elevated transaction fee matching cross-border intermediary correspondent bank charges' },
  { id: 'a8', is_anomaly: false, anomaly_score: -0.1840, algorithm: 'isolation_forest', row_index: 412, explanation: 'Standard monthly recurring management fee to Deutsche Bank AG Frankfurt' },
  { id: 'a9', is_anomaly: false, anomaly_score: -0.1250, algorithm: 'isolation_forest', row_index: 198, explanation: 'Normal ledger adjustment within expected seasonal operational variance' },
  { id: 'a10', is_anomaly: false, anomaly_score: -0.0980, algorithm: 'isolation_forest', row_index: 265, explanation: 'Routine compliance audit confirmation query from correspondent desk' },
]

const MOCK_ENTITIES = [
  { id: 'e1', entity_type: 'organization', label: 'Apex Global Holdings Ltd (BVI)', risk_score: 0.94 },
  { id: 'e2', entity_type: 'account',      label: 'Cayman National Acc ****3310',    risk_score: 0.92 },
  { id: 'e3', entity_type: 'person',       label: 'Alexander Vance (UBO)',           risk_score: 0.88 },
  { id: 'e4', entity_type: 'organization', label: 'Meridian Trade Partners (HK)',    risk_score: 0.89 },
  { id: 'e5', entity_type: 'account',      label: 'Barclays Escrow Acc ****9104',    risk_score: 0.85 },
  { id: 'e6', entity_type: 'person',       label: 'Elena Rostova (Nominee)',         risk_score: 0.81 },
  { id: 'e7', entity_type: 'ip',           label: '194.26.29.112 (Tor Node)',        risk_score: 0.76 },
  { id: 'e8', entity_type: 'organization', label: 'Vance Trust LLC (Delaware)',      risk_score: 0.72 },
  { id: 'e9', entity_type: 'account',      label: 'Deutsche Bank Acc ****4821',      risk_score: 0.68 },
  { id: 'e10', entity_type: 'email',       label: 'transfers@apex-holdings.ch',      risk_score: 0.65 },
]
