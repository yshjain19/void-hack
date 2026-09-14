import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import ReactFlow, {
  Controls, MiniMap, Background, BackgroundVariant,
  useNodesState, useEdgesState, addEdge,
  type Connection, type Edge, type Node,
} from 'reactflow'
import 'reactflow/dist/style.css'
import {
  Network, RefreshCw, Loader2, ArrowLeft, Zap, Users,
  Search, ShieldAlert, Sparkles, Filter, CheckCircle2,
  ExternalLink, Layers, Info
} from 'lucide-react'
import { graphApi, casesApi } from '../lib/api'
import EntityNode from '../components/EntityNode'
import { getRiskColor } from '../lib/utils'
import { useCase } from '../lib/CaseContext'

// Custom node types registered outside component to avoid React Flow warnings
const nodeTypes = { entity: EntityNode }

// Realistic Forensic Investigation Default / Demo Graph Data
export const DEFAULT_FAKE_NODES: Node[] = [
  {
    id: 'n1',
    type: 'entity',
    position: { x: 80, y: 120 },
    data: {
      label: 'Alexander Vance',
      type: 'person',
      risk_score: 0.88,
      properties: {
        role: 'Ultimate Beneficial Owner (UBO)',
        jurisdiction: 'United Kingdom / Cayman',
        pep_status: 'Adverse Media Flag',
        tax_id: 'GB-9948210-X',
      },
    },
  },
  {
    id: 'n2',
    type: 'entity',
    position: { x: 420, y: 80 },
    data: {
      label: 'Apex Global Holdings Ltd',
      type: 'organization',
      risk_score: 0.94,
      properties: {
        jurisdiction: 'British Virgin Islands (BVI)',
        incorporation: '2023-04-12',
        reg_number: 'BVI-889102-Corp',
        entity_class: 'Offshore Shell Vehicle',
      },
    },
  },
  {
    id: 'n3',
    type: 'entity',
    position: { x: 80, y: 380 },
    data: {
      label: 'Vance Trust LLC',
      type: 'organization',
      risk_score: 0.72,
      properties: {
        jurisdiction: 'Delaware, USA',
        formation: '2021-11-04',
        registered_agent: 'Corporation Service Company',
        bank_ref: 'CHASE-NA-991',
      },
    },
  },
  {
    id: 'n4',
    type: 'entity',
    position: { x: 420, y: 380 },
    data: {
      label: 'Deutsche Bank Acc ****4821',
      type: 'account',
      risk_score: 0.68,
      properties: {
        institution: 'Deutsche Bank AG Frankfurt',
        iban: 'DE89 5007 0010 0123 4821 00',
        currency: 'EUR',
        balance: '€1,840,500.00',
      },
    },
  },
  {
    id: 'n5',
    type: 'entity',
    position: { x: 760, y: 80 },
    data: {
      label: 'Barclays Escrow Acc ****9104',
      type: 'account',
      risk_score: 0.85,
      properties: {
        institution: 'Barclays London Corporate',
        iban: 'GB29 BUKB 2004 1591 0498 11',
        flagged_anomalies: '14 rapid velocity hops',
        compliance_hold: 'Pending Disclosure',
      },
    },
  },
  {
    id: 'n6',
    type: 'entity',
    position: { x: 420, y: -160 },
    data: {
      label: 'Elena Rostova',
      type: 'person',
      risk_score: 0.81,
      properties: {
        role: 'Nominee Director',
        nationality: 'Cyprus / St. Kitts',
        directorships: '43 registered shell entities',
        ofac_screening: 'Secondary Review',
      },
    },
  },
  {
    id: 'n7',
    type: 'entity',
    position: { x: 1060, y: -140 },
    data: {
      label: '194.26.29.112',
      type: 'ip',
      risk_score: 0.76,
      properties: {
        isp: 'Hostinger International Offshore',
        country: 'Panama (PA)',
        anonymization: 'Tor Exit Node / Bulletproof VPS',
        threat_feed: 'AlienVault OTX Malicious',
      },
    },
  },
  {
    id: 'n8',
    type: 'entity',
    position: { x: 760, y: -140 },
    data: {
      label: 'transfers@apex-holdings.ch',
      type: 'email',
      risk_score: 0.65,
      properties: {
        domain: 'apex-holdings.ch',
        mx_provider: 'Proton Technologies AG',
        dkim_status: 'Passing (Custom Key)',
        associated_files: '3 EML Invoices',
      },
    },
  },
  {
    id: 'n9',
    type: 'entity',
    position: { x: 760, y: 380 },
    data: {
      label: 'Meridian Trade Partners',
      type: 'organization',
      risk_score: 0.89,
      properties: {
        jurisdiction: 'Hong Kong (HK)',
        activity: 'Phantom logistics invoicing',
        invoiced_total: '$8,720,000.00',
        audit_flag: 'Round-tripping / Circular flow',
      },
    },
  },
  {
    id: 'n10',
    type: 'entity',
    position: { x: 1100, y: 220 },
    data: {
      label: 'Cayman National Acc ****3310',
      type: 'account',
      risk_score: 0.92,
      properties: {
        institution: 'Cayman National Bank',
        account_holder: 'Apex Caribbean Assets Ltd',
        status: 'FROZEN BY REGULATOR',
        confiscation_order: 'KY-COURT-2026-88',
      },
    },
  },
]

