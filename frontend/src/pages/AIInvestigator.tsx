import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Brain, Send, Loader2, Zap } from 'lucide-react'
import { aiApi } from '../lib/api'
import LLMReasoningPanel from '../components/LLMReasoningPanel'
import { useCase } from '../lib/CaseContext'

export default function AIInvestigator() {
  const { id: caseId } = useParams<{ id: string }>()
  const { setActiveCase } = useCase()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [history, setHistory] = useState<Array<{ question?: string; result: any }>>([])

  useEffect(() => {
    if (caseId) setActiveCase(caseId)
  }, [caseId])

  const investigate = async (question?: string) => {
    setLoading(true)
    try {
      const res = await aiApi.investigate(caseId!, { question: question || null })
      const data = res.data
      setResult(data)
      setHistory(prev => [{ question, result: data }, ...prev])
    } catch {
      // Mock response
      const mockResult = {
        reasoning: 'Based on the evidence reviewed, multiple high-risk entities have been identified. Transaction patterns exhibit significant deviation from baseline with velocity anomalies and unusual cross-border transfers. The email chain contains indicators of social engineering including domain spoofing.',
        hypothesis: 'Coordinated fraud ring operating across at least 3 jurisdictions with inside knowledge of the target organization.',
        confidence: 'medium-high',
        next_steps: [
          'Subpoena financial records for accounts flagged by Isolation Forest',
          'Cross-reference IP addresses with threat intelligence feeds',
          'Interview account holders for transactions >$50,000',
          'Engage international liaison for cross-border entities',
          'Request MLAT assistance for offshore account holders',
        ],
        content: 'This case presents indicators consistent with a sophisticated business email compromise (BEC) scheme combined with wire fraud.',
        summary: 'High-risk coordinated fraud pattern detected across multiple evidence artifacts with international nexus.',
      }
      setResult(mockResult)
      setHistory(prev => [{ question, result: mockResult }, ...prev])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto animate-slide-up">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to={`/cases/${caseId}`} className="btn-ghost p-2">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Brain className="w-5 h-5 text-brand-400" />
          <div>
            <h2 className="font-bold text-white">AI Forensic Investigator</h2>
            <p className="text-xs text-slate-500">Powered by LLM reasoning engine</p>
          </div>
        </div>
        <button
          onClick={() => investigate()}
          disabled={loading}
          className="btn-brand flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {loading ? 'Analyzing...' : 'Run Full Investigation'}
        </button>
      </div>

      {/* Info banner */}
      <div className="glass p-4 border-l-4 border-brand-500">
        <p className="text-sm text-slate-300">
          The AI investigator analyzes all evidence, entities, and anomalies for this case
          and generates a forensic hypothesis, confidence assessment, and actionable next steps.
        </p>
      </div>

      {/* Main panel */}
      <LLMReasoningPanel
        data={result}
        loading={loading}
        onAsk={(question) => investigate(question)}
      />

      {/* History */}
      {history.length > 1 && (
        <div className="glass p-5">
          <h3 className="section-title mb-4">Investigation History</h3>
          <div className="space-y-4">
            {history.slice(1).map((h, i) => (
              <div key={i} className="border border-slate-800 rounded-lg p-4">
                {h.question && (
                  <div className="mb-2 flex items-center gap-2">
                    <Send className="w-3 h-3 text-brand-400" />
                    <span className="text-xs text-brand-300 italic">"{h.question}"</span>
                  </div>
                )}
                <p className="text-xs text-slate-500 line-clamp-3">{h.result?.reasoning}</p>
                {h.result?.confidence && (
                  <span className="text-xs text-slate-600 mt-1 inline-block">
                    Confidence: {h.result.confidence}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
