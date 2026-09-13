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
  low:          'text-red-400 bg-red-500/10 border-red-500/30',
  medium:       'text-amber-400 bg-amber-500/10 border-amber-500/30',
  'medium-high': 'text-brand-400 bg-brand-500/10 border-brand-500/30',
  high:         'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
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
      <div className="glass p-6 flex flex-col items-center justify-center gap-3 min-h-[200px]">
        <div className="relative">
          <Brain className="w-8 h-8 text-brand-400 animate-pulse" />
          <div className="absolute inset-0 rounded-full bg-brand-500/20 animate-ping" />
        </div>
        <p className="text-slate-400 text-sm">AI is analyzing the evidence...</p>
        <div className="flex gap-1">
          {[0,1,2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }} />
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="glass p-8 text-center">
        <Brain className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-500 text-sm">Run an AI investigation to see analysis</p>
        {onAsk && (
          <div className="mt-4 flex gap-2 max-w-md mx-auto">
            <input
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAsk()}
              placeholder="Ask a question about this case..."
              className="form-input text-sm"
            />
            <button onClick={handleAsk} className="btn-brand px-3 py-2 shrink-0">
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Summary banner */}
      {data.summary && (
        <div className="glass p-4 border-l-4 border-brand-500">
          <p className="text-sm font-semibold text-brand-300 mb-1">Executive Summary</p>
          <p className="text-slate-300 text-sm leading-relaxed">{data.summary}</p>
        </div>
      )}

      {/* Confidence */}
      {data.confidence && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm w-fit ${
          CONFIDENCE_COLOR[data.confidence.toLowerCase()] || CONFIDENCE_COLOR.medium
        }`}>
          <BarChart2 className="w-4 h-4" />
          Confidence: <strong className="capitalize">{data.confidence}</strong>
        </div>
      )}

      {/* Hypothesis */}
      {data.hypothesis && (
        <div className="glass p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-amber-300">Primary Hypothesis</span>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed italic">"{data.hypothesis}"</p>
        </div>
      )}

      {/* Reasoning */}
      {data.reasoning && (
        <div className="glass p-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-brand-400" />
              <span className="text-sm font-semibold text-slate-200">AI Reasoning</span>
            </div>
            {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>
          {expanded && (
            <p className="text-slate-400 text-sm leading-relaxed mt-3 whitespace-pre-line">
              {data.reasoning}
            </p>
          )}
        </div>
      )}

      {/* Next steps */}
      {data.next_steps && data.next_steps.length > 0 && (
        <div className="glass p-4">
          <div className="flex items-center gap-2 mb-3">
            <ListChecks className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-slate-200">Recommended Next Steps</span>
          </div>
          <ol className="space-y-2">
            {data.next_steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="w-5 h-5 rounded-full bg-brand-600/30 text-brand-400 flex items-center justify-center text-xs font-bold shrink-0">
                  {i + 1}
                </span>
                <span className="text-slate-300">{step}</span>
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
            placeholder="Ask a follow-up question..."
            className="form-input text-sm"
          />
          <button onClick={handleAsk} disabled={!question.trim()} className="btn-brand px-3 py-2 shrink-0">
            <Send className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