export const DEFAULT_FAKE_EDGES: Edge[] = [
  {
    id: 'e1',
    source: 'n1',
    target: 'n2',
    label: 'CONTROLS_UBO',
    animated: true,
    style: { stroke: '#dc2626', strokeWidth: 2.5 },
    labelStyle: { fill: '#991b1b', fontSize: 10, fontWeight: '700' },
    labelBgStyle: { fill: '#ffffff', fillOpacity: 0.95, rx: 4, ry: 4 },
  },
  {
    id: 'e2',
    source: 'n1',
    target: 'n3',
    label: 'TRUSTEE_OWNER',
    style: { stroke: '#71717a', strokeWidth: 2 },
    labelStyle: { fill: '#18181b', fontSize: 10, fontWeight: '700' },
    labelBgStyle: { fill: '#ffffff', fillOpacity: 0.95, rx: 4, ry: 4 },
  },
  {
    id: 'e3',
    source: 'n6',
    target: 'n2',
    label: 'NOMINEE_DIRECTOR',
    style: { stroke: '#dc2626', strokeWidth: 2 },
    labelStyle: { fill: '#991b1b', fontSize: 10, fontWeight: '700' },
    labelBgStyle: { fill: '#ffffff', fillOpacity: 0.95, rx: 4, ry: 4 },
  },
  {
    id: 'e4',
    source: 'n2',
    target: 'n5',
    label: 'ORIGINATES_TRANSFER ($4.2M)',
    animated: true,
    style: { stroke: '#dc2626', strokeWidth: 2.5 },
    labelStyle: { fill: '#991b1b', fontSize: 10, fontWeight: '700' },
    labelBgStyle: { fill: '#ffffff', fillOpacity: 0.95, rx: 4, ry: 4 },
  },
  {
    id: 'e5',
    source: 'n5',
    target: 'n9',
    label: 'CIRCULAR_ESCROW',
    animated: true,
    style: { stroke: '#ea580c', strokeWidth: 2 },
    labelStyle: { fill: '#c2410c', fontSize: 10, fontWeight: '700' },
    labelBgStyle: { fill: '#ffffff', fillOpacity: 0.95, rx: 4, ry: 4 },
  },
  {
    id: 'e6',
    source: 'n9',
    target: 'n10',
    label: 'OFFSHORE_DRAIN ($3.1M)',
    animated: true,
    style: { stroke: '#991b1b', strokeWidth: 3 },
    labelStyle: { fill: '#7f1d1d', fontSize: 10, fontWeight: '700' },
    labelBgStyle: { fill: '#ffffff', fillOpacity: 0.95, rx: 4, ry: 4 },
  },
  {
    id: 'e7',
    source: 'n9',
    target: 'n3',
    label: 'KICKBACK_RETURN ($850K)',
    animated: true,
    style: { stroke: '#dc2626', strokeWidth: 2 },
    labelStyle: { fill: '#991b1b', fontSize: 10, fontWeight: '700' },
    labelBgStyle: { fill: '#ffffff', fillOpacity: 0.95, rx: 4, ry: 4 },
  },
  {
    id: 'e8',
    source: 'n2',
    target: 'n4',
    label: 'MANAGEMENT_FEE',
    style: { stroke: '#71717a', strokeWidth: 1.5 },
    labelStyle: { fill: '#18181b', fontSize: 10, fontWeight: '700' },
    labelBgStyle: { fill: '#ffffff', fillOpacity: 0.95, rx: 4, ry: 4 },
  },
  {
    id: 'e9',
    source: 'n7',
    target: 'n8',
    label: 'TOR_AUTH_LOGIN',
    animated: true,
    style: { stroke: '#dc2626', strokeWidth: 2 },
    labelStyle: { fill: '#991b1b', fontSize: 10, fontWeight: '700' },
    labelBgStyle: { fill: '#ffffff', fillOpacity: 0.95, rx: 4, ry: 4 },
  },
  {
    id: 'e10',
    source: 'n8',
    target: 'n5',
    label: 'INVOICE_RELEASE',
    style: { stroke: '#71717a', strokeWidth: 2 },
    labelStyle: { fill: '#18181b', fontSize: 10, fontWeight: '700' },
    labelBgStyle: { fill: '#ffffff', fillOpacity: 0.95, rx: 4, ry: 4 },
  },
]

