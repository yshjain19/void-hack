import React from 'react'
import { CheckCircle, Shield, Eye, Upload, Download, Trash2, AlertTriangle } from 'lucide-react'
import { formatDateTime, truncateHash } from '../lib/utils'

interface CustodyEvent {
  id: string
  action: string
  actor: string
  timestamp: string
  sequence: number
  prev_hash: string
  chain_hash: string
  event_metadata?: Record<string, unknown>
}

interface CustodyChainProps {
  logs: CustodyEvent[]
  isValid?: boolean
}

const ACTION_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>, color: string, label: string }> = {
  UPLOADED:    { icon: Upload,      color: 'text-brand-400',   label: 'Uploaded' },
  ACCESSED:    { icon: Eye,         color: 'text-blue-400',    label: 'Accessed' },
  VERIFIED:    { icon: Shield,      color: 'text-emerald-400', label: 'Verified' },
  DOWNLOADED:  { icon: Download,    color: 'text-amber-400',   label: 'Downloaded' },
  DELETED:     { icon: Trash2,      color: 'text-red-400',     label: 'Deleted' },
  DEFAULT:     { icon: CheckCircle, color: 'text-slate-400',   label: 'Event' },
}

export default function CustodyChain({ logs, isValid }: CustodyChainProps) {
  return (
    <div className="space-y-3">
      {/* Integrity status */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
        isValid === undefined ? 'bg-slate-800/30 border-slate-700 text-slate-400' :
        isValid ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                  'bg-red-500/10 border-red-500/30 text-red-400'
      }`}>
        {isValid === undefined && <AlertTriangle className="w-4 h-4" />}
        {isValid === true && <Shield className="w-4 h-4" />}
        {isValid === false && <AlertTriangle className="w-4 h-4" />}
        <span>
          {isValid === undefined ? 'Integrity not verified' :
           isValid ? 'Chain integrity verified — tamper-evident log intact' :
                     'Chain integrity BROKEN — possible tampering detected'}
        </span>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-800" />
        <div className="space-y-3">
          {logs.map((log, i) => {
            const config = ACTION_CONFIG[log.action] || ACTION_CONFIG.DEFAULT
            const Icon = config.icon
            return (
              <div key={log.id} className="relative flex gap-4 pl-2 animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                <div className={`w-8 h-8 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center shrink-0 z-10 ${config.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="glass p-3 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className={`text-sm font-semibold ${config.color}`}>
                      #{log.sequence} — {config.label}
                    </span>
                    <span className="text-xs text-slate-500">{formatDateTime(log.timestamp)}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Actor: <span className="text-slate-300">{log.actor}</span></p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-slate-600">Prev Hash</p>
                      <code className="hash-text">{truncateHash(log.prev_hash, 12)}</code>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Chain Hash</p>
                      <code className="hash-text">{truncateHash(log.chain_hash, 12)}</code>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
