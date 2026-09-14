import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  FolderOpen, Shield, AlertTriangle, FileText,
  TrendingUp, Plus, ArrowRight, Clock, Activity,
  Users, Network
} from 'lucide-react'
import { casesApi } from '../lib/api'
import { formatDateTime } from '../lib/utils'
import { RiskBadge } from '../components/RiskBadge'
import { useCase } from '../lib/CaseContext'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

const CHART_PALETTE = ['#dc2626', '#18181b', '#ef4444', '#71717a', '#991b1b']

const STATUS_COLORS: Record<string, string> = {
  open:     '#dc2626',
  active:   '#18181b',
  pending:  '#f59e0b',
  closed:   '#71717a',
  archived: '#a1a1aa',
}

export default function Dashboard() {
  const { activeCaseId, setActiveCase } = useCase()
  const [cases, setCases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await casesApi.list({ limit: 100 })
        const loadedCases = res.data.items || []
        if (loadedCases.length > 0) {
          setCases(loadedCases)
          if (!activeCaseId) {
            setActiveCase(loadedCases[0].id, loadedCases[0].title)
          }
        } else {
          setCases(MOCK_CASES)
          if (!activeCaseId && MOCK_CASES.length > 0) {
            setActiveCase(MOCK_CASES[0].id, MOCK_CASES[0].title)
          }
        }
      } catch {
        // Use mock data for dev
        setCases(MOCK_CASES)
        if (!activeCaseId && MOCK_CASES.length > 0) {
          setActiveCase(MOCK_CASES[0].id, MOCK_CASES[0].title)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // KPI computations
  const totalCases = cases.length
  const activeCases = cases.filter(c => c.status === 'active' || c.status === 'open').length
  const criticalCases = cases.filter(c => c.priority === 'critical').length
  const totalEvidence = cases.reduce((s, c) => s + (c.evidence_count || 0), 0)
  const totalEntities = cases.reduce((s, c) => s + (c.entity_count || 0), 0)
  const totalReports = cases.reduce((s, c) => s + (c.report_count || 0), 0)

  // Chart data
  const statusData = Object.entries(
    cases.reduce((acc, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }))

  const priorityData = [
    { name: 'Critical', count: cases.filter(c => c.priority === 'critical').length, fill: '#dc2626' },
    { name: 'High',     count: cases.filter(c => c.priority === 'high').length,     fill: '#ef4444' },
    { name: 'Medium',   count: cases.filter(c => c.priority === 'medium').length,   fill: '#27272a' },
    { name: 'Low',      count: cases.filter(c => c.priority === 'low').length,      fill: '#71717a' },
  ]

  const recentCases = [...cases]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-slide-up">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-950 tracking-tight">Operations Dashboard</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Real-time digital forensics & anomaly surveillance overview</p>
        </div>
        <Link to="/cases/new" className="btn-brand flex items-center gap-2 text-sm shadow-sm">
          <Plus className="w-4 h-4" />
          <span>New Case</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {[
          { label: 'Total Cases',    value: totalCases,    icon: FolderOpen,     color: 'text-zinc-900', bg: 'bg-zinc-100' },
          { label: 'Active Cases',   value: activeCases,   icon: Activity,       color: 'text-red-600',  bg: 'bg-red-50' },
          { label: 'Critical Risk',  value: criticalCases, icon: AlertTriangle,  color: 'text-red-700',  bg: 'bg-red-100' },
          { label: 'Evidence Files', value: totalEvidence, icon: Shield,         color: 'text-zinc-800', bg: 'bg-zinc-100' },
          { label: 'Entities',       value: totalEntities, icon: Users,          color: 'text-red-600',  bg: 'bg-red-50' },
          { label: 'Reports',        value: totalReports,  icon: FileText,       color: 'text-zinc-900', bg: 'bg-zinc-100' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="kpi-card border-zinc-200/90 shadow-xs">
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center border border-zinc-200/60`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-zinc-950 font-mono tracking-tight">{value}</p>
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status distribution */}
        <div className="glass p-5 border-zinc-200/90 shadow-xs">
          <h3 className="section-title mb-4">
            <Activity className="w-4 h-4 text-red-600" />
            Case Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={190}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={78}
                paddingAngle={3}
                dataKey="value"
              >
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={STATUS_COLORS[entry.name] || CHART_PALETTE[i % CHART_PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 8, color: '#18181b', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
              />
              <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ color: '#52525b', fontSize: 11, fontWeight: 600 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Priority breakdown */}
        <div className="glass p-5 border-zinc-200/90 shadow-xs">
          <h3 className="section-title mb-4">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            Priority Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={priorityData} barSize={26}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 8, color: '#18181b', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {priorityData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick actions */}
        <div className="glass p-5 border-zinc-200/90 shadow-xs">
          <h3 className="section-title mb-4">
            <TrendingUp className="w-4 h-4 text-red-600" />
            Quick Actions
          </h3>
          <div className="space-y-2.5">
            {[
              { label: 'Open New Case', to: '/cases/new', color: 'text-red-600', icon: Plus },
              { label: 'Upload Evidence', to: '/evidence/upload', color: 'text-zinc-900', icon: Shield },
              { label: 'Browse Cases', to: '/cases', color: 'text-red-700', icon: FolderOpen },
            ].map(({ label, to, color, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 hover:bg-red-50/50 border border-zinc-200 hover:border-red-200 transition-all group"
              >
                <div className="w-7 h-7 rounded-md bg-white border border-zinc-200 flex items-center justify-center">
                  <Icon className={`w-3.5 h-3.5 ${color}`} />
                </div>
                <span className="text-sm font-semibold text-zinc-800 group-hover:text-red-700 transition-colors">{label}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-auto text-zinc-400 group-hover:text-red-600 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent cases table */}
      <div className="glass p-5 border-zinc-200/90 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title">
            <Clock className="w-4 h-4 text-red-600" />
            Recent Investigation Cases
          </h3>
          <Link to="/cases" className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors flex items-center gap-1">
            View all cases <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recentCases.length === 0 ? (
          <div className="text-center py-8">
            <FolderOpen className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
            <p className="text-zinc-600 text-sm">No cases registered yet. <Link to="/cases/new" className="text-red-600 font-bold hover:underline">Create your first case →</Link></p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Evidence</th>
                  <th>Entities</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentCases.map(c => (
                  <tr key={c.id}>
                    <td>
                      <Link to={`/cases/${c.id}`} className="text-zinc-950 hover:text-red-600 transition-colors font-bold">
                        {c.title}
                      </Link>
                      {c.investigator && <p className="text-xs text-zinc-500 mt-0.5 font-medium">Analyst: {c.investigator}</p>}
                    </td>
                    <td>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold border status-${c.status}`}>
                        {c.status}
                      </span>
                    </td>
                    <td>
                      <RiskBadge score={
                        c.priority === 'critical' ? 0.9 :
                        c.priority === 'high' ? 0.6 :
                        c.priority === 'medium' ? 0.35 : 0.1
                      } />
                    </td>
                    <td><span className="text-zinc-800 font-semibold">{c.evidence_count}</span></td>
                    <td><span className="text-zinc-800 font-semibold">{c.entity_count}</span></td>
                    <td><span className="text-zinc-500 text-xs font-medium">{formatDateTime(c.created_at)}</span></td>
                    <td>
                      <Link to={`/cases/${c.id}`} className="text-zinc-400 hover:text-red-600 inline-block p-1">
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// Rich forensic default cases for operations surveillance
const MOCK_CASES = [
  { id: 'case-01', title: 'Operation Apex Offshore — Shell Laundering', status: 'active', priority: 'critical', investigator: 'Agent Sarah Vance', evidence_count: 8, entity_count: 26, report_count: 3, created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'case-02', title: 'Circular Wire Fraud & Escrow Drain', status: 'active', priority: 'high', investigator: 'Det. Marcus Chen', evidence_count: 14, entity_count: 38, report_count: 2, created_at: new Date(Date.now() - 86400000 * 4).toISOString() },
  { id: 'case-03', title: 'Falcon Energy Phantom Invoicing Loop', status: 'open', priority: 'critical', investigator: 'Forensic Lead Elena Rostova', evidence_count: 19, entity_count: 42, report_count: 4, created_at: new Date(Date.now() - 86400000 * 7).toISOString() },
  { id: 'case-04', title: 'Silicon Alpha Executive BEC Compromise', status: 'pending', priority: 'high', investigator: 'Special Agent Torres', evidence_count: 6, entity_count: 15, report_count: 1, created_at: new Date(Date.now() - 86400000 * 11).toISOString() },
  { id: 'case-05', title: 'Panama Layered Trust Embezzlement', status: 'closed', priority: 'medium', investigator: 'Dr. Arthur Sterling', evidence_count: 11, entity_count: 31, report_count: 2, created_at: new Date(Date.now() - 86400000 * 25).toISOString() },
  { id: 'case-06', title: 'Cryptocurrency Wash Trading Syndicate', status: 'open', priority: 'critical', investigator: 'CyberTrace Cyber Taskforce', evidence_count: 27, entity_count: 64, report_count: 5, created_at: new Date(Date.now() - 86400000 * 32).toISOString() },
]
