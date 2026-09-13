import { cn, getRiskLevel } from '../lib/utils'

interface RiskBadgeProps {
  score: number
  showScore?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const LEVEL_CONFIG = {
  critical: { label: 'CRITICAL', className: 'risk-critical' },
  high:     { label: 'HIGH',     className: 'risk-high' },
  medium:   { label: 'MEDIUM',   className: 'risk-medium' },
  low:      { label: 'LOW',      className: 'risk-low' },
}

export function RiskBadge({ score, showScore = false, size = 'sm' }: RiskBadgeProps) {
  const level = getRiskLevel(score)
  const { label, className } = LEVEL_CONFIG[level]

  return (
    <span className={cn(className, size === 'lg' && 'text-sm px-3 py-1')}>
      {label}{showScore && ` (${(score * 100).toFixed(0)}%)`}
    </span>
  )
}

// Risk gauge bar
export function RiskBar({ score }: { score: number }) {
  const level = getRiskLevel(score)
  const colors = {
    critical: 'from-red-600 to-red-400',
    high:     'from-orange-600 to-orange-400',
    medium:   'from-amber-600 to-amber-400',
    low:      'from-emerald-600 to-emerald-400',
  }
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-500', colors[level])}
          style={{ width: `${Math.min(score * 100, 100)}%` }}
        />
      </div>
      <span className="text-xs text-slate-400 w-10 text-right">{(score * 100).toFixed(0)}%</span>
    </div>
  )
}
