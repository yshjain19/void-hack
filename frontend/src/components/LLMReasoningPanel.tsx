import { useState } from 'react'
import { Brain, Send, Loader2, Lightbulb, ListChecks, BarChart2, ChevronDown, ChevronUp } from 'lucide-react'

interface LLMReasoningPanelProps {
  data: {
    reasoning?: string
    hypothesis?: string
    confidence?: string
    next_steps?: string[]
    content?: string
    summary?: string
  } | null
  loading?: boolean
  onAsk?: (question: string) => void
}

const CONFIDENCE_COLOR: Record<string, string> = {
  low:          'text-red-700 bg-red-50 border-red-200',
  medium:       'text-zinc-800 bg-zinc-100 border-zinc-300',
  'medium-high': 'text-red-600 bg-red-50 border-red-300',
  high:         'text-emerald-800 bg-emerald-50 border-emerald-300',
}

export default function LLMReasoningPanel({ data, loading, onAsk }: LLMReasoningPanelProps) {
  const [question, setQuestion] = useState('')
  const [expanded, setExpanded] = useState(true)

  const handleAsk = () => {
    if (!question.trim() || !onAsk) return
    onAsk(question.trim())
    setQuestion('')
  }

  if (loading) {
    return (
      <div className="glass p-8 flex flex-col items-center justify-center gap-3 min-h-[220px] text-center border-zinc-200/90 shadow-sm">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center border border-red-200">
            <Brain className="w-6 h-6 text-red-600 animate-pulse" />
          </div>
          <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
        </div>
        <div>
          <p className="text-zinc-900 font-bold text-sm">Forensic AI Reasoning Engine Active</p>
          <p className="text-zinc-500 text-xs mt-0.5">Synthesizing evidence artifacts, behavioral anomalies, and custody graphs...</p>
        </div>
        <div className="flex gap-1 mt-1">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-red-600 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="glass p-8 text-center border-zinc-200/90 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-zinc-100 text-zinc-500 flex items-center justify-center mx-auto mb-3 border border-zinc-200">
          <Brain className="w-6 h-6 text-zinc-600" />
        </div>
        <h4 className="text-base font-bold text-zinc-900">AI Forensic Analysis Ready</h4>
        <p className="text-zinc-500 text-sm mt-1 max-w-md mx-auto">
          Run an investigation hypothesis generation or ask a direct case question below to initiate inference.
        </p>
        {onAsk && (
          <div className="mt-5 flex gap-2 max-w-md mx-auto">
            <input
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAsk()}
              placeholder="Ask a question about this case..."
              className="form-input text-sm"
            />
            <button onClick={handleAsk} className="btn-brand px-3.5 py-2 shrink-0">
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Summary banner */}
      {data.summary && (
        <div className="glass p-4 border-l-4 border-red-600 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-red-700 mb-1">Executive Summary</p>
          <p className="text-zinc-800 text-sm leading-relaxed font-medium">{data.summary}</p>
        </div>
      )}

      {/* Confidence */}
      {data.confidence && (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold w-fit ${
          CONFIDENCE_COLOR[data.confidence.toLowerCase()] || CONFIDENCE_COLOR.medium
        }`}>
          <BarChart2 className="w-3.5 h-3.5" />
          Confidence Rating: <span className="capitalize">{data.confidence}</span>
        </div>
      )}

      {/* Hypothesis */}
      {data.hypothesis && (
        <div className="glass p-4 border-zinc-200/90 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-red-600" />
            <span className="text-sm font-bold text-zinc-950">Primary Working Hypothesis</span>
          </div>
          <p className="text-zinc-700 text-sm leading-relaxed italic bg-zinc-50 p-3 rounded-lg border border-zinc-200">
            "{data.hypothesis}"
          </p>
        </div>
      )}

      {/* Reasoning */}
      {data.reasoning && (
        <div className="glass p-4 border-zinc-200/90 shadow-xs">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-red-600" />
              <span className="text-sm font-bold text-zinc-950">AI Forensic Reasoning & Evidence Nexus</span>
            </div>
            {expanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
          </button>
          {expanded && (
            <p className="text-zinc-600 text-sm leading-relaxed mt-3 whitespace-pre-line border-t border-zinc-100 pt-3">
              {data.reasoning}
            </p>
          )}
        </div>
      )}

      {/* Next steps */}
      {data.next_steps && data.next_steps.length > 0 && (
        <div className="glass p-4 border-zinc-200/90 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <ListChecks className="w-4 h-4 text-emerald-700" />
            <span className="text-sm font-bold text-zinc-950">Actionable Next Steps</span>
          </div>
          <ol className="space-y-2">
            {data.next_steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="w-5 h-5 rounded-full bg-red-50 text-red-700 border border-red-200 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-zinc-700 font-medium">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Ask follow-up */}
      {onAsk && (
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAsk()}
            placeholder="Ask a follow-up inquiry about this forensic evaluation..."
            className="form-input text-sm"
          />
          <button onClick={handleAsk} disabled={!question.trim()} className="btn-brand px-4 py-2 shrink-0 flex items-center gap-2">
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Ask</span>
          </button>
        </div>
      )}
    </div>
  )
}
