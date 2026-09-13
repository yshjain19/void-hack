import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import { User, Building2, Monitor, CreditCard, Mail, Phone, MapPin } from 'lucide-react'
import { getRiskLevel } from '../lib/utils'

export interface EntityNodeData {
  label: string
  type: string
  risk_score: number
  properties?: Record<string, unknown>
}

const TYPE_CONFIG: Record<string, {
  icon: React.ComponentType<{ className?: string }>
  color: string
  bg: string
}> = {
  person:       { icon: User,       color: 'text-zinc-900', bg: 'bg-zinc-100' },
  organization: { icon: Building2,  color: 'text-red-700',  bg: 'bg-red-50' },
  ip:           { icon: Monitor,    color: 'text-zinc-800', bg: 'bg-zinc-100' },
  account:      { icon: CreditCard, color: 'text-red-600',  bg: 'bg-red-50' },
  email:        { icon: Mail,       color: 'text-zinc-900', bg: 'bg-zinc-100' },
  phone:        { icon: Phone,      color: 'text-red-700',  bg: 'bg-red-50' },
  address:      { icon: MapPin,     color: 'text-zinc-900', bg: 'bg-zinc-100' },
}

const RISK_BORDER = {
  critical: 'border-red-600 ring-2 ring-red-500/20 shadow-red-500/10',
  high:     'border-red-400 shadow-sm',
  medium:   'border-zinc-400 shadow-sm',
  low:      'border-zinc-200 shadow-xs',
}

function EntityNode({ data, selected }: NodeProps<EntityNodeData>) {
  const config = TYPE_CONFIG[data.type] || TYPE_CONFIG.person
  const Icon = config.icon
  const level = getRiskLevel(data.risk_score)
  const riskBorder = RISK_BORDER[level]

  return (
    <div className={`
      relative min-w-[130px] rounded-xl p-3 border bg-white text-zinc-900
      ${riskBorder}
      ${selected ? 'shadow-lg shadow-red-600/20 ring-2 ring-red-600' : 'shadow-xs'}
      transition-all duration-200
    `}>
      <Handle type="target" position={Position.Top} className="!bg-red-600 !w-2.5 !h-2.5 !border-2 !border-white" />

      <div className="flex flex-col items-center gap-1.5 text-center">
        <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center ${config.color} border border-zinc-200/80`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs font-bold text-zinc-950 leading-tight break-all max-w-[120px]">
          {data.label.length > 20 ? data.label.slice(0, 20) + '…' : data.label}
        </span>
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-zinc-500 font-semibold capitalize">{data.type}</span>
          {data.risk_score > 0.3 && (
            <span className={`text-xs font-bold ${
              level === 'critical' ? 'text-red-600' :
              level === 'high' ? 'text-red-500' : 'text-zinc-700'
            }`}>
              ⚠
            </span>
          )}
        </div>
        {/* Risk bar */}
        <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${
              level === 'critical' ? 'from-red-600 to-red-500' :
              level === 'high' ? 'from-red-500 to-rose-400' :
              level === 'medium' ? 'from-zinc-800 to-zinc-600' :
              'from-zinc-500 to-zinc-300'
            }`}
            style={{ width: `${Math.min(data.risk_score * 100, 100)}%` }}
          />
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-red-600 !w-2.5 !h-2.5 !border-2 !border-white" />
    </div>
  )
}

export default memo(EntityNode)
