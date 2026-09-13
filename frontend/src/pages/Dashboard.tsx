import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  FolderOpen, Shield, AlertTriangle, FileText,
  TrendingUp, Plus, ArrowRight, Clock, Activity,
  Users, Network
} from 'lucide-react'
import { casesApi, analyticsApi } from '../lib/api'
import { formatDateTime, getRiskLevel } from '../lib/utils'
import { RiskBadge } from '../components/RiskBadge'
import { useCase } from '../lib/CaseContext'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts'

const COLORS = ['#4f46e5', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6']

const STATUS_COLORS: Record<string, string> = {
  open:     '#4f46e5',
  active:   '#8b5cf6',
  pending:  '#f59e0b',
  closed:   '#475569',
  archived: '#374151',
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
        setCases(loadedCases)
        if (!activeCaseId && loadedCases.length > 0) {
          setActiveCase(loadedCases[0].id, loadedCases[0].title)
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
    { name: 'Critical', count: cases.filter(c => c.priority === 'critical').length, fill: '#ef4444' },
    { name: 'High',     count: cases.filter(c => c.priority === 'high').length,     fill: '#f97316' },
    { name: 'Medium',   count: cases.filter(c => c.priority === 'medium').length,   fill: '#f59e0b' },
    { name: 'Low',      count: cases.filter(c => c.priority === 'low').length,      fill: '#10b981' },
  ]

  const recentCases = [...cases]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-slide-up">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white text-glow">Operations Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Forensic investigation platform overview</p>
        </div>
        <Link to="/cases/new" className="btn-brand flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Case
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {[
          { label: 'Total Cases',    value: totalCases,    icon: FolderOpen,     color: 'text-brand-400',   bg: 'bg-brand-500/10' },
          { label: 'Active Cases',   value: activeCases,   icon: Activity,       color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Critical',       value: criticalCases, icon: AlertTriangle,  color: 'text-red-400',     bg: 'bg-red-500/10' },
          { label: 'Evidence Files', value: totalEvidence, icon: Shield,         color: 'text-amber-400',   bg: 'bg-amber-500/10' },
          { label: 'Entities',       value: totalEntities, icon: Users,          color: 'text-purple-400',  bg: 'bg-purple-500/10' },
          { label: 'Reports',        value: totalReports,  icon: FileText,       color: 'text-cyan-400',    bg: 'bg-cyan-500/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="kpi-card">
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status distribution */}
        <div className="glass p-5">
          <h3 className="section-title mb-4">
            <Activity className="w-4 h-4 text-brand-400" />
            Case Status
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={STATUS_COLORS[entry.name] || COLORS[i]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', fontSize: 12 }}
              />
              <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Priority breakdown */}
        <div className="glass p-5">
          <h3 className="section-title mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Priority Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={priorityData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', fontSize: 12 }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {priorityData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick actions */}
        <div className="glass p-5">
          <h3 className="section-title mb-4">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Quick Actions
          </h3>
          <div className="space-y-2">
            {[
              { label: 'Open New Case', to: '/cases/new', color: 'text-brand-400', icon: Plus },
              { label: 'Upload Evidence', to: '/evidence/upload', color: 'text-amber-400', icon: Shield },
              { label: 'Browse Cases', to: '/cases', color: 'text-emerald-400', icon: FolderOpen },
            ].map(({ label, to, color, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/40 hover:border-slate-600/60 transition-all group"
              >
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{label}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-auto text-slate-600 group-hover:text-slate-400 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent cases table */}
      <div className="glass p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title">
            <Clock className="w-4 h-4 text-brand-400" />
            Recent Cases
          </h3>
          <Link to="/cases" className="text-xs text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recentCases.length === 0 ? (
          <div className="text-center py-8">
            <FolderOpen className="w-8 h-8 text-slate-700 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No cases yet. <Link to="/cases/new" className="text-brand-400 hover:underline">Create your first case →</Link></p>
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
                      <Link to={`/cases/${c.id}`} className="text-slate-200 hover:text-brand-300 transition-colors font-medium">
                        {c.title}
                      </Link>
                      {c.investigator && <p className="text-xs text-slate-500 mt-0.5">{c.investigator}</p>}
                    </td>
                    <td>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border status-${c.status}`}>
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
                    <td><span className="text-slate-300">{c.evidence_count}</span></td>
                    <td><span className="text-slate-300">{c.entity_count}</span></td>
                    <td><span className="text-slate-500 text-xs">{formatDateTime(c.created_at)}</span></td>
                    <td>
                      <Link to={`/cases/${c.id}`} className="text-brand-400 hover:text-brand-300">
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

// Mock data for development without backend
const MOCK_CASES = [
  { id: '1', title: 'Operation Wire Fraud Alpha', status: 'active', priority: 'critical', investigator: 'Det. Chen', evidence_count: 12, entity_count: 34, report_count: 2, created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: '2', title: 'Phishing Campaign Analysis', status: 'open', priority: 'high', investigator: 'Agent Torres', evidence_count: 7, entity_count: 18, report_count: 0, created_at: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: '3', title: 'Insider Threat — Finance Dept', status: 'pending', priority: 'medium', investigator: 'Dr. Patel', evidence_count: 3, entity_count: 9, report_count: 1, created_at: new Date(Date.now() - 86400000 * 8).toISOString() },
  { id: '4', title: 'BEC Scheme Investigation', status: 'closed', priority: 'high', investigator: 'Det. Müller', evidence_count: 22, entity_count: 61, report_count: 5, created_at: new Date(Date.now() - 86400000 * 30).toISOString() },
]
