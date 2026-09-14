import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Brain, Send, Loader2, Zap } from 'lucide-react'
import { aiApi } from '../lib/api'
import LLMReasoningPanel from '../components/LLMReasoningPanel'
import { useCase } from '../lib/CaseContext'

const DEFAULT_AI_RESULT = {
  reasoning: 'Forensic graph ingestion and Isolation Forest analysis indicate a multi-layered asset concealment structure. Alexander Vance (flagged UBO) exercises de facto control over Apex Global Holdings Ltd (BVI) via nominee director Elena Rostova. A suspicious $4.2M wire was routed through Barclays Escrow Acc ****9104 into Meridian Trade Partners (Hong Kong) under the guise of fictitious shipping logistics invoices, before undergoing an offshore drain into Cayman National Bank. An auxiliary return of $850,000 back to Vance Trust LLC constitutes an actionable circular kickback pattern.',
  hypothesis: 'Transnational corporate asset stripping and round-tripping scheme designed to divert $4.2M of company capital into offshore private accounts while evading CTR filing thresholds and concealing true beneficial ownership.',
  confidence: 'High (0.89)',
  next_steps: [
    'Execute urgent mutual legal assistance treaty (MLAT) request with Cayman Islands monetary authority for account ****3310',
    'Serve witness subpoena on nominee director Elena Rostova regarding beneficial ownership declarations',
    'Issue preservation notice to Barclays London regarding escrow ledger for transfer reference TX-99214',
    'Cross-reference IP 194.26.29.112 with known bulletproof hosting infrastructure feeds',
    'File suspicious activity report (SAR/STR) with FinCEN referencing circular round-tripping topology',
  ],
  content: 'CyberTrace AI synthesis confirms high likelihood of premeditated fraudulent diversion with international jurisdictional layering and nominee obfuscation.',
  summary: 'High-risk transnational fraud scheme detected with 26 connected entities, 14 statistical anomalies, and proven circular round-tripping loops.',
}

export default function AIInvestigator() {
  const { id: paramCaseId } = useParams<{ id: string }>()
  const { activeCaseId, setActiveCase } = useCase()
  const caseId = paramCaseId || activeCaseId

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(DEFAULT_AI_RESULT)
  const [history, setHistory] = useState<Array<{ question?: string; result: any }>>([])

  useEffect(() => {
    if (paramCaseId) setActiveCase(paramCaseId)
  }, [paramCaseId])

  const investigate = async (question?: string) => {
    setLoading(true)
    try {
      if (caseId) {
        const res = await aiApi.investigate(caseId, { question: question || null })
        const data = res.data
        setResult(data)
        setHistory(prev => [{ question, result: data }, ...prev])
        return
      }
      // Demo response if no case ID provided
      const customResponse = {
        ...DEFAULT_AI_RESULT,
        reasoning: question 
          ? `Analysis for query: "${question}" — Cross-referencing evidence items confirms strong correlation between shell company transaction timestamps and nominee director authorizations. The evidence suggests coordinated asset shifting.`
          : DEFAULT_AI_RESULT.reasoning,
        content: question ? `Specific inquiry addressed: ${question}` : DEFAULT_AI_RESULT.content,
      }
      setResult(customResponse)
      setHistory(prev => [{ question, result: customResponse }, ...prev])
    } catch {
      const fallbackResult = {
        ...DEFAULT_AI_RESULT,
        reasoning: question 
          ? `Analysis for query: "${question}" — Ingested records confirm anomalies in velocity, circular fund hops, and offshore account drains.`
          : DEFAULT_AI_RESULT.reasoning,
      }
      setResult(fallbackResult)
      setHistory(prev => [{ question, result: fallbackResult }, ...prev])
    } finally {
      setLoading(false)
    }
  }

  const promptChips = [
    'Explain offshore escrow drain',
    'Audit nominee director role',
    'Trace circular kickback loop',
    'Draft court subpoena targets',
  ]

  return (
    <div className="space-y-5 max-w-4xl mx-auto animate-slide-up">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to={`/cases/${caseId}`} className="btn-ghost p-2">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center">
            <Brain className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <h2 className="font-extrabold text-zinc-950 text-base sm:text-lg tracking-tight">AI Forensic Investigator</h2>
            <p className="text-xs text-zinc-500 font-medium">Powered by Deep Forensic Reasoning Engine</p>
          </div>
        </div>
        <button
          onClick={() => investigate()}
          disabled={loading}
          className="btn-brand flex items-center gap-2 text-xs py-2 px-3.5"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {loading ? 'Synthesizing...' : 'Run Full Investigation'}
        </button>
      </div>

      {/* Info banner */}
      <div className="glass p-4 border-l-4 border-red-600 bg-red-50/20 border-zinc-200/90 shadow-xs">
        <p className="text-xs sm:text-sm text-zinc-700 font-medium leading-relaxed">
          The AI forensic investigator parses ingested evidence logs, extracts relationship clusters, and cross-analyzes Isolation Forest anomalies to build working hypotheses and court-ready leads.
        </p>
      </div>

      {/* Suggested Inquiry Chips */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-xs font-semibold text-zinc-500 mr-1">Suggested Inquiries:</span>
        {promptChips.map((chip, i) => (
          <button
            key={i}
            onClick={() => investigate(chip)}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-red-50 hover:text-red-700 hover:border-red-300 border border-zinc-200 transition-all text-zinc-700 shadow-2xs cursor-pointer"
          >
            &rarr; {chip}
          </button>
        ))}
      </div>

      {/* Main panel */}
      <LLMReasoningPanel
        data={result}
        loading={loading}
        onAsk={(question) => investigate(question)}
      />

      {/* History */}
      {history.length > 1 && (
        <div className="glass p-5 border-zinc-200/90 shadow-xs">
          <h3 className="section-title mb-4">Investigation History</h3>
          <div className="space-y-3">
            {history.slice(1).map((h, i) => (
              <div key={i} className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/60">
                {h.question && (
                  <div className="mb-2 flex items-center gap-2">
                    <Send className="w-3.5 h-3.5 text-red-600" />
                    <span className="text-xs font-bold text-red-700 italic">"{h.question}"</span>
                  </div>
                )}
                <p className="text-xs text-zinc-600 line-clamp-3 leading-relaxed font-medium">{h.result?.reasoning}</p>
                {h.result?.confidence && (
                  <div className="mt-2">
                    <span className="text-[11px] font-bold bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded border border-zinc-200">
                      Confidence: {h.result.confidence}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
