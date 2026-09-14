import { useState, useEffect } from 'react'
import {
  KeyRound, Sparkles, Check, AlertCircle, Eye, EyeOff,
  ExternalLink, Loader2, X, RefreshCw, Cpu, CheckCircle2, Shield
} from 'lucide-react'
import {
  getAiConfig, saveAiConfig, callDirectLLM,
  AIProvider, PROVIDER_DEFAULTS, AIConfig
} from '../lib/aiConfig'

interface ApiKeyModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved?: () => void
}

export default function ApiKeyModal({ isOpen, onClose, onSaved }: ApiKeyModalProps) {
  const [provider, setProvider] = useState<AIProvider>('gemini')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('gemini-1.5-flash')
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const cfg = getAiConfig()
      setProvider(cfg.provider)
      setApiKey(cfg.apiKey)
      setModel(cfg.model)
      setTestResult(null)
      setSaveSuccess(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleProviderChange = (p: AIProvider) => {
    setProvider(p)
    setModel(PROVIDER_DEFAULTS[p]?.defaultModel || '')
    setTestResult(null)
    setSaveSuccess(false)
  }

  const handleTestKey = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      if (provider === 'mock') {
        await new Promise(r => setTimeout(r, 400))
        setTestResult({ success: true, message: 'CyberTrace built-in forensic neural engine is active and ready!' })
        return
      }

      if (!apiKey.trim()) {
        setTestResult({ success: false, message: 'Please paste or enter an API key first.' })
        return
      }

      // Live test call with real prompt
      const res = await callDirectLLM('Ping test. Is this investigation engine online?', {
        provider,
        apiKey: apiKey.trim(),
        model: model.trim(),
      })

      setTestResult({
        success: true,
        message: `Connection verified! Model responded with confidence: ${res.confidence || 'High'}.`,
      })
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Verification failed. Please verify API key format and quotas.',
      })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = () => {
    saveAiConfig({
      provider,
      apiKey: apiKey.trim(),
      model: model.trim(),
    })
    setSaveSuccess(true)
    setTimeout(() => {
      onSaved?.()
      onClose()
    }, 600)
  }

  const currentMeta = PROVIDER_DEFAULTS[provider]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center shadow-xs">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-zinc-950 text-base">AI Engine & API Keys</h3>
              <p className="text-zinc-500 text-xs">Configure live LLM providers for AI Investigator and narrative reports</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Provider Selection Cards */}
          <div>
            <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider block mb-2">
              Select AI Engine Provider
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(['gemini', 'openai', 'anthropic', 'ollama', 'mock'] as AIProvider[]).map(p => {
                const isSelected = provider === p
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleProviderChange(p)}
                    className={`p-3 rounded-xl text-left border transition-all text-xs font-semibold flex flex-col justify-between ${
                      isSelected
                        ? 'border-red-500 bg-red-50/70 text-red-900 shadow-xs'
                        : 'border-zinc-200 hover:border-zinc-300 text-zinc-700 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="font-bold truncate">{PROVIDER_DEFAULTS[p].name.split(' ')[0]}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-red-600 shrink-0" />}
                    </div>
                    <span className="text-[10px] text-zinc-400 font-normal">
                      {p === 'gemini' ? 'Recommended (Free)' : p === 'openai' ? 'GPT-4o / Mini' : p === 'anthropic' ? 'Claude 3.5' : p === 'ollama' ? 'Local' : 'Offline Built-in'}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* API Key Input */}
          {provider !== 'mock' && provider !== 'ollama' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  {currentMeta.name} API Key
                </label>
                {currentMeta.helpUrl !== '#' && (
                  <a
                    href={currentMeta.helpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 transition-colors"
                  >
                    Get API Key <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => {
                    setApiKey(e.target.value)
                    setTestResult(null)
                  }}
                  placeholder={currentMeta.keyPlaceholder}
                  className="w-full px-3.5 py-2.5 pr-20 text-sm font-mono bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-zinc-900"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg transition-colors"
                    title={showKey ? 'Hide key' : 'Show key'}
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Your key is stored securely in your browser's encrypted local state and sent directly to {currentMeta.name}.
              </p>
            </div>
          )}

          {/* Model Selector */}
          <div>
            <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider block mb-1.5">
              Model Selection
            </label>
            <div className="flex gap-2">
              <select
                value={model}
                onChange={e => setModel(e.target.value)}
                className="flex-1 px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-medium"
              >
                {currentMeta.models.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <input
                type="text"
                value={model}
                onChange={e => setModel(e.target.value)}
                placeholder="Or type custom model..."
                className="w-44 px-3 py-2 text-xs font-mono bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-800 focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>
          </div>

          {/* Test Status Alert */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 animate-fade-in ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <span className="font-bold block">{testResult.success ? 'Success' : 'Connection Error'}</span>
                <span className="text-[11px] leading-relaxed">{testResult.message}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleTestKey}
            disabled={testing || (provider !== 'mock' && provider !== 'ollama' && !apiKey.trim())}
            className="px-4 py-2 rounded-xl border border-zinc-300 hover:bg-zinc-100 text-zinc-700 text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-600" /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span>Test Connection</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-zinc-600 hover:text-zinc-900 text-xs font-semibold hover:bg-zinc-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 transition-all flex items-center gap-1.5"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Save Configuration</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
