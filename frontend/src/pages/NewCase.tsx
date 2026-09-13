import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderPlus, ArrowLeft, Loader2, Tag } from 'lucide-react'
import { casesApi } from '../lib/api'
import { useCase } from '../lib/CaseContext'

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
      <div className="flex items-center gap-3.5 mb-6">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-950 tracking-tight">New Forensic Investigation</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Register a case file, assign clearance, and prepare chain-of-custody</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass p-6 sm:p-8 space-y-5 border-zinc-200/90 shadow-sm">
        {/* Title */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
            Case Title <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="e.g., Operation Wire Fraud Alpha"
            className="form-input text-sm"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
            Scope & Investigation Narrative
          </label>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Describe the nature of this financial, intrusion, or forensic investigation..."
            rows={4}
            className="form-input resize-none text-sm"
          />
        </div>

        {/* Priority & Investigator */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">Threat Priority</label>
            <div className="flex gap-2 flex-wrap">
              {PRIORITY_OPTIONS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => set('priority', p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    form.priority === p
                      ? p === 'critical' ? 'bg-red-100 text-red-800 border-red-300 ring-1 ring-red-500/20' :
                        p === 'high' ? 'bg-red-50 text-red-700 border-red-200' :
                        p === 'medium' ? 'bg-zinc-900 text-white border-zinc-800' :
                        'bg-zinc-100 text-zinc-700 border-zinc-300'
                      : 'text-zinc-500 border-zinc-200 bg-white hover:border-zinc-300'
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">Assigned Investigator</label>
            <input
              type="text"
              value={form.investigator}
              onChange={e => set('investigator', e.target.value)}
              placeholder="e.g., Det. Chen / Special Agent"
              className="form-input text-sm"
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
            <Tag className="w-3.5 h-3.5 inline mr-1 text-red-600" />
            Classification Tags <span className="text-zinc-400 font-normal lowercase">(comma-separated)</span>
          </label>
          <input
            type="text"
            value={form.tags}
            onChange={e => set('tags', e.target.value)}
            placeholder="e.g., wire-fraud, financial, offshore, swift"
            className="form-input text-sm"
          />
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm space-y-2">
            <div className="flex items-start gap-2">
              <span className="font-bold text-red-700">Notice:</span>
              <span className="font-medium">{error}</span>
            </div>
            {offlineFallback && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleProceedOffline}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-xs"
                >
                  Proceed with Local / Preview Case &rarr;
                </button>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading || !form.title.trim()} className="btn-brand flex items-center gap-2 flex-1 justify-center text-sm py-2.5">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderPlus className="w-4 h-4" />}
            {loading ? 'Creating Investigation...' : 'Register Investigation'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-ghost text-sm px-4">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
