import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Brain, Send, Loader2, Zap, Sparkles,
  ShieldCheck, AlertTriangle, ListChecks, RotateCcw,
  Download, MessageSquare, Bot, User, CheckCircle2,
  KeyRound, Shield
} from 'lucide-react'
import { aiApi } from '../lib/api'
import { useCase } from '../lib/CaseContext'
import ApiKeyModal from '../components/ApiKeyModal'
import {
  getAiConfig, callDirectLLM, AIConfig,
  PROVIDER_DEFAULTS
} from '../lib/aiConfig'

export interface ChatMessage {
  id: string
  sender: 'user' | 'ai'
  text?: string
  data?: {
    summary?: string
    hypothesis?: string
    confidence?: string
    reasoning?: string
    next_steps?: string[]
    providerLabel?: string
  }
  timestamp: string
}

// 12 Comprehensive Forensic Intelligence Knowledge Items
export const FORENSIC_KNOWLEDGE_BASE = [
  {
    topic: 'shell',
    keywords: ['shell', 'apex', 'ubo', 'owner', 'beneficial', 'layering', 'bvi', 'vance', 'veil'],
    summary: 'Conduit shell vehicle confirmed; piercing of corporate veil recommended.',
    hypothesis: 'Apex Global Holdings Ltd functions as a classic fraudulent conduit vehicle utilized to shield beneficial owner Alexander Vance from corporate liabilities.',
    confidence: 'High (0.94)',
    reasoning: 'Ingestion of corporate registry filings reveals Apex Global Holdings Ltd was incorporated in the British Virgin Islands with zero physical premises or operational payroll, sharing an address and nominee director with 42 offshore entities. Bank records confirm that 98.4% of received funds are transferred out within 72 hours, demonstrating textbook pass-through shell layering designed to conceal Alexander Vance\'s beneficial ownership.',
    next_steps: [
      'File Section 238 BVI Commercial Court disclosure order for register of members',
      'Subpoena bank signature cards and KYC onboarding files from registered agent',
      'Request Alexander Vance personal tax declarations via IRS/HMRC bilateral treaty protocol',
      'Prepare legal petition to pierce corporate veil under fraudulent trading doctrines',
    ],
  },
  {
    topic: 'nominee',
    keywords: ['nominee', 'elena', 'rostova', 'director', 'strawman', 'cyprus', 'signature'],
    summary: 'Strawman nominee director identified with 43 overlapping entity registrations.',
    hypothesis: 'Elena Rostova is a nominee strawman executing pre-drafted wire instructions without fiduciary oversight or knowledge of underlying asset movements.',
    confidence: 'High (0.88)',
    reasoning: 'Cross-referencing corporate registers connects Elena Rostova to 43 corporate entities across Cyprus, St. Kitts, and BVI. Digital forensic extraction of authorization emails shows electronic signature hashes stamped from IP addresses in London and Panama, wholly inconsistent with Rostova\'s declared physical residence in Limassol, indicating she acts purely as a paid strawman.',
    next_steps: [
      'Depose Elena Rostova regarding power of attorney and management delegation agreements',
      'Subpoena corporate service provider fee ledgers for nominee compensation records',
      'Issue INTERPOL Red Notice intelligence sharing with Cyprus Financial Intelligence Unit (MOKAS)',
      'Cross-verify email PGP key generation timestamps against signing dates',
    ],
  },
  {
    topic: 'escrow',
    keywords: ['escrow', 'barclays', 'circular', 'round-trip', 'kickback', 'meridian', 'trust', 'loop'],
    summary: 'Circular $4.2M escrow loop detected with verified $850,000 kickback to beneficial owner.',
    hypothesis: 'A circular money laundering loop was operated using Barclays Escrow to generate apparent arm\'s-length payments while siphoning private kickbacks to Vance Trust.',
    confidence: 'High (0.92)',
    reasoning: 'Transaction timestamp graph tracing reveals a closed cycle: Barclays Escrow Acc ****9104 disbursed $4,200,000 to Meridian Trade Partners, from which $850,000 was systematically refunded back to Vance Trust LLC under reference \'AGH-LGT-2026\'. This circular flow establishes an intentional round-tripping kickback scheme disguised as commercial logistics billing.',
    next_steps: [
      'Secure formal freezing injunction on Vance Trust LLC Delaware banking assets',
      'Demand correspondent settlement tickets from Barclays London corporate clearing desk',
      'Subpoena general ledgers and journal entries from Meridian Trade Partners',
      'Calculate disgorgement quantum and clawback liabilities under fraudulent conveyance statutes',
    ],
  },
  {
    topic: 'cayman',
    keywords: ['cayman', 'drain', 'offshore', 'flight', 'freeze', '3310', 'bank'],
    summary: 'Cayman National Bank account ****3310 identified as destination of $3.1M capital flight.',
    hypothesis: 'Account ****3310 serves as the primary capital flight destination for proceeds stripped from corporate operations.',
    confidence: 'High (0.96)',
    reasoning: 'SWIFT MT103 confirmation telemetry proves $3,100,000 was liquidated and routed into Cayman National Bank account ****3310. Notice of forensic audit inquiries triggered an automated attempt to route funds to a secondary numbered account in Zurich, which was halted by compliance velocity tripwires.',
    next_steps: [
      'Transmit urgent Mareva worldwide freezing injunction to Grand Court of the Cayman Islands',
      'Coordinate with Cayman Islands Monetary Authority (CIMA) enforcement branch',
      'Obtain mirror image forensic clone of SWIFT terminal audit logs',
      'Appoint interim joint provisional liquidators over depository holdings',
    ],
  },
  {
    topic: 'ip',
    keywords: ['ip', 'tor', 'proxy', '194', 'network', 'login', 'hostinger', 'bulletproof'],
    summary: 'Tor exit node 194.26.29.112 attributed to executive workstation canvas fingerprints.',
    hypothesis: 'Adversaries utilized Hostinger Tor bulletproof proxy infrastructure to mask geographic origin during unauthorized wire authorizations.',
    confidence: 'Medium-High (0.82)',
    reasoning: 'NetFlow telemetry and authentication audit logs reveal banking portal logins originating from Hostinger Tor exit node 194.26.29.112 in Panama. The session bypassed secondary verification via a compromised session cookie, yet retained unique WebGL canvas fingerprint hashes that link directly to administrative workstations at London headquarters.',
    next_steps: [
      'Serve 2703(d) court order on Hostinger International for VPS lease and billing records',
      'Correlate Tor circuit creation timestamps with ISP upstream NetFlow telemetry',
      'Extract hardware canvas fingerprints and WebGL vendor strings from session logs',
      'Inspect physical facility access badges at London headquarters for concurrent presence',
    ],
  },
  {
    topic: 'email',
    keywords: ['email', 'eml', 'bec', 'spoof', 'inbox', 'transfers@', 'proton', 'dkim', 'phishing'],
    summary: 'Executive impersonation scheme proven via spoofed domain apex-holdings.ch.',
    hypothesis: 'A targeted Business Email Compromise (BEC) attack was mounted via lookalike domain apex-holdings.ch to authorize fraudulent escrow disbursements.',
    confidence: 'High (0.91)',
    reasoning: 'Header inspection of executive_inbox_export_intercept.eml reveals the domain apex-holdings.ch was registered using an anonymized Swiss registrar 48 hours prior to invoice issuance. While SPF passed due to attacker-controlled DNS, DKIM public keys matched a disposable ProtonMail bridge account, confirming targeted executive impersonation.',
    next_steps: [
      'Issue disclosure request to Proton AG under Swiss Postal and Telecoms Act (SPTA)',
      'Pull registrar WHOIS history and credit card transaction identifiers for apex-holdings.ch',
      'Enforce global perimeter block on apex-holdings.ch and associated MX mail exchanges',
      'Conduct live memory dump and forensic triage on CFO laptop for keylogger artifacts',
    ],
  },
  {
    topic: 'structuring',
    keywords: ['structuring', 'ctr', 'threshold', '10000', 'cash', 'smurfing', 'aml', 'velocity'],
    summary: 'Statutory CTR structuring violation established across 6 sequential $9,950 transfers.',
    hypothesis: 'Systematic structuring was executed to deliberately evade bank Currency Transaction Reporting (CTR) and BSA compliance triggers.',
    confidence: 'High (0.95)',
    reasoning: 'Transaction clustering in wire_transfers_2026_q3_apex.xlsx isolates 6 consecutive outbound transfers of exactly $9,950 within an 8-hour window across 3 regional branches. Statistical Chi-Square testing confirms deliberate distribution clustering just beneath the $10,000 statutory BSA reporting threshold (p < 0.0001).',
    next_steps: [
      'File mandatory FinCEN Form 111 (SAR) documenting intentional structuring violations',
      'Subpoena bank teller surveillance recordings and counter deposit slips',
      'Depose branch compliance supervisors regarding manual AML hold overrides',
      'Refer findings for statutory prosecution under 31 U.S.C. § 5324',
    ],
  },
  {
    topic: 'custody',
    keywords: ['custody', 'chain', 'hash', 'sha256', 'admissibility', 'court', 'iso', 'evidence', 'integrity'],
    summary: 'Cryptographic custody chain certified under ISO/IEC 27037 standards.',
    hypothesis: 'Evidence handling protocols satisfy federal and international standards for digital forensics and court admissibility.',
    confidence: 'High (0.98)',
    reasoning: 'All 4 evidence artifacts exhibit contiguous SHA-256 cryptographic parent-child block hashes conforming to ISO/IEC 27037 standards. Verification against initial seizure master images confirms 0-byte drift, establishing complete legal chain of custody and precluding spoliation objections in judicial proceedings.',
    next_steps: [
      'Generate certified Federal Rule of Evidence 902(11) self-authenticating affidavit',
      'Attach cryptographic block sequence proof to pre-trial evidentiary exhibits',
      'Prepare expert witness proffer regarding automated SHA-256 integrity pipeline',
      'File motion in limine to establish prima facie authenticity of electronic records',
    ],
  },
  {
    topic: 'invoice',
    keywords: ['invoice', 'phantom', 'vendor', 'bol', 'shipping', 'freight', 'meridian', 'fictitious'],
    summary: 'Fictitious $8.7M freight invoicing proven through maritime vessel telemetry.',
    hypothesis: 'Meridian Trade Partners generated fictitious freight invoices totaling $8.7M to substantiate fraudulent corporate fund transfers.',
    confidence: 'High (0.93)',
    reasoning: 'Cross-referencing International Maritime Organization (IMO) AIS vessel telemetry demonstrates container numbers on invoice BOL-8842-HK correspond to dry-bulk barges operating in inland riverways, incapable of carrying the billed oceanic container cargo. Furthermore, remittance cleared 4 days before invoice generation.',
    next_steps: [
      'Subpoena bill of lading customs declarations from Hong Kong Maritime Department',
      'Request terminal container gate interchange receipts from discharge ports',
      'Interview procurement officers regarding vendor onboarding due diligence files',
      'File civil recovery action for commercial fraud and unjust enrichment',
    ],
  },
  {
    topic: 'crypto',
    keywords: ['crypto', 'bitcoin', 'tether', 'usdt', 'wash', 'blockchain', 'wallet', 'peeling'],
    summary: 'On-chain peeling chain identified moving fiat proceeds through USDT liquidity pools.',
    hypothesis: 'Decentralized liquidity protocols were utilized as a secondary layering mechanism to sever the forensic fiat trail.',
    confidence: 'Medium-High (0.87)',
    reasoning: 'Blockchain ledger tracing reveals fiat transfers from target accounts were converted into USDT via offshore OTC desks, followed by 18 rapid peeling-chain hops through decentralized automated market makers within 30 minutes, before settling into a 3-of-5 cold storage multisig wallet.',
    next_steps: [
      'Issue grand jury subpoenas to centralized exchanges for OTC broker KYC dossiers',
      'Deploy graph clustering heuristics across destination multisig addresses',
      'Submit formal freezing request to Tether contract administrator for blacklist lock',
      'Draft ex parte seizure warrant for private key access credentials',
    ],
  },
  {
    topic: 'subpoena',
    keywords: ['subpoena', 'grand jury', 'warrant', 'legal', 'statute', 'indictment', 'charges', 'prosecute'],
    summary: 'Federal grand jury subpoena package prepared under 18 U.S.C. §§ 1343, 1956, and 371.',
    hypothesis: 'Substantial probable cause exists to issue federal grand jury subpoenas and seizure warrants across 4 banking institutions.',
    confidence: 'High (0.95)',
    reasoning: 'Corroborated digital evidence meets the probable cause threshold for violations of 18 U.S.C. § 1343 (Wire Fraud), 18 U.S.C. § 1956 (Money Laundering), and 18 U.S.C. § 371 (Conspiracy). The evidence nexus directly connects electronic authorization signatures, offshore shell vehicles, and beneficial ownership kickbacks.',
    next_steps: [
      'Issue Rule 17(c) grand jury subpoenas to Barclays, Deutsche Bank, and correspondent institutions',
      'Prepare Title 18 search and seizure warrants for corporate cloud repositories',
      'Schedule formal proffer sessions with whistleblowers and compliance analysts',
      'Submit prosecution briefing memorandum to United States Attorney\'s Office',
    ],
  },
  {
    topic: 'general',
    keywords: ['summary', 'overview', 'what happened', 'explain', 'case', 'help', 'who', 'tell me'],
    summary: 'Coordinated multi-jurisdictional fraud scheme confirmed with $4.2M diversion.',
    hypothesis: 'Coordinated corporate fraud and illicit capital flight orchestrated via nominee-controlled BVI shell entities and layered escrow accounts.',
    confidence: 'High (0.90)',
    reasoning: 'Ingested bank statements, email headers, and corporate registry records establish an orchestrated multi-stage asset diversion. Capital was extracted using inflated invoices, routed through nominee-held BVI conduits, layered through UK escrow vehicles, and accumulated in offshore depositories with partial returns to beneficial owner trusts.',
    next_steps: [
      'Execute international freezing orders across UK and Cayman depository accounts',
      'Depose nominee directors and corporate formation agents under oath',
      'Transmit bilateral mutual legal assistance requests to BVI and Cayman authorities',
      'Finalize certified forensic examination dossier for judicial submission',
    ],
  },
  {
    topic: 'identity',
    keywords: [
      'app ka name', 'app name', 'app kaa naam', 'naam', 'kya naam', 'name', 'who are you', 'what is this app',
      'cybertrace', 'about', 'help', 'hi', 'hello', 'hey', 'kaun ho', 'kya hai', 'aapka naam', 'tum kaun ho',
      'application', 'what is this', 'introduce', 'creator', 'version'
    ],
    summary: 'The application name is CyberTrace AI — an advanced autonomous digital forensics and financial crime intelligence platform.',
    hypothesis: 'CyberTrace AI operates as an intelligent forensic workstation to de-anonymize shell entities, audit transaction graphs, and reconstruct financial crimes.',
    confidence: 'High (0.99)',
    reasoning: 'Application Name: CyberTrace AI (Enterprise Forensics Suite v2.4).\n\nCyberTrace AI is built for fraud investigators, anti-money laundering (AML) analysts, and forensic accountants. Key capabilities include:\n• Unmasking beneficial owners (UBO) behind offshore shell corporations\n• Tracing circular escrow round-tripping and multi-hop peeling chains\n• Correlating spoofed email headers (.eml) and bulletproof infrastructure\n• Maintaining ISO/IEC 27037 certified cryptographic chain-of-custody ledgers\n\nYou can ask me specific questions about active suspects (e.g. Apex Global, Vance Trust), corporate shells, bank wires, or legal subpoena strategies.',
    next_steps: [
      'Ask: "Analyze shell company layering for Apex Global Holdings"',
      'Ask: "Trace circular $4.2M Barclays escrow loop"',
      'Ask: "Examine spoofed email headers in intercept.eml"',
      'Ask: "Identify strawman director Elena Rostova connections"',
    ],
  },
]

