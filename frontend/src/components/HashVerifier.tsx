import { useState, useEffect } from 'react'
import { Shield, CheckCircle, XCircle, Loader2, Hash } from 'lucide-react'
import { evidenceApi } from '../lib/api'
import { truncateHash } from '../lib/utils'

interface HashVerifierProps {
  evidenceId: string
  storedHash: string
}

interface VerifyResult {
  is_valid: boolean
  entries: number
  broken_at: number | null
  current_file_hash: string | null
  stored_hash: string
  file_integrity_valid: boolean | null
}

export default function HashVerifier({ evidenceId, storedHash }: HashVerifierProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const verify = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await evidenceApi.verify(evidenceId)
      setResult(res.data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-brand-400" />
          <span className="text-sm font-semibold text-slate-200">Integrity Verification</span>
        </div>
        <button
          onClick={verify}
          disabled={loading}
          className="btn-ghost text-xs py-1 px-3 flex items-center gap-1.5"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Shield className="w-3 h-3" />}
          {loading ? 'Verifying...' : 'Verify Now'}
        </button>
      </div>

      {/* Stored hash */}
      <div>
        <p className="text-xs text-slate-500 mb-1">Stored SHA-256 Hash</p>
        <code className="hash-text block w-full">{storedHash}</code>
      </div>

      {/* Verification result */}
      {result && (
        <div className="space-y-2 animate-fade-in">
          {/* File integrity */}
          <div className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${
            result.file_integrity_valid
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            {result.file_integrity_valid
              ? <CheckCircle className="w-3.5 h-3.5 shrink-0" />
              : <XCircle className="w-3.5 h-3.5 shrink-0" />}
            <span>
              {result.file_integrity_valid
                ? 'File hash matches — no tampering detected'
                : 'File hash MISMATCH — file may have been modified!'}
            </span>
          </div>

          {/* Chain integrity */}
          <div className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${
            result.is_valid
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            {result.is_valid
              ? <CheckCircle className="w-3.5 h-3.5 shrink-0" />
              : <XCircle className="w-3.5 h-3.5 shrink-0" />}
            <span>
              Custody chain: {result.entries} entries
              {result.is_valid ? ' — all intact' : ` — broken at #${result.broken_at}`}
            </span>
          </div>

          {/* Current hash */}
          {result.current_file_hash && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Current File Hash</p>
              <code className={`hash-text block w-full ${
                result.file_integrity_valid ? 'text-emerald-400 border-emerald-500/20' : 'text-red-400 border-red-500/20'
              }`}>
                {result.current_file_hash}
              </code>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
          <XCircle className="w-3.5 h-3.5" />
          {error}
        </div>
      )}
    </div>
  )
}
