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
  UPLOADED:    { icon: Upload,      color: 'text-red-600',    label: 'Uploaded' },
  ACCESSED:    { icon: Eye,         color: 'text-zinc-900',   label: 'Accessed' },
  VERIFIED:    { icon: Shield,      color: 'text-emerald-600',label: 'Verified' },
  DOWNLOADED:  { icon: Download,    color: 'text-red-700',    label: 'Downloaded' },
  DELETED:     { icon: Trash2,      color: 'text-red-600',    label: 'Deleted' },
  DEFAULT:     { icon: CheckCircle, color: 'text-zinc-700',   label: 'Event' },
}

export default function CustodyChain({ logs, isValid }: CustodyChainProps) {
  return (
    <div className="space-y-4">
      {/* Integrity status */}
      <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-sm font-semibold ${
        isValid === undefined ? 'bg-zinc-100 border-zinc-200 text-zinc-700' :
        isValid ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                  'bg-red-50 border-red-200 text-red-800'
      }`}>
        {isValid === undefined && <AlertTriangle className="w-4 h-4 text-zinc-500" />}
        {isValid === true && <Shield className="w-4 h-4 text-emerald-600" />}
        {isValid === false && <AlertTriangle className="w-4 h-4 text-red-600" />}
        <span>
          {isValid === undefined ? 'Integrity verification pending' :
           isValid ? 'Chain integrity verified — tamper-evident cryptographic log intact' :
                     'Chain integrity BROKEN — tampering alert detected'}
        </span>
      </div>

      {/* Timeline */}
      <div className="relative pl-1">
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-zinc-200" />
        <div className="space-y-3.5">
          {logs.map((log, i) => {
            const config = ACTION_CONFIG[log.action] || ACTION_CONFIG.DEFAULT
            const Icon = config.icon
            return (
              <div key={log.id} className="relative flex gap-3.5 pl-1 animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                <div className={`w-8 h-8 rounded-full bg-white border-2 border-zinc-300 flex items-center justify-center shrink-0 z-10 shadow-xs ${config.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="glass p-3.5 flex-1 min-w-0 border-zinc-200/90 shadow-xs">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className={`text-sm font-bold ${config.color}`}>
                      #{log.sequence} — {config.label}
                    </span>
                    <span className="text-xs text-zinc-400 font-medium">{formatDateTime(log.timestamp)}</span>
                  </div>
                  <p className="text-xs text-zinc-600 mt-1">Actor: <span className="text-zinc-900 font-semibold">{log.actor}</span></p>
                  <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold block">Chain Hash</span>
                      <span className="hash-text inline-block max-w-full truncate font-mono mt-0.5">{truncateHash(log.chain_hash, 12)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold block">Previous Block</span>
                      <span className="hash-text inline-block max-w-full truncate font-mono mt-0.5">{truncateHash(log.prev_hash, 12)}</span>
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
