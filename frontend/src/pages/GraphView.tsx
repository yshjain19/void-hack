import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import ReactFlow, {
  Controls, MiniMap, Background, BackgroundVariant,
  useNodesState, useEdgesState, addEdge,
  type Connection, type Edge, type Node,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Network, RefreshCw, Loader2, ArrowLeft, Zap, Users } from 'lucide-react'
import { graphApi } from '../lib/api'
import EntityNode from '../components/EntityNode'
import { getRiskColor } from '../lib/utils'
import { useCase } from '../lib/CaseContext'

const nodeTypes = { entity: EntityNode }

// Layout nodes in a force-like grid
function layoutNodes(nodes: any[], edges: any[]) {
  const cols = Math.ceil(Math.sqrt(nodes.length))
  return nodes.map((n, i) => ({
    ...n,
    position: {
      x: (i % cols) * 200 + Math.random() * 40 - 20,
      y: Math.floor(i / cols) * 180 + Math.random() * 30 - 15,
    },
  }))
}

export default function GraphView() {
  const { id: caseId } = useParams<{ id: string }>()
  const { setActiveCase } = useCase()
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [loading, setLoading] = useState(true)
  const [building, setBuilding] = useState(false)
  const [stats, setStats] = useState({ nodes: 0, edges: 0 })
  const [selected, setSelected] = useState<any>(null)

  useEffect(() => {
    if (caseId) setActiveCase(caseId)
  }, [caseId])

  const loadGraph = async () => {
    setLoading(true)
    try {
      const res = await graphApi.get(caseId!)
      const data = res.data

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
          position: { x: 0, y: 0 },
        })),
        data.edges,
      )

      const rfEdges: Edge[] = data.edges.map((e: any) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.relationship,
        animated: e.weight > 0.7,
        style: { stroke: 'rgba(99,102,241,0.5)', strokeWidth: Math.max(1, e.weight * 2) },
        labelStyle: { fill: '#64748b', fontSize: 10 },
        labelBgStyle: { fill: '#1e293b', fillOpacity: 0.8 },
      }))

      setNodes(rfNodes)
      setEdges(rfEdges)
      setStats({ nodes: data.node_count, edges: data.edge_count })
    } catch {
      // Load mock graph
      setNodes(MOCK_NODES)
      setEdges(MOCK_EDGES)
      setStats({ nodes: MOCK_NODES.length, edges: MOCK_EDGES.length })
    } finally {
      setLoading(false)
    }
  }

  const buildGraph = async () => {
    setBuilding(true)
    try {
      await graphApi.build(caseId!)
      await loadGraph()
    } catch {
      // Re-layout and simulate graph rebuild
      setNodes(layoutNodes(MOCK_NODES, MOCK_EDGES))
      setEdges(MOCK_EDGES)
      setStats({ nodes: MOCK_NODES.length, edges: MOCK_EDGES.length })
    } finally {
      setBuilding(false)
    }
  }

  useEffect(() => { loadGraph() }, [caseId])

  const onConnect = useCallback(
    (params: Connection) => setEdges(eds => addEdge(params, eds)),
    [],
  )

  const onNodeClick = (_: any, node: Node) => setSelected(node)

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <Link to={`/cases/${caseId}`} className="btn-ghost p-2">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Network className="w-5 h-5 text-brand-400" />
          <div>
            <h2 className="font-bold text-white">Entity Relationship Graph</h2>
            <p className="text-xs text-slate-500">{stats.nodes} nodes · {stats.edges} edges</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => loadGraph()} className="btn-ghost flex items-center gap-2 text-sm">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={buildGraph} disabled={building} className="btn-brand flex items-center gap-2 text-sm">
            {building ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {building ? 'Building...' : 'Rebuild Graph'}
          </button>
        </div>
      </div>

      {/* Graph canvas */}
      <div className="flex-1 glass overflow-hidden relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 text-sm">Loading entity graph...</p>
            </div>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.3}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
          >
            <Controls className="!bottom-4 !left-4" />
            <MiniMap
              nodeColor={n => getRiskColor(n.data?.risk_score ?? 0)}
              className="!bottom-4 !right-4"
            />
            <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(99,102,241,0.08)" />
          </ReactFlow>
        )}

        {/* Selected node panel */}
        {selected && (
          <div className="absolute top-4 right-4 max-w-[calc(100vw-3rem)] w-64 glass p-4 animate-slide-up z-10">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs text-brand-400 uppercase tracking-wider font-semibold">
                {selected.data?.type}
              </span>
              <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-slate-300">✕</button>
            </div>
            <p className="text-sm font-semibold text-slate-100 break-all mb-2">{selected.data?.label}</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Risk Score</span>
                <span className="text-slate-300 font-mono">{(selected.data?.risk_score * 100).toFixed(0)}%</span>
              </div>
              {selected.data?.properties && Object.entries(selected.data.properties).slice(0, 4).map(([k, v]) => (
                <div key={k} className="flex justify-between text-xs">
                  <span className="text-slate-500 capitalize">{k.replace(/_/g, ' ')}</span>
                  <span className="text-slate-400 truncate max-w-[100px]">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Mock graph data for development
const MOCK_NODES: Node[] = [
  { id: 'n1', type: 'entity', position: { x: 100, y: 100 }, data: { label: 'John Doe', type: 'person', risk_score: 0.82 } },
  { id: 'n2', type: 'entity', position: { x: 350, y: 60 }, data: { label: 'Shell Corp LLC', type: 'organization', risk_score: 0.91 } },
  { id: 'n3', type: 'entity', position: { x: 600, y: 130 }, data: { label: 'ACC-88421', type: 'account', risk_score: 0.65 } },
  { id: 'n4', type: 'entity', position: { x: 200, y: 300 }, data: { label: '185.220.101.47', type: 'ip', risk_score: 0.73 } },
  { id: 'n5', type: 'entity', position: { x: 480, y: 290 }, data: { label: 'j.doe@protonmail.com', type: 'email', risk_score: 0.55 } },
  { id: 'n6', type: 'entity', position: { x: 720, y: 280 }, data: { label: 'Panama Holdings', type: 'organization', risk_score: 0.88 } },
]

const MOCK_EDGES: Edge[] = [
  { id: 'e1', source: 'n1', target: 'n2', label: 'CONTROLS', style: { stroke: 'rgba(239,68,68,0.6)' }, animated: true },
  { id: 'e2', source: 'n1', target: 'n5', label: 'USES', style: { stroke: 'rgba(99,102,241,0.5)' } },
  { id: 'e3', source: 'n2', target: 'n3', label: 'OWNS', style: { stroke: 'rgba(239,68,68,0.6)' }, animated: true },
  { id: 'e4', source: 'n4', target: 'n5', label: 'SENT_FROM', style: { stroke: 'rgba(245,158,11,0.5)' } },
  { id: 'e5', source: 'n2', target: 'n6', label: 'TRANSFERS_TO', style: { stroke: 'rgba(239,68,68,0.7)' }, animated: true },
  { id: 'e6', source: 'n3', target: 'n6', label: 'RELATED_TO', style: { stroke: 'rgba(99,102,241,0.4)' } },
]