// Grid layout helper for live arbitrary graph nodes
function layoutNodes(nodes: any[], edges: any[]) {
  const cols = Math.ceil(Math.sqrt(nodes.length))
  return nodes.map((n, i) => ({
    ...n,
    position: n.position && (n.position.x !== 0 || n.position.y !== 0)
      ? n.position
      : {
          x: (i % cols) * 260 + 60,
          y: Math.floor(i / cols) * 220 + 60,
        },
  }))
}

export default function GraphView() {
  const { id: paramCaseId } = useParams<{ id: string }>()
  const { activeCaseId, setActiveCase } = useCase()
  const effectiveCaseId = paramCaseId || activeCaseId

  const [nodes, setNodes, onNodesChange] = useNodesState(DEFAULT_FAKE_NODES)
  const [edges, setEdges, onEdgesChange] = useEdgesState(DEFAULT_FAKE_EDGES)
  const [loading, setLoading] = useState(false)
  const [building, setBuilding] = useState(false)
  const [isDefaultGraph, setIsDefaultGraph] = useState(true)
  const [stats, setStats] = useState({ nodes: DEFAULT_FAKE_NODES.length, edges: DEFAULT_FAKE_EDGES.length })
  const [selected, setSelected] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  // Sync active case context if route parameter provided
  useEffect(() => {
    if (paramCaseId) setActiveCase(paramCaseId)
  }, [paramCaseId])

  const loadDefaultGraph = () => {
    setNodes(DEFAULT_FAKE_NODES)
    setEdges(DEFAULT_FAKE_EDGES)
    setStats({ nodes: DEFAULT_FAKE_NODES.length, edges: DEFAULT_FAKE_EDGES.length })
    setIsDefaultGraph(true)
  }

  const loadGraph = async () => {
    if (!effectiveCaseId) {
      loadDefaultGraph()
      return
    }

    setLoading(true)
    try {
      const res = await graphApi.get(effectiveCaseId)
      const data = res.data

      if (data?.nodes && data.nodes.length > 0) {
        const rfNodes: Node[] = layoutNodes(
          data.nodes.map((n: any) => ({
            id: n.id,
            type: 'entity',
            data: {
              label: n.label,
              type: n.type,
              risk_score: n.risk_score,
              properties: n.properties,
            },
            position: { x: n.x || 0, y: n.y || 0 },
          })),
          data.edges,
        )

        const rfEdges: Edge[] = (data.edges || []).map((e: any) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.relationship,
          animated: e.weight > 0.7,
          style: {
            stroke: e.weight > 0.8 ? '#dc2626' : '#71717a',
            strokeWidth: Math.max(1.8, e.weight * 2.8),
          },
          labelStyle: { fill: '#09090b', fontSize: 10, fontWeight: '700' },
          labelBgStyle: { fill: '#ffffff', fillOpacity: 0.95, rx: 4, ry: 4 },
        }))

        setNodes(rfNodes)
        setEdges(rfEdges)
        setStats({ nodes: data.node_count || rfNodes.length, edges: data.edge_count || rfEdges.length })
        setIsDefaultGraph(false)
      } else {
        // Fallback to rich default fake graph if database has 0 entities
        loadDefaultGraph()
      }
    } catch {
      // If API fails or backend offline, seamlessly show default graph
      loadDefaultGraph()
    } finally {
      setLoading(false)
    }
  }

  const buildGraph = async () => {
    setBuilding(true)
    try {
      if (effectiveCaseId) {
        await graphApi.build(effectiveCaseId)
      }
      await loadGraph()
    } catch {
      // Re-layout and simulate graph rebuild with default graph
      setNodes(layoutNodes(DEFAULT_FAKE_NODES, DEFAULT_FAKE_EDGES))
      setEdges(DEFAULT_FAKE_EDGES)
      setStats({ nodes: DEFAULT_FAKE_NODES.length, edges: DEFAULT_FAKE_EDGES.length })
      setIsDefaultGraph(true)
    } finally {
      setBuilding(false)
    }
  }

  useEffect(() => {
    loadGraph()
  }, [effectiveCaseId])

  const onConnect = useCallback(
    (params: Connection) => setEdges(eds => addEdge(params, eds)),
    [],
  )

  const onNodeClick = (_: any, node: Node) => setSelected(node)

  // Filter and search computation for visible nodes
  const displayNodes = useMemo(() => {
    return nodes.map(node => {
      const label = (node.data?.label || '').toLowerCase()
      const type = (node.data?.type || '').toLowerCase()
      const matchesSearch = !searchQuery || label.includes(searchQuery.toLowerCase()) || type.includes(searchQuery.toLowerCase())
      const matchesType = typeFilter === 'all' || type === typeFilter

      const isDimmed = !matchesSearch || !matchesType
      return {
        ...node,
        style: {
          ...node.style,
          opacity: isDimmed ? 0.25 : 1,
          transition: 'opacity 0.2s ease',
        },
      }
    })
  }, [nodes, searchQuery, typeFilter])

  // Count entities by type
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: nodes.length }
    for (const node of nodes) {
      const t = node.data?.type || 'other'
      counts[t] = (counts[t] || 0) + 1
    }
    return counts
  }, [nodes])

  // Get connected edges for selected node
  const selectedConnectedEdges = useMemo(() => {
    if (!selected) return []
    return edges.filter(e => e.source === selected.id || e.target === selected.id)
  }, [selected, edges])

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-3 min-h-[600px]">
      {/* Header & Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0 bg-white p-3.5 rounded-xl border border-zinc-200/90 shadow-xs">
        <div className="flex items-center gap-3">
          <Link to={effectiveCaseId ? `/cases/${effectiveCaseId}` : '/dashboard'} className="btn-ghost p-2" title="Return">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white shadow-sm shadow-red-600/30">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-zinc-950 text-base sm:text-lg tracking-tight">
                Entity Relationship Graph
              </h2>
              {isDefaultGraph ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <Sparkles className="w-3 h-3 text-amber-600" /> Default Forensic Topology
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Live Case Nodes
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 font-medium">
              {stats.nodes} verified entities · {stats.edges} relational edges · Multi-hop tracing
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search entities..."
              className="pl-8 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg w-40 sm:w-48 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Reset / Reload Demo Graph */}
          <button
            onClick={loadDefaultGraph}
            className={`btn-ghost flex items-center gap-1.5 text-xs py-1.5 px-3 border border-zinc-200 ${
              isDefaultGraph ? 'bg-zinc-100 text-zinc-950 font-bold' : ''
            }`}
            title="Load standard forensic fraud topology"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden md:inline">Default Graph</span>
          </button>

          <button
            onClick={() => loadGraph()}
            disabled={loading}
            className="btn-ghost flex items-center gap-1.5 text-xs py-1.5 px-3 border border-zinc-200"
            title="Refresh current graph from backend"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={buildGraph}
            disabled={building}
            className="btn-brand flex items-center gap-1.5 text-xs py-1.5 px-3 shadow-xs"
            title="Extract new entities and rebuild Neo4j relationships"
          >
            {building ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            <span>{building ? 'Synthesizing...' : 'Rebuild Graph'}</span>
          </button>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-zinc-400 font-medium flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          {[
            { id: 'all', label: 'All Entities' },
            { id: 'person', label: 'Persons' },
            { id: 'organization', label: 'Organizations' },
            { id: 'account', label: 'Accounts' },
            { id: 'ip', label: 'IP Nodes' },
            { id: 'email', label: 'Emails' },
          ].map(type => (
            <button
              key={type.id}
              onClick={() => setTypeFilter(type.id)}
              className={`px-2.5 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                typeFilter === type.id
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
              }`}
            >
              {type.label} {typeCounts[type.id] ? `(${typeCounts[type.id]})` : ''}
            </button>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-4 text-[11px] text-zinc-500 font-medium">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600" /> Critical Risk (&ge;70%)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> High Risk (&ge;50%)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-400" /> Medium / Monitored
          </span>
        </div>
      </div>

      {/* Main Graph Canvas Area */}
      <div className="flex-1 glass overflow-hidden relative border-zinc-200/90 shadow-sm rounded-xl min-h-[500px]">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-xs z-20">
            <div className="flex flex-col items-center gap-2.5 bg-white p-6 rounded-2xl border border-zinc-200 shadow-lg">
              <div className="w-9 h-9 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-zinc-800 text-xs font-bold">Rendering CyberTrace entity graph...</p>
              <p className="text-zinc-500 text-[11px]">Connecting Neo4j cluster & calculating relational force layout</p>
            </div>
          </div>
        ) : (
          <ReactFlow
            nodes={displayNodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.2}
            maxZoom={2.5}
            proOptions={{ hideAttribution: true }}
          >
            <Controls className="!bottom-4 !left-4 !bg-white !border-zinc-200 !rounded-lg !shadow-md" />
            <MiniMap
              nodeColor={n => getRiskColor(n.data?.risk_score ?? 0)}
              className="!bottom-4 !right-4 !bg-white/95 !border !border-zinc-200 !rounded-lg !shadow-lg"
            />
            <Background variant={BackgroundVariant.Dots} gap={20} size={1.2} color="rgba(220,38,38,0.12)" />
          </ReactFlow>
        )}

        {/* Selected Entity Side Dossier Panel */}
        {selected && (
          <div className="absolute top-4 right-4 max-w-[calc(100vw-2.5rem)] w-80 glass p-5 animate-slide-up z-20 border-zinc-200/90 shadow-2xl bg-white/95 rounded-2xl">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold">
                {selected.data?.type || 'Entity'}
              </span>
              <button
                onClick={() => setSelected(null)}
                className="text-zinc-400 hover:text-zinc-900 p-1 rounded-md hover:bg-zinc-100"
                aria-label="Close details"
              >
                ✕
              </button>
            </div>

            <h3 className="text-base font-extrabold text-zinc-950 break-words leading-tight mb-2">
              {selected.data?.label}
            </h3>

            {/* Risk Gauge */}
            <div className="p-2.5 bg-zinc-50 rounded-xl border border-zinc-200/80 mb-3.5 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500 font-semibold flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-600" /> Composite Risk
                </span>
                <span className="text-red-700 font-mono font-black text-sm">
                  {((selected.data?.risk_score ?? 0) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-amber-500 rounded-full"
                  style={{ width: `${Math.min((selected.data?.risk_score ?? 0) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Entity Attributes */}
            <div className="space-y-2 border-t border-zinc-100 pt-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Forensic Metadata</h4>
              {selected.data?.properties && Object.keys(selected.data.properties).length > 0 ? (
                Object.entries(selected.data.properties).map(([k, v]) => (
                  <div key={k} className="flex justify-between items-start text-xs gap-2 py-0.5">
                    <span className="text-zinc-500 capitalize shrink-0">{k.replace(/_/g, ' ')}</span>
                    <span className="text-zinc-900 font-semibold text-right break-words max-w-[170px]">
                      {String(v)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-zinc-400 text-xs italic">No additional properties recorded.</p>
              )}
            </div>

            {/* Relational Links */}
            <div className="mt-4 pt-3 border-t border-zinc-100">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Connected Links ({selectedConnectedEdges.length})
              </h4>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {selectedConnectedEdges.map(edge => {
                  const isSource = edge.source === selected.id
                  const targetId = isSource ? edge.target : edge.source
                  const targetNode = nodes.find(n => n.id === targetId)
                  return (
                    <div
                      key={edge.id}
                      className="text-[11px] p-2 bg-zinc-50 hover:bg-red-50/50 rounded-lg border border-zinc-200/80 transition-colors"
                    >
                      <div className="font-mono text-[10px] font-bold text-red-700 uppercase">
                        {isSource ? '➔ OUTGOING: ' : '⬅ INCOMING: '} {edge.label}
                      </div>
                      <div className="font-semibold text-zinc-800 truncate">
                        {targetNode?.data?.label || targetId}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-4 pt-3 border-t border-zinc-100 flex gap-2">
              <button
                onClick={() => setSearchQuery(selected.data?.label || '')}
                className="flex-1 btn-ghost text-xs py-1.5 text-center font-bold border border-zinc-200"
              >
                Focus Node
              </button>
              <button
                onClick={() => setSelected(null)}
                className="btn-ghost text-xs py-1.5 px-3 text-zinc-500 hover:text-zinc-900"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
