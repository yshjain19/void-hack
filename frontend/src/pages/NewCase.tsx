import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderPlus, ArrowLeft, Loader2, Tag } from 'lucide-react'
import { casesApi } from '../lib/api'
import { useCase } from '../lib/CaseContext'

const STATUS_OPTIONS = ['open', 'active', 'pending']
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'critical']

export default function NewCase() {
  const navigate = useNavigate()
  const { setActiveCase } = useCase()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [offlineFallback, setOfflineFallback] = useState<{ id: string; title: string } | null>(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    investigator: '',
    tags: '',
  })

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setLoading(true)
    setError(null)
    setOfflineFallback(null)
    try {
      const res = await casesApi.create(form)
      setActiveCase(res.data.id, res.data.title || form.title)
      navigate(`/cases/${res.data.id}`)
    } catch (err: any) {
      const fallbackId = `case-${Date.now().toString(36)}`
      setOfflineFallback({ id: fallbackId, title: form.title })
      setError(
        err?.response?.data?.detail ||
        'Unable to connect to backend server. You can proceed directly in offline/preview mode.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleProceedOffline = () => {
    if (!offlineFallback) return
    setActiveCase(offlineFallback.id, offlineFallback.title)
    navigate(`/cases/${offlineFallback.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">New Investigation Case</h1>
          <p className="text-slate-400 text-sm">Create a new forensic investigation</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass p-6 space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Case Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="e.g., Operation Wire Fraud Alpha"
            className="form-input"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Describe the nature of this investigation..."
            rows={4}
            className="form-input resize-none"
          />
        </div>

        {/* Priority & Status row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Priority</label>
            <div className="flex gap-2 flex-wrap">
              {PRIORITY_OPTIONS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => set('priority', p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    form.priority === p
                      ? p === 'critical' ? 'bg-red-500/20 text-red-300 border-red-500/50' :
                        p === 'high' ? 'bg-orange-500/20 text-orange-300 border-orange-500/50' :
                        p === 'medium' ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' :
                        'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'text-slate-500 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Investigator</label>
            <input
              type="text"
              value={form.investigator}
              onChange={e => set('investigator', e.target.value)}
              placeholder="Detective name or ID"
              className="form-input"
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            <Tag className="w-3.5 h-3.5 inline mr-1" />
            Tags <span className="text-slate-500 font-normal">(comma-separated)</span>
          </label>
          <input
            type="text"
            value={form.tags}
            onChange={e => set('tags', e.target.value)}
            placeholder="e.g., wire-fraud, financial, cross-border"
            className="form-input"
          />
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm space-y-3">
            <div className="flex items-start gap-2">
              <span className="font-semibold text-red-400">Notice:</span>
              <span>{error}</span>
            </div>
            {offlineFallback && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleProceedOffline}
                  className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-xs font-semibold text-red-200 transition-colors"
                >
                  Proceed with Demo / Local Case &rarr;
                </button>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading || !form.title.trim()} className="btn-brand flex items-center gap-2 flex-1 justify-center">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderPlus className="w-4 h-4" />}
            {loading ? 'Creating...' : 'Create Case'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-ghost">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