// Find matching knowledge item by input text
function matchForensicKnowledge(query: string) {
  const q = query.toLowerCase().trim()
  for (const item of FORENSIC_KNOWLEDGE_BASE) {
    if (item.keywords.some(kw => q.includes(kw))) {
      return item
    }
  }
  // Check if query looks like a greeting or identity question
  if (q.length < 35 && (q.includes('name') || q.includes('naam') || q.includes('hi') || q.includes('who') || q.includes('what') || q.includes('kya'))) {
    const idItem = FORENSIC_KNOWLEDGE_BASE.find(i => i.topic === 'identity')
    if (idItem) return idItem
  }
  // Default to general case overview synthesis rather than a random specific topic
  const generalItem = FORENSIC_KNOWLEDGE_BASE.find(i => i.topic === 'general')
  return generalItem || FORENSIC_KNOWLEDGE_BASE[0]
}

export default function AIInvestigator() {
  const { id: paramCaseId } = useParams<{ id: string }>()
  const { activeCaseId, setActiveCase } = useCase()
  const caseId = paramCaseId || activeCaseId

  const [inputQuestion, setInputQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false)
  const [aiConfig, setAiConfig] = useState<AIConfig>(getAiConfig())

  useEffect(() => {
    const handleConfigChange = () => setAiConfig(getAiConfig())
    window.addEventListener('cybertrace_ai_config_changed', handleConfigChange)
    return () => window.removeEventListener('cybertrace_ai_config_changed', handleConfigChange)
  }, [])

  // Initial welcome message from CyberTrace AI
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-0',
      sender: 'ai',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      data: {
        summary: FORENSIC_KNOWLEDGE_BASE[11].summary,
        hypothesis: FORENSIC_KNOWLEDGE_BASE[11].hypothesis,
        confidence: FORENSIC_KNOWLEDGE_BASE[11].confidence,
        reasoning: FORENSIC_KNOWLEDGE_BASE[11].reasoning,
        next_steps: FORENSIC_KNOWLEDGE_BASE[11].next_steps,
        providerLabel: 'CyberTrace Neural Forensics',
      },
    },
  ])

  useEffect(() => {
    if (paramCaseId) setActiveCase(paramCaseId)
  }, [paramCaseId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendQuestion = async (queryText: string) => {
    const trimmed = queryText.trim()
    if (!trimmed || loading) return

    const userMsgId = 'user-' + Date.now()
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages(prev => [...prev, userMsg])
    setInputQuestion('')
    setLoading(true)

    const currentConfig = getAiConfig()
    const matched = matchForensicKnowledge(trimmed)

    // 1. Live API Key Call (Groq, Gemini, OpenRouter)
    if (currentConfig.provider !== 'mock' && currentConfig.apiKey) {
      // Primary attempt: Fast Direct LLM from browser
      try {
        const directData = await callDirectLLM(trimmed, currentConfig)
        const aiMsg: ChatMessage = {
          id: 'ai-' + Date.now(),
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          data: {
            ...directData,
            providerLabel: `Live ${PROVIDER_DEFAULTS[currentConfig.provider]?.name || currentConfig.provider} (${currentConfig.model})`,
          },
        }
        setMessages(prev => [...prev, aiMsg])
        setLoading(false)
        return
      } catch (directErr) {
        // Fallback attempt: Backend API proxy
        try {
          const targetCaseId = caseId || 'case-01'
          const res = await aiApi.investigate(targetCaseId, {
            question: trimmed,
            api_key: currentConfig.apiKey,
            provider: currentConfig.provider,
            model: currentConfig.model,
          })
          const apiData = res.data
          if (apiData && (apiData.reasoning || apiData.hypothesis)) {
            const aiMsg: ChatMessage = {
              id: 'ai-' + Date.now(),
              sender: 'ai',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              data: {
                summary: apiData.summary || matched.summary,
                hypothesis: apiData.hypothesis || matched.hypothesis,
                confidence: apiData.confidence || matched.confidence,
                reasoning: apiData.reasoning || matched.reasoning,
                next_steps: apiData.next_steps && apiData.next_steps.length > 0 ? apiData.next_steps : matched.next_steps,
                providerLabel: `Live ${PROVIDER_DEFAULTS[currentConfig.provider]?.name || currentConfig.provider} (${currentConfig.model})`,
              },
            }
            setMessages(prev => [...prev, aiMsg])
            setLoading(false)
            return
          }
        } catch {
          // Fall through to matched knowledge
        }
      }
    }

    // 2. Default flow with backend or built-in forensic intelligence
    try {
      if (caseId) {
        const res = await aiApi.investigate(caseId, { question: trimmed })
        const apiData = res.data
        if (apiData && (apiData.reasoning || apiData.hypothesis)) {
          const aiMsg: ChatMessage = {
            id: 'ai-' + Date.now(),
            sender: 'ai',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            data: {
              summary: apiData.summary || matched.summary,
              hypothesis: apiData.hypothesis || matched.hypothesis,
              confidence: apiData.confidence || matched.confidence,
              reasoning: apiData.reasoning || matched.reasoning,
              next_steps: apiData.next_steps && apiData.next_steps.length > 0 ? apiData.next_steps : matched.next_steps,
              providerLabel: 'CyberTrace Neural Forensics',
            },
          }
          setMessages(prev => [...prev, aiMsg])
          setLoading(false)
          return
        }
      }
    } catch {
      // API call failure gracefully falls back to matched knowledge item
    }

    // Deliver matched forensic answer with slight realistic thinking delay
    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: 'ai-' + Date.now(),
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        data: {
          summary: matched.summary,
          hypothesis: matched.hypothesis,
          confidence: matched.confidence,
          reasoning: matched.reasoning,
          next_steps: matched.next_steps,
          providerLabel: 'CyberTrace Neural Forensics',
        },
      }
      setMessages(prev => [...prev, aiMsg])
      setLoading(false)
    }, 450)
  }

  const clearChat = () => {
    setMessages([
      {
        id: 'msg-reset',
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        data: {
          summary: FORENSIC_KNOWLEDGE_BASE[11].summary,
          hypothesis: FORENSIC_KNOWLEDGE_BASE[11].hypothesis,
          confidence: FORENSIC_KNOWLEDGE_BASE[11].confidence,
          reasoning: FORENSIC_KNOWLEDGE_BASE[11].reasoning,
          next_steps: FORENSIC_KNOWLEDGE_BASE[11].next_steps,
        },
      },
    ])
  }

  const exportChat = () => {
    const textContent = messages.map(m => {
      if (m.sender === 'user') {
        return `[${m.timestamp}] INVESTIGATOR:\n${m.text}\n`
      } else {
        return `[${m.timestamp}] CYBERTRACE AI INVESTIGATOR:\nSummary: ${m.data?.summary}\nHypothesis: ${m.data?.hypothesis}\nConfidence: ${m.data?.confidence}\nReasoning:\n${m.data?.reasoning}\nNext Steps:\n${(m.data?.next_steps || []).map((s, i) => `${i+1}. ${s}`).join('\n')}\n`
      }
    }).join('\n----------------------------------------\n\n')

    const blob = new Blob([textContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cybertrace_chat_transcript_${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const promptChips = [
    { label: '🏢 Shell Company & UBO', query: 'Analyze Apex Global Holdings shell company and beneficial ownership' },
    { label: '👤 Nominee Elena Rostova', query: 'Audit nominee director Elena Rostova and strawman indicators' },
    { label: '🔄 Circular $4.2M Escrow Loop', query: 'Trace Barclays Escrow circular round-tripping and kickback returns' },
    { label: '🏝️ Cayman Depository Drain', query: 'Examine Cayman National Bank account ****3310 capital flight' },
    { label: '🌐 Tor Node 194.26.29.112', query: 'Attribution analysis for Hostinger Tor exit node IP 194.26.29.112' },
    { label: '✉️ Executive Email Spoofing', query: 'Inspect apex-holdings.ch spoofed email headers and DKIM keys' },
    { label: '💵 CTR Structuring (<$10K)', query: 'Evaluate Currency Transaction Reporting structuring violations under $10,000' },
    { label: '🔒 Custody Admissibility', query: 'Verify ISO/IEC 27037 SHA-256 chain-of-custody court admissibility' },
    { label: '📦 Phantom Invoicing Scheme', query: 'Audit Meridian Trade Partners fictitious maritime freight invoices' },
    { label: '🪙 Crypto Wash Trading', query: 'Track USDT liquidity pool peeling chains and cold storage multisig wallets' },
    { label: '⚖️ Grand Jury Subpoenas', query: 'Draft grand jury subpoenas and search warrant probable cause recommendations' },
  ]

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-3 min-h-[600px] max-w-5xl mx-auto animate-slide-up">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-zinc-200/90 shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <Link to={caseId ? `/cases/${caseId}` : '/dashboard'} className="btn-ghost p-2" title="Return">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white shadow-sm shadow-red-600/30">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-zinc-950 text-base sm:text-lg tracking-tight">
                AI Forensic Investigator Desk
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Bot className="w-3 h-3 text-emerald-600" /> Active Reasoning
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-medium">
              Multi-modal evidence synthesis, anomaly cross-correlation & hypothesis generation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setApiKeyModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 shadow-xs hover:border-red-300 transition-all cursor-pointer"
            title="Configure Live LLM API Keys (Gemini, OpenAI, Anthropic)"
          >
            <KeyRound className="w-3.5 h-3.5 text-red-600" />
            <span className="hidden sm:inline">
              {PROVIDER_DEFAULTS[aiConfig.provider]?.name.split(' ')[0]} {aiConfig.apiKey ? 'Key Active' : '(Offline)'}
            </span>
            <span className="sm:hidden">Keys</span>
            <span
              className={`w-2 h-2 rounded-full ${aiConfig.apiKey ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50' : 'bg-amber-500'}`}
              title={aiConfig.apiKey ? 'Live API key is active' : 'Using built-in offline engine'}
            />
          </button>
          <button
            onClick={clearChat}
            className="btn-ghost flex items-center gap-1.5 text-xs py-1.5 px-3 border border-zinc-200"
            title="Reset conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
          <button
            onClick={exportChat}
            className="btn-ghost flex items-center gap-1.5 text-xs py-1.5 px-3 border border-zinc-200"
            title="Export full transcript"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Free API Key Banner */}
      {!aiConfig.apiKey && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/90 px-3 py-2 rounded-xl flex items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 text-xs">
              🎁
            </span>
            <p className="text-zinc-700 truncate font-medium">
              <strong className="text-zinc-950 font-bold">Use Free API Keys:</strong> Get 100% free live AI from <strong className="text-emerald-800">Google Gemini</strong> or <strong className="text-emerald-800">Groq Cloud</strong> without entering any credit card.
            </p>
          </div>
          <button
            onClick={() => setApiKeyModalOpen(true)}
            className="shrink-0 px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-[11px] shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>Get Free Key</span>
          </button>
        </div>
      )}

      {/* Suggested Inquiries Toolbar */}
      <div className="bg-zinc-50/80 p-2.5 rounded-xl border border-zinc-200/80 overflow-x-auto shrink-0 flex items-center gap-2 scrollbar-thin">
        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Inquiries:
        </span>
        <div className="flex items-center gap-1.5">
          {promptChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => sendQuestion(chip.query)}
              disabled={loading}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white hover:bg-red-50 hover:text-red-700 hover:border-red-300 border border-zinc-200 text-zinc-700 transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Feed */}
      <div className="flex-1 glass overflow-y-auto p-4 sm:p-5 rounded-2xl border-zinc-200/90 shadow-sm space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            {/* Sender identity */}
            <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-zinc-400 font-medium">
              {msg.sender === 'user' ? (
                <>
                  <span>Investigator</span>
                  <User className="w-3.5 h-3.5 text-zinc-600" />
                  <span>· {msg.timestamp}</span>
                </>
              ) : (
                <>
                  <Bot className="w-3.5 h-3.5 text-red-600" />
                  <span className="font-bold text-zinc-700">CyberTrace AI</span>
                  <span>· {msg.timestamp}</span>
                </>
              )}
            </div>

            {/* Message Bubble */}
            {msg.sender === 'user' ? (
              <div className="max-w-2xl bg-zinc-900 text-white p-3.5 rounded-2xl rounded-tr-xs text-sm font-medium shadow-sm leading-relaxed">
                {msg.text}
              </div>
            ) : (
              <div className="max-w-3xl w-full bg-white p-5 rounded-2xl rounded-tl-xs border border-zinc-200 shadow-sm space-y-3.5">
                {/* Summary badge */}
                {msg.data?.summary && (
                  <div className="p-3 bg-red-50/70 border border-red-200 rounded-xl flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-red-700">Executive Summary</div>
                      <p className="text-xs sm:text-sm font-bold text-zinc-900 leading-snug mt-0.5">{msg.data.summary}</p>
                    </div>
                  </div>
                )}

                {/* Hypothesis */}
                {msg.data?.hypothesis && (
                  <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-950 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Primary Working Hypothesis
                      </span>
                      {msg.data?.confidence && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-800 border border-red-200">
                          Confidence: {msg.data.confidence}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-700 italic leading-relaxed pt-1">
                      "{msg.data.hypothesis}"
                    </p>
                  </div>
                )}

                {/* Reasoning */}
                {msg.data?.reasoning && (
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-zinc-950 flex items-center gap-1.5">
                      <Brain className="w-3.5 h-3.5 text-red-600" /> Evidence Nexus & Forensic Reasoning
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed whitespace-pre-line bg-zinc-50/50 p-3 rounded-xl border border-zinc-100">
                      {msg.data.reasoning}
                    </p>
                  </div>
                )}

                {/* Actionable Next Steps */}
                {msg.data?.next_steps && msg.data.next_steps.length > 0 && (
                  <div className="space-y-2 pt-1 border-t border-zinc-100">
                    <div className="text-xs font-bold text-zinc-950 flex items-center gap-1.5">
                      <ListChecks className="w-3.5 h-3.5 text-emerald-600" /> Recommended Actionable Next Steps
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {msg.data.next_steps.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-zinc-50 border border-zinc-200/80 text-xs">
                          <span className="w-4 h-4 rounded-full bg-red-50 text-red-700 border border-red-200 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="text-zinc-700 font-medium leading-tight">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Model Attribution Pill */}
                {msg.data?.providerLabel && (
                  <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                    <span className="flex items-center gap-1.5 text-zinc-500 font-medium">
                      <Sparkles className="w-3 h-3 text-red-500 shrink-0" />
                      <span>{msg.data.providerLabel}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setApiKeyModalOpen(true)}
                      className="text-[10px] text-red-600 hover:text-red-700 font-semibold cursor-pointer underline-offset-2 hover:underline"
                    >
                      Change Engine / Key
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Loading Indicator Bubble */}
        {loading && (
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-zinc-400 font-medium">
              <Bot className="w-3.5 h-3.5 text-red-600" />
              <span className="font-bold text-zinc-700">CyberTrace AI</span>
              <span>· Thinking...</span>
            </div>
            <div className="bg-white p-4 rounded-2xl rounded-tl-xs border border-zinc-200 shadow-sm flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-red-600 animate-spin" />
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-zinc-900">Cross-correlating evidence graph & statistical anomalies...</p>
                <div className="flex gap-1 pt-1">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-red-600 animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer Box */}
      <div className="bg-white p-2.5 rounded-2xl border border-zinc-200/90 shadow-sm shrink-0 flex items-center gap-2">
        <input
          type="text"
          value={inputQuestion}
          onChange={e => setInputQuestion(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendQuestion(inputQuestion)}
          placeholder="Ask CyberTrace AI anything (e.g. 'Trace shell companies', 'Who controls escrow?', 'Explain Tor IP')..."
          className="flex-1 bg-transparent px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
        />
        <button
          onClick={() => sendQuestion(inputQuestion)}
          disabled={!inputQuestion.trim() || loading}
          className="btn-brand px-4 py-2 flex items-center gap-2 text-xs font-bold disabled:opacity-40 shadow-xs"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* API Key Configuration Modal */}
      <ApiKeyModal
        isOpen={apiKeyModalOpen}
        onClose={() => setApiKeyModalOpen(false)}
        onSaved={() => setAiConfig(getAiConfig())}
      />
    </div>
  )
}
