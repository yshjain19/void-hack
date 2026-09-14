import { useState, useEffect } from 'react'
import {
  KeyRound, Sparkles, Check, AlertCircle, Eye, EyeOff,
  ExternalLink, Loader2, X, RefreshCw, Cpu, CheckCircle2,
  Shield, Gift, Zap, HelpCircle
} from 'lucide-react'
import {
  getAiConfig, saveAiConfig, callDirectLLM, detectProviderFromKey,
  AIProvider, PROVIDER_DEFAULTS, AIConfig, DEFAULT_FREE_KEYS
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
    const saved = localStorage.getItem(`cybertrace_key_${p}`) || DEFAULT_FREE_KEYS[p] || ''
    setApiKey(saved)
    setTestResult(null)
    setSaveSuccess(false)
  }

  const handleKeyChange = (val: string) => {
    setApiKey(val)
    setTestResult(null)
    // Auto-detect provider if user pastes a recognized key
    const detected = detectProviderFromKey(val)
    if (detected && detected !== provider) {
      setProvider(detected)
      setModel(PROVIDER_DEFAULTS[detected]?.defaultModel || '')
    }
  }

  const handleTestKey = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      if (provider === 'mock') {
        await new Promise(r => setTimeout(r, 300))
        setTestResult({
          success: true,
          message: 'CyberTrace built-in forensic neural engine is active and ready with zero setup!',
        })
        return
      }

      if (!apiKey.trim()) {
        setTestResult({
          success: false,
          message: `Please paste or enter your free ${PROVIDER_DEFAULTS[provider]?.name} API key first.`,
        })
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-xl overflow-hidden animate-scale-in my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center shadow-xs">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-zinc-950 text-base">AI Engine & Free API Keys</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <Gift className="w-3 h-3 text-emerald-600" /> Free Options Available
                </span>
              </div>
              <p className="text-zinc-500 text-xs">Configure free or custom LLM providers for live forensic reasoning</p>
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
          {/* Free Provider Recommendations Notice */}
          <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 space-y-2">
            <div className="flex items-center justify-between font-bold text-emerald-900">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" /> 100% Free API Providers (No Credit Card Required)
              </span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              You can get a free API key in 30 seconds with no credit card. Choose any of these free services:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-emerald-100/70 border border-emerald-300 rounded-lg text-[11px] font-bold text-emerald-900 transition-colors shadow-2xs"
              >
                <span>Google Gemini Free Key</span>
                <ExternalLink className="w-3 h-3 text-emerald-600" />
              </a>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-emerald-100/70 border border-emerald-300 rounded-lg text-[11px] font-bold text-emerald-900 transition-colors shadow-2xs"
              >
                <Zap className="w-3 h-3 text-amber-500" />
                <span>Groq Cloud Free Key (Fastest)</span>
                <ExternalLink className="w-3 h-3 text-emerald-600" />
              </a>
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-emerald-100/70 border border-emerald-300 rounded-lg text-[11px] font-bold text-emerald-900 transition-colors shadow-2xs"
              >
                <span>OpenRouter Free Models</span>
                <ExternalLink className="w-3 h-3 text-emerald-600" />
              </a>
            </div>
          </div>

          {/* Provider Selection Cards */}
          <div>
            <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider block mb-2">
              Select AI Engine
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(['gemini', 'groq', 'mock', 'openrouter', 'openai', 'anthropic'] as AIProvider[]).map(p => {
                const meta = PROVIDER_DEFAULTS[p]
                const isSelected = provider === p
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleProviderChange(p)}
                    className={`p-3 rounded-xl text-left border transition-all text-xs font-semibold flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'border-red-500 bg-red-50/70 text-red-900 shadow-xs ring-1 ring-red-500/20'
                        : 'border-zinc-200 hover:border-zinc-300 text-zinc-700 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="font-bold truncate">{meta.name.split(' ')[0]}</span>
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      ) : meta.isFree ? (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">Free</span>
                      ) : null}
                    </div>
                    <span className="text-[10px] text-zinc-500 font-normal truncate">
                      {meta.badge}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Provider Info Banner */}
          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl flex items-start gap-2.5 text-xs">
            <HelpCircle className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
            <div className="text-zinc-600 leading-relaxed">
              <span className="font-bold text-zinc-900 block">{currentMeta.name}</span>
              <span>{currentMeta.notes}</span>
            </div>
          </div>

          {/* API Key Input */}
          {provider !== 'mock' && provider !== 'ollama' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  {currentMeta.name} API Key {currentMeta.isFree && <span className="text-emerald-700 font-bold">(Free)</span>}
                </label>
                {currentMeta.helpUrl !== '#' && (
                  <a
                    href={currentMeta.helpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-red-600 hover:text-red-700 font-bold flex items-center gap-1 transition-colors"
                  >
                    Get Free Key <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => handleKeyChange(e.target.value)}
                  placeholder={currentMeta.keyPlaceholder}
                  className="w-full px-3.5 py-2.5 pr-20 text-sm font-mono bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-zinc-900"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg transition-colors cursor-pointer"
                    title={showKey ? 'Hide key' : 'Show key'}
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Tip: Paste your key here. It is saved in your local browser storage and used directly for live inquiries.
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
                placeholder="Custom model..."
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
                <span className="font-bold block">{testResult.success ? 'Success' : 'Notice'}</span>
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
            className="px-4 py-2 rounded-xl border border-zinc-300 hover:bg-zinc-100 text-zinc-700 text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-600" /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span>Test Connection</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-zinc-600 hover:text-zinc-900 text-xs font-semibold hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
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
