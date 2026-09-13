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
  person:       { icon: User,      color: 'text-blue-400',    bg: 'from-blue-900/60 to-blue-950/60' },
  organization: { icon: Building2, color: 'text-purple-400',  bg: 'from-purple-900/60 to-purple-950/60' },
  ip:           { icon: Monitor,   color: 'text-amber-400',   bg: 'from-amber-900/60 to-amber-950/60' },
  account:      { icon: CreditCard,color: 'text-emerald-400', bg: 'from-emerald-900/60 to-emerald-950/60' },
  email:        { icon: Mail,      color: 'text-cyan-400',    bg: 'from-cyan-900/60 to-cyan-950/60' },
  phone:        { icon: Phone,     color: 'text-pink-400',    bg: 'from-pink-900/60 to-pink-950/60' },
  address:      { icon: MapPin,    color: 'text-red-400',     bg: 'from-red-900/60 to-red-950/60' },
}

const RISK_BORDER = {
  critical: 'border-red-500/60',
  high:     'border-orange-500/60',
  medium:   'border-amber-500/40',
  low:      'border-slate-700/60',
}

function EntityNode({ data, selected }: NodeProps<EntityNodeData>) {
  const config = TYPE_CONFIG[data.type] || TYPE_CONFIG.person
  const Icon = config.icon
  const level = getRiskLevel(data.risk_score)
  const riskBorder = RISK_BORDER[level]

  return (
    <div className={`
      relative min-w-[130px] rounded-xl p-3 border backdrop-blur-xl
      bg-gradient-to-br ${config.bg} ${riskBorder}
      ${selected ? 'shadow-lg shadow-brand-500/30 ring-2 ring-brand-500/50' : ''}
      transition-all duration-200
    `}>
      <Handle type="target" position={Position.Top} className="!bg-brand-500 !w-2 !h-2 !border-0" />

      <div className="flex flex-col items-center gap-1.5 text-center">
        <div className={`w-8 h-8 rounded-lg bg-slate-900/60 flex items-center justify-center ${config.color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs font-semibold text-slate-200 leading-tight break-all max-w-[120px]">
          {data.label.length > 20 ? data.label.slice(0, 20) + '…' : data.label}
        </span>
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-500 capitalize">{data.type}</span>
          {data.risk_score > 0.3 && (
            <span className={`text-xs font-bold ${
              level === 'critical' ? 'text-red-400' :
              level === 'high' ? 'text-orange-400' : 'text-amber-400'
            }`}>
              ⚠
            </span>
          )}
        </div>
        {/* Risk bar */}
        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${
              level === 'critical' ? 'from-red-600 to-red-400' :
              level === 'high' ? 'from-orange-600 to-orange-400' :
              level === 'medium' ? 'from-amber-600 to-amber-400' :
              'from-emerald-600 to-emerald-400'
            }`}
            style={{ width: `${Math.min(data.risk_score * 100, 100)}%` }}
          />
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-brand-500 !w-2 !h-2 !border-0" />
    </div>
  )
}

export default memo(EntityNode)
