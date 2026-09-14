import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Shield, Network, BarChart3, Brain, FileText, Upload,
  CheckCircle2, ArrowRight, Lock, Database, Search,
  AlertTriangle, Cpu, Terminal, ExternalLink, Menu, X,
  ChevronRight, Sparkles, Activity, Layers, FileCheck,
  Send, Mail, Phone, MapPin, Building2, ShieldCheck,
  HelpCircle, RefreshCw, Eye
} from 'lucide-react'

// Cryptographic hash simulation helper using Web Crypto API
async function sha256Hex(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export default function LandingPage() {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [contactSubmitted, setContactSubmitted] = useState(false)

  // Interactive Live Hasher state
  const [demoInput, setDemoInput] = useState('Wire_Transfer_Invoice_9821_ShellCorp.pdf')
  const [demoHash, setDemoHash] = useState('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
  const [isHashing, setIsHashing] = useState(false)
  const [activeCaseTab, setActiveCaseTab] = useState<'laundering' | 'embezzlement' | 'kickback'>('laundering')

  // Real-time hash update when demo input changes
  useEffect(() => {
    let cancelled = false
    setIsHashing(true)
    const timeout = setTimeout(async () => {
      try {
        const hash = await sha256Hex(demoInput || 'empty')
        if (!cancelled) {
          setDemoHash(hash)
          setIsHashing(false)
        }
      } catch {
        if (!cancelled) setIsHashing(false)
      }
    }, 150)
    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [demoInput])

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setContactSubmitted(true)
    setTimeout(() => {
      setContactSubmitted(false)
      setContactModalOpen(false)
    }, 2200)
  }

  return (
    <div id="home" className="min-w-[320px] bg-zinc-50 text-zinc-900 selection:bg-red-500 selection:text-white antialiased">
      {/* ── 1. NAVBAR ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-zinc-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-md shadow-red-600/30 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-zinc-950 text-xl tracking-tight">Cyber<span className="text-red-600">Trace</span></span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">v2.4</span>
              </div>
              <p className="text-[10px] text-zinc-500 font-medium tracking-wide uppercase">Forensic Intelligence</p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-zinc-600">
            <button onClick={() => scrollToSection('home')} className="hover:text-red-600 transition-colors cursor-pointer">
              Home
            </button>
            <button onClick={() => scrollToSection('about')} className="hover:text-red-600 transition-colors cursor-pointer">
              About
            </button>
            <button onClick={() => scrollToSection('features')} className="hover:text-red-600 transition-colors cursor-pointer">
              Features
            </button>
            <button onClick={() => scrollToSection('how-it-works')} className="hover:text-red-600 transition-colors cursor-pointer">
              How It Works
            </button>
            <button onClick={() => scrollToSection('cases')} className="hover:text-red-600 transition-colors cursor-pointer">
              Solutions & Cases
            </button>
            <button onClick={() => setContactModalOpen(true)} className="hover:text-red-600 transition-colors cursor-pointer">
              Contact
            </button>
          </nav>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/dashboard"
              className="px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 rounded-lg transition-all"
            >
              Sign In / Live App
            </Link>
            <Link
              to="/cases/new"
              className="btn-brand flex items-center gap-2 text-xs py-2 px-4 shadow-sm"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-zinc-700 hover:bg-zinc-100 transition-colors focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/98 backdrop-blur-2xl border-b border-zinc-200 px-5 pt-4 pb-6 space-y-4 animate-fade-in shadow-xl">
            <nav className="flex flex-col space-y-3 text-base font-semibold text-zinc-700">
              <button
                onClick={() => scrollToSection('home')}
                className="text-left py-2 px-3 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="text-left py-2 px-3 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors"
              >
                About & Purpose
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="text-left py-2 px-3 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors"
              >
                Features & Capabilities
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="text-left py-2 px-3 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection('cases')}
                className="text-left py-2 px-3 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors"
              >
                Forensic Case Scenarios
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  setContactModalOpen(true)
                }}
                className="text-left py-2 px-3 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors"
              >
                Contact & Inquiries
              </button>
            </nav>

            <div className="pt-3 border-t border-zinc-200 flex flex-col gap-2.5">
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-lg border border-zinc-300 font-semibold text-sm text-zinc-800 hover:bg-zinc-100"
              >
                Enter Investigation Dashboard
              </Link>
              <Link
                to="/cases/new"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center btn-brand py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
              >
                <span>Launch New Case</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── 2. HERO SECTION ──────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-zinc-200/80 bg-gradient-to-b from-white via-zinc-50/70 to-zinc-100/50">
        {/* Background Decorative Mesh / Dots */}
        <div className="absolute inset-0 bg-grid-pattern opacity-60 pointer-events-none" />
        <div className="absolute -top-40 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-72 h-72 bg-zinc-900/5 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-red-200 shadow-xs text-xs font-semibold text-red-700">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                <span>ISO/IEC 27037 Digital Forensics Standards Ready</span>
                <span className="text-zinc-300">|</span>
                <span className="text-zinc-600 font-normal">Neo4j + Isolation Forest + LLM</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-950 tracking-tight leading-[1.15]">
                AI-Powered Forensic Intelligence &{' '}
                <span className="bg-gradient-to-r from-red-600 via-red-700 to-zinc-900 bg-clip-text text-transparent">
                  Cryptographic Fraud Detection
                </span>
              </h1>

              {/* Description */}
              <p className="text-base sm:text-lg text-zinc-600 font-normal leading-relaxed max-w-2xl">
                CyberTrace enables fraud examiners, compliance teams, and forensic accountants to ingest multi-source records,
                trace multi-hop entity graphs in Neo4j, detect statistical anomalies with Isolation Forest, and generate
                court-admissible audit reports with immutable SHA-256 chain-of-custody.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
                <Link
                  to="/cases/new"
                  className="btn-brand flex items-center justify-center gap-2 px-6 py-3.5 text-sm sm:text-base shadow-lg shadow-red-600/25 font-bold"
                >
                  <Shield className="w-4 h-4" />
                  <span>Start New Investigation</span>
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                </Link>

                <Link
                  to="/dashboard"
                  className="btn-ghost flex items-center justify-center gap-2 px-5 py-3.5 text-sm sm:text-base font-semibold bg-white shadow-xs hover:border-zinc-300"
                >
                  <Activity className="w-4 h-4 text-red-600" />
                  <span>Launch Dashboard</span>
                </Link>

                <button
                  onClick={() => scrollToSection('features')}
                  className="text-xs sm:text-sm font-semibold text-zinc-600 hover:text-zinc-950 flex items-center gap-1.5 px-3 py-2 transition-colors cursor-pointer"
                >
                  <span>Explore Features</span>
                  <ChevronRight className="w-4 h-4 text-zinc-400" />
                </button>
              </div>

              {/* Key Trust Signals */}
              <div className="pt-4 grid grid-cols-3 gap-4 border-t border-zinc-200/90 text-left">
                <div>
                  <div className="text-xl sm:text-2xl font-black text-zinc-950">100%</div>
                  <div className="text-[11px] sm:text-xs text-zinc-500 font-medium">Tamper-Evident Custody</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-zinc-950">&lt; 3s</div>
                  <div className="text-[11px] sm:text-xs text-zinc-500 font-medium">Deep Graph Traversal</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-red-600">Court-Ready</div>
                  <div className="text-[11px] sm:text-xs text-zinc-500 font-medium">ReportLab PDF Dossiers</div>
                </div>
              </div>
            </div>

            {/* Hero Right: Interactive Forensic Visual / Command Card */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl p-1 bg-gradient-to-br from-zinc-200 via-zinc-100 to-red-600/30 shadow-2xl shadow-zinc-950/10">
                <div className="rounded-[14px] bg-white border border-zinc-200 overflow-hidden">
                  
                  {/* Window Header */}
                  <div className="bg-zinc-900 px-4 py-3 flex items-center justify-between text-zinc-300 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                      </div>
                      <span className="text-zinc-400 ml-2 font-sans font-medium text-[11px]">Forensic Console — LIVE AUDIT</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 text-[10px] font-bold border border-red-800/80 uppercase">
                      SECURE ENCLAVE
                    </span>
                  </div>

                  {/* Visual Body */}
                  <div className="p-4 sm:p-5 space-y-4 text-xs font-sans">
                    
                    {/* Live Evidence Fingerprint */}
                    <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-700">
                        <div className="flex items-center gap-1.5 text-zinc-900">
                          <FileCheck className="w-4 h-4 text-red-600" />
                          <span>Active Evidence Ingestion: ledger_q3_wire.csv</span>
                        </div>
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> VERIFIED
                        </span>
                      </div>
                      <div className="font-mono text-[10px] text-zinc-600 bg-white p-2 rounded border border-zinc-200 break-all leading-tight">
                        <span className="text-red-700 font-bold">SHA-256:</span> b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-zinc-500">
                        <span>Block #10492 • Custody Linked</span>
                        <span>Parser: RFC-4180 CSV Validator</span>
                      </div>
                    </div>

                    {/* Anomaly Gauge & Risk Meter */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white border border-red-200 rounded-xl p-3 shadow-xs">
                        <div className="text-[10px] uppercase font-bold text-red-700 tracking-wider flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600" /> Anomaly Score
                        </div>
                        <div className="text-2xl font-black text-red-600 mt-1">0.94 <span className="text-xs font-normal text-zinc-500">/ 1.0</span></div>
                        <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden mt-1.5">
                          <div className="bg-gradient-to-r from-amber-500 to-red-600 h-full w-[94%]" />
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-1 font-medium">Isolation Forest Outlier</div>
                      </div>

                      <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-xs">
                        <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1">
                          <Network className="w-3.5 h-3.5 text-red-600" /> Graph Subgraph
                        </div>
                        <div className="text-2xl font-black text-zinc-950 mt-1">3 <span className="text-xs font-normal text-zinc-500">hops</span></div>
                        <div className="text-[10px] text-zinc-500 mt-2 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                          <span>Circular Loop Detected</span>
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono mt-0.5">AlphaCorp ➔ OffshoreTrust</div>
                      </div>
                    </div>

                    {/* AI Investigator Reasoning Excerpt */}
                    <div className="bg-zinc-900 text-zinc-200 rounded-xl p-3 space-y-1.5 border border-zinc-800">
                      <div className="flex items-center justify-between text-[11px] text-zinc-400">
                        <span className="flex items-center gap-1.5 text-red-400 font-semibold font-mono">
                          <Brain className="w-3.5 h-3.5" /> LLM Forensic Reasoning
                        </span>
                        <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">GPT-4o / Claude</span>
                      </div>
                      <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">
                        "Flagged $840,000 disbursement split into 9 sub-$100k wires across 4 intermediary LLCs within 48 hours. Pattern indicates structured smurfing to evade AML CTR thresholds."
                      </p>
                    </div>

                    {/* Fast Jump CTAs */}
                    <div className="pt-1 flex items-center justify-between">
                      <span className="text-[11px] text-zinc-500 font-medium">Ready to explore?</span>
                      <Link
                        to="/cases"
                        className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 group"
                      >
                        <span>View Sample Investigations</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>

                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 3. PROBLEM / PURPOSE SECTION ─────────────────────────── */}
      <section id="about" className="py-16 md:py-24 bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold uppercase tracking-wider border border-red-200">
              The Forensic Dilemma
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-zinc-950 tracking-tight">
              Why Traditional Fraud Investigations Take Weeks & Fail in Court
            </h2>
            <p className="text-zinc-600 text-sm sm:text-base leading-relaxed">
              Financial crimes have evolved into distributed, multi-entity shell structures and automated transaction splits.
              Manual audits in spreadsheets cannot keep up.
            </p>
          </div>

          {/* 4 Problem vs Solution Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1 */}
            <div className="glass p-6 rounded-2xl border border-zinc-200/90 hover:border-red-500/40 hover:shadow-lg transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 font-bold">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-950">Fragmented Data Silos</h3>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                Bank statements, ERP exports, and emails live in isolation. Manual reconciliation leads to overlooked linkages and blind spots.
              </p>
              <div className="pt-2 border-t border-zinc-100 text-xs font-semibold text-red-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-red-600 shrink-0" />
                <span>CyberTrace unifies Excel, CSV, & EML</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="glass p-6 rounded-2xl border border-zinc-200/90 hover:border-red-500/40 hover:shadow-lg transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold">
                <Network className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-950">Hidden Shell Networks</h3>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                Layered shell companies obscure beneficial ownership and circular fund flows that flat row-based spreadsheets cannot reveal.
              </p>
              <div className="pt-2 border-t border-zinc-100 text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Neo4j multi-hop relationship graph</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="glass p-6 rounded-2xl border border-zinc-200/90 hover:border-red-500/40 hover:shadow-lg transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 font-bold">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-950">Custody Inadmissibility</h3>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                Loose files without cryptographic verification are vulnerable to claims of evidence tampering, throwing legal proceedings out of court.
              </p>
              <div className="pt-2 border-t border-zinc-100 text-xs font-semibold text-red-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-red-600 shrink-0" />
                <span>SHA-256 linked immutable chain</span>
              </div>
            </div>

            {/* Card 4 */}
            <div className="glass p-6 rounded-2xl border border-zinc-200/90 hover:border-red-500/40 hover:shadow-lg transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-zinc-100 border border-zinc-300 flex items-center justify-center text-zinc-800 font-bold">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-950">Slow Manual Reporting</h3>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                Forensic accountants spend up to 70% of case hours drafting exhibits, extracting tables, and compiling exhibits rather than analyzing findings.
              </p>
              <div className="pt-2 border-t border-zinc-100 text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>1-click ReportLab PDF dossier generation</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── 4. FEATURES SECTION ───────────────────────────────────── */}
      <section id="features" className="py-16 md:py-24 bg-zinc-50 border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 text-white text-xs font-bold uppercase tracking-wider">
              Core Capabilities
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-zinc-950 tracking-tight">
              Enterprise Forensic Arsenal Built for Rigorous Scrutiny
            </h2>
            <p className="text-zinc-600 text-sm sm:text-base leading-relaxed">
              Engineered with specialized components across data ingestion, graph mining, unsupervised machine learning, and cryptographic custody verification.
            </p>
          </div>

          {/* 6 Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-7 border border-zinc-200/90 shadow-xs hover:shadow-xl hover:border-red-500/50 transition-all duration-300 group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-red-600 group-hover:text-white transition-all shadow-sm">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-[11px] font-bold text-red-700 uppercase tracking-wider mb-1">Ingestion Engine</div>
                <h3 className="text-xl font-extrabold text-zinc-950 mb-2">Multi-Source Ingestion & Hashing</h3>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  Automatic parsing for Excel spreadsheets, CSV banking exports, and RFC-822 email (.eml) archives with immediate SHA-256 fingerprinting on upload.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs font-semibold text-zinc-500">
                <span>Supports .csv, .xlsx, .eml</span>
                <Link to="/evidence/upload" className="text-red-600 hover:text-red-700 flex items-center gap-1">
                  Try Upload <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-7 border border-zinc-200/90 shadow-xs hover:shadow-xl hover:border-red-500/50 transition-all duration-300 group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-red-600 group-hover:text-white transition-all shadow-sm">
                  <Network className="w-6 h-6" />
                </div>
                <div className="text-[11px] font-bold text-red-700 uppercase tracking-wider mb-1">Graph Topology</div>
                <h3 className="text-xl font-extrabold text-zinc-950 mb-2">Neo4j Entity Relationship Graph</h3>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  Deep entity link analysis that reveals circular transaction routing, hidden intermediary accounts, and shadow directors through interactive React Flow exploration.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs font-semibold text-zinc-500">
                <span>Multi-hop traversal</span>
                <Link to="/graph" className="text-red-600 hover:text-red-700 flex items-center gap-1">
                  View Graph <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-7 border border-zinc-200/90 shadow-xs hover:shadow-xl hover:border-red-500/50 transition-all duration-300 group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-red-600 group-hover:text-white transition-all shadow-sm">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div className="text-[11px] font-bold text-red-700 uppercase tracking-wider mb-1">Unsupervised ML</div>
                <h3 className="text-xl font-extrabold text-zinc-950 mb-2">Isolation Forest Anomaly Detection</h3>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  Scikit-learn powered anomaly scoring that flags statistical outliers in transaction velocity, structuring below CTR limits, and unusual balance depletion.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs font-semibold text-zinc-500">
                <span>Automated risk scoring</span>
                <Link to="/analytics" className="text-red-600 hover:text-red-700 flex items-center gap-1">
                  Open Analytics <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-2xl p-7 border border-zinc-200/90 shadow-xs hover:shadow-xl hover:border-red-500/50 transition-all duration-300 group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-red-600 group-hover:text-white transition-all shadow-sm">
                  <Brain className="w-6 h-6" />
                </div>
                <div className="text-[11px] font-bold text-red-700 uppercase tracking-wider mb-1">AI Reasoning</div>
                <h3 className="text-xl font-extrabold text-zinc-950 mb-2">Pluggable LLM Investigator</h3>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  Natural language investigative reasoning powered by swappable models (OpenAI GPT-4o, Anthropic Claude, or local air-gapped Ollama) for hypothesis formulation.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs font-semibold text-zinc-500">
                <span>Air-gap or cloud ready</span>
                <Link to="/ai" className="text-red-600 hover:text-red-700 flex items-center gap-1">
                  AI Workspace <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="bg-white rounded-2xl p-7 border border-zinc-200/90 shadow-xs hover:shadow-xl hover:border-red-500/50 transition-all duration-300 group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-red-600 group-hover:text-white transition-all shadow-sm">
                  <Lock className="w-6 h-6" />
                </div>
                <div className="text-[11px] font-bold text-red-700 uppercase tracking-wider mb-1">Cryptographic Ledger</div>
                <h3 className="text-xl font-extrabold text-zinc-950 mb-2">Immutable Chain of Custody</h3>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  Every evidence touchpoint, parsing step, entity extraction, and analyst review is chained using cryptographic parent hashing in PostgreSQL.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs font-semibold text-zinc-500">
                <span>Tamper-evident verification</span>
                <span className="text-emerald-600 font-mono text-[11px]">SHA-256 CHK</span>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="bg-white rounded-2xl p-7 border border-zinc-200/90 shadow-xs hover:shadow-xl hover:border-red-500/50 transition-all duration-300 group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-red-600 group-hover:text-white transition-all shadow-sm">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="text-[11px] font-bold text-red-700 uppercase tracking-wider mb-1">Export Engine</div>
                <h3 className="text-xl font-extrabold text-zinc-950 mb-2">Court-Admissible PDF Reports</h3>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  ReportLab-driven generation of executive summaries, risk breakdowns, entity lists, and evidence tables formatted with verifiable audit hashes.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs font-semibold text-zinc-500">
                <span>PDF & JSON manifests</span>
                <Link to="/reports" className="text-red-600 hover:text-red-700 flex items-center gap-1">
                  Reports Desk <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── 5. HOW IT WORKS SECTION ──────────────────────────────── */}
      <section id="how-it-works" className="py-16 md:py-24 bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold uppercase tracking-wider border border-red-200">
              Operational Workflow
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-zinc-950 tracking-tight">
              From Raw Ledgers to Court Exhibit in 4 Steps
            </h2>
            <p className="text-zinc-600 text-sm sm:text-base leading-relaxed">
              Standardized forensic protocol ensuring complete reproducibility and legal admissibility at every stage.
            </p>
          </div>

          {/* 4 Sequential Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            
            {/* Connecting line on desktop */}
            <div className="hidden lg:block absolute top-1/4 left-16 right-16 h-0.5 bg-gradient-to-r from-red-600/30 via-red-600/60 to-red-600/30 -z-0" />

            {/* Step 1 */}
            <div className="relative z-10 bg-white p-6 rounded-2xl border border-zinc-200 text-center space-y-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 text-white flex items-center justify-center mx-auto text-xl font-black shadow-md shadow-zinc-950/20">
                01
              </div>
              <h3 className="text-lg font-bold text-zinc-950">Initialize Case Container</h3>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                Create a cryptographically segregated workspace. Define investigation scope, assign jurisdiction, and set custody parameters.
              </p>
              <div className="inline-block font-mono text-[11px] text-zinc-500 bg-zinc-50 px-2 py-1 rounded border border-zinc-200">
                Case #FRNS-2026-001
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 bg-white p-6 rounded-2xl border border-zinc-200 text-center space-y-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center mx-auto text-xl font-black shadow-md shadow-red-600/30">
                02
              </div>
              <h3 className="text-lg font-bold text-zinc-950">Ingest & Hash Evidence</h3>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                Upload transaction sheets or emails. CyberTrace instantly stamps each artifact with a SHA-256 digest and creates the first custody block.
              </p>
              <div className="inline-block font-mono text-[11px] text-red-700 bg-red-50 px-2 py-1 rounded border border-red-200">
                SHA-256 Checksum Verified
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 bg-white p-6 rounded-2xl border border-zinc-200 text-center space-y-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 text-white flex items-center justify-center mx-auto text-xl font-black shadow-md shadow-zinc-950/20">
                03
              </div>
              <h3 className="text-lg font-bold text-zinc-950">Graph Mining & ML Scoring</h3>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                Automated algorithms map entities into Neo4j graph nodes while Isolation Forest identifies high-risk anomalous transfers and shell loops.
              </p>
              <div className="inline-block font-mono text-[11px] text-zinc-500 bg-zinc-50 px-2 py-1 rounded border border-zinc-200">
                Neo4j Graph Built & Scored
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative z-10 bg-white p-6 rounded-2xl border border-zinc-200 text-center space-y-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center mx-auto text-xl font-black shadow-md shadow-red-600/30">
                04
              </div>
              <h3 className="text-lg font-bold text-zinc-950">AI Synthesis & Report</h3>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                Consult the AI Investigator for fraud hypothesis validation and export a certified, court-admissible PDF dossier with complete audit logs.
              </p>
              <div className="inline-block font-mono text-[11px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                Court-Ready PDF Dossier
              </div>
            </div>

          </div>

          {/* Process Callout */}
          <div className="mt-14 max-w-2xl mx-auto bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-xs text-zinc-700 font-medium">
                Want to test the ingestion pipeline with a mock fraud scenario?
              </p>
            </div>
            <Link
              to="/cases/new"
              className="text-xs font-bold text-red-600 hover:text-red-700 shrink-0 flex items-center gap-1"
            >
              <span>Create Test Case</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      </section>

      {/* ── 6. INTERACTIVE LIVE HASHER DEMO & WHY CHOOSE US ───────── */}
      <section className="py-16 md:py-24 bg-zinc-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left: Why Choose Us (5 Reasons) */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 text-red-400 text-xs font-bold uppercase tracking-wider border border-red-800/80">
                Why Choose CyberTrace
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                Architected for Proof, Not Just Probabilities
              </h2>
              <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                When legal admissibility is on the line, generic business intelligence tools crumble. CyberTrace is purpose-built for forensic evidentiary rigor.
              </p>

              <div className="space-y-4 pt-2">
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0 mt-0.5">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100">Tamper-Evident Linked Hashes</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Every audit event stores parent hash, current hash, and UTC timestamp, mirroring blockchain integrity without the overhead.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0 mt-0.5">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100">Sub-Second Multi-Hop Graph Traversal</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Traverse 10+ degrees of separation across 100,000+ entities to expose circular round-tripping and funnel accounts.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0 mt-0.5">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100">Sovereign & Air-Gapped AI Readiness</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Run entirely offline with local Ollama models on secure internal infrastructure, ensuring zero sensitive financial data leaks to cloud APIs.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100">ISO/IEC 27037 Forensic Compliance Alignment</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Structured directly against international guidelines for identification, collection, acquisition, and preservation of digital evidence.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0 mt-0.5">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100">78% Lower False Positive Rate</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Combines Isolation Forest statistical density modeling with semantic entity matching to eliminate manual alert fatigue.
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Right: Live Interactive Cryptographic Hash & Custody Playground */}
            <div className="lg:col-span-6">
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-red-500" />
                    <span className="font-mono text-xs font-bold text-zinc-200">INTERACTIVE SHA-256 HASHER</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                    REALTIME WEB CRYPTO API
                  </span>
                </div>

                <p className="text-xs text-zinc-400">
                  Type any filename, transaction record, or evidence metadata below to observe instantaneous cryptographic digest generation:
                </p>

                {/* Input form */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                    Evidence File / Transaction Payload:
                  </label>
                  <input
                    type="text"
                    value={demoInput}
                    onChange={(e) => setDemoInput(e.target.value)}
                    placeholder="Enter evidence filename or transaction ID..."
                    className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3.5 py-2.5 text-xs font-mono focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all"
                  />
                </div>

                {/* Live Output */}
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400 font-mono">Calculated SHA-256 Digest:</span>
                    <span className="text-[10px] text-zinc-500">256-bit Hex</span>
                  </div>
                  <div className="font-mono text-xs text-red-400 bg-black/60 p-3 rounded-lg border border-red-950/60 break-all select-all flex items-center justify-between gap-2">
                    <span>{demoHash}</span>
                    {isHashing && <RefreshCw className="w-3.5 h-3.5 text-red-500 animate-spin shrink-0" />}
                  </div>

                  {/* Simulated Custody Block */}
                  <div className="pt-2 border-t border-zinc-800/80 space-y-1.5 text-[10px] font-mono text-zinc-400">
                    <div className="flex justify-between">
                      <span>CUSTODY_BLOCK_SEQ:</span>
                      <span className="text-zinc-300">#4819-A</span>
                    </div>
                    <div className="flex justify-between">
                      <span>TIMESTAMP_UTC:</span>
                      <span className="text-zinc-300">{new Date().toISOString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>INTEGRITY_STATUS:</span>
                      <span className="text-emerald-400 font-bold">CRYPTOGRAPHICALLY SOUND ✓</span>
                    </div>
                  </div>
                </div>

                {/* Sample Preset Buttons */}
                <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="text-zinc-500 text-xs">Presets:</span>
                  <button
                    onClick={() => setDemoInput('Bank_Statement_May2026_WireRecords.csv')}
                    className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
                  >
                    CSV Statement
                  </button>
                  <button
                    onClick={() => setDemoInput('CEO_Confidential_Acquisition_Kickback.eml')}
                    className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
                  >
                    Email Archive
                  </button>
                  <button
                    onClick={() => setDemoInput('Vendor_Invoices_Cayman_Holding_LLC.xlsx')}
                    className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
                  >
                    Excel Invoices
                  </button>
                </div>

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── 7. SOLUTIONS / CASES SECTION ─────────────────────────── */}
      <section id="cases" className="py-16 md:py-24 bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold uppercase tracking-wider border border-red-200">
              Investigation Scenarios
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-zinc-950 tracking-tight">
              Tackling Complex Financial Crime Typologies
            </h2>
            <p className="text-zinc-600 text-sm sm:text-base leading-relaxed">
              Explore how CyberTrace rapidly untangles convoluted fraud mechanics across high-stakes corporate and regulatory environments.
            </p>
          </div>

          {/* Scenario Tabs */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex p-1 bg-zinc-100 rounded-xl border border-zinc-200">
              <button
                onClick={() => setActiveCaseTab('laundering')}
                className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                  activeCaseTab === 'laundering'
                    ? 'bg-white text-zinc-950 shadow-sm border border-zinc-200'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Shell Company Laundering
              </button>
              <button
                onClick={() => setActiveCaseTab('embezzlement')}
                className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                  activeCaseTab === 'embezzlement'
                    ? 'bg-white text-zinc-950 shadow-sm border border-zinc-200'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Corporate Embezzlement
              </button>
              <button
                onClick={() => setActiveCaseTab('kickback')}
                className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                  activeCaseTab === 'kickback'
                    ? 'bg-white text-zinc-950 shadow-sm border border-zinc-200'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Procurement Kickbacks
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-zinc-50 border border-zinc-200/90 rounded-2xl p-6 sm:p-8 max-w-4xl mx-auto shadow-xs">
            {activeCaseTab === 'laundering' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center animate-fade-in">
                <div className="md:col-span-7 space-y-4">
                  <div className="inline-block px-2.5 py-0.5 rounded bg-red-100 text-red-800 text-[11px] font-bold">
                    TYPOLOGY: Trade-Based Money Laundering & Shell Entities
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-zinc-950">The $4.2M Circular Invoicing Loop</h3>
                  <p className="text-sm text-zinc-600 leading-relaxed">
                    A syndicate funneled $4,200,000 through 7 shell companies using duplicate fictitious IT consulting invoices.
                    Traditional linear audits showed standard payments between vendors.
                  </p>
                  <div className="space-y-2 pt-1 text-xs">
                    <div className="flex items-center gap-2 text-zinc-800 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>Neo4j Resolution:</strong> Detected closed circular cycles returning 91% of funds to founder offshore trust.</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-800 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>Isolation Forest:</strong> Flagged 0.96 outlier score for invoices issued on consecutive Sundays.</span>
                    </div>
                  </div>
                  <div className="pt-3">
                    <Link to="/cases" className="btn-brand inline-flex items-center gap-2 text-xs py-2 px-4">
                      <span>View Case Investigations</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                <div className="md:col-span-5 bg-white p-5 rounded-xl border border-zinc-200 shadow-sm space-y-3 font-mono text-xs">
                  <div className="text-[11px] font-bold text-zinc-500 uppercase">Detection Timeline</div>
                  <div className="space-y-2 text-[11px]">
                    <div className="p-2 rounded bg-zinc-50 border border-zinc-100">
                      <span className="text-red-600 font-bold">T-00:</span> 12 Excel ledgers ingested
                    </div>
                    <div className="p-2 rounded bg-zinc-50 border border-zinc-100">
                      <span className="text-red-600 font-bold">T+02s:</span> SHA-256 logs created (12/12)
                    </div>
                    <div className="p-2 rounded bg-zinc-50 border border-zinc-100">
                      <span className="text-red-600 font-bold">T+05s:</span> 7 shell nodes connected in graph
                    </div>
                    <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold">
                      T+08s: Court Dossier Generated
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeCaseTab === 'embezzlement' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center animate-fade-in">
                <div className="md:col-span-7 space-y-4">
                  <div className="inline-block px-2.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[11px] font-bold">
                    TYPOLOGY: Internal Embezzlement & Ghost Payroll
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-zinc-950">Automated Ghost Employee Extraction</h3>
                  <p className="text-sm text-zinc-600 leading-relaxed">
                    A regional controller created 14 fabricated employees sharing 2 routing numbers, disbursing monthly salaries over 18 months.
                  </p>
                  <div className="space-y-2 pt-1 text-xs">
                    <div className="flex items-center gap-2 text-zinc-800 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>Entity Matching:</strong> sentence-transformers clustered bank account numbers with 100% precision.</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-800 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>AI Investigator:</strong> Drafted comprehensive affidavit narrative matching payroll registers with tax IDs.</span>
                    </div>
                  </div>
                  <div className="pt-3">
                    <Link to="/cases" className="btn-brand inline-flex items-center gap-2 text-xs py-2 px-4">
                      <span>Explore Case Records</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                <div className="md:col-span-5 bg-white p-5 rounded-xl border border-zinc-200 shadow-sm space-y-3 font-mono text-xs">
                  <div className="text-[11px] font-bold text-zinc-500 uppercase">Forensic Summary</div>
                  <div className="space-y-2 text-[11px]">
                    <div className="p-2 rounded bg-zinc-50 border border-zinc-100">
                      <span>Total Loss:</span> <strong className="text-red-600">$1,180,450</strong>
                    </div>
                    <div className="p-2 rounded bg-zinc-50 border border-zinc-100">
                      <span>Ghost Entities:</span> <strong>14 Employees</strong>
                    </div>
                    <div className="p-2 rounded bg-zinc-50 border border-zinc-100">
                      <span>Target Bank Acct:</span> <strong>****9821 (Shared)</strong>
                    </div>
                    <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold">
                      Admissibility: 100% Proven
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeCaseTab === 'kickback' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center animate-fade-in">
                <div className="md:col-span-7 space-y-4">
                  <div className="inline-block px-2.5 py-0.5 rounded bg-zinc-200 text-zinc-900 text-[11px] font-bold">
                    TYPOLOGY: Vendor Procurement Kickback & Bid Rigging
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-zinc-950">Uncovering Collusive Vendor Networks</h3>
                  <p className="text-sm text-zinc-600 leading-relaxed">
                    Three competing bidders submitted proposals for municipal infrastructure contracts. Ingestion of raw RFC-822 email headers uncovered common origin IPs and matching typographical quirks.
                  </p>
                  <div className="space-y-2 pt-1 text-xs">
                    <div className="flex items-center gap-2 text-zinc-800 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>Email Ingestion:</strong> Parsed .eml metadata identifying common upstream SMTP mail servers.</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-800 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>Graph Links:</strong> Proved common ownership between 3 supposed competitors.</span>
                    </div>
                  </div>
                  <div className="pt-3">
                    <Link to="/cases" className="btn-brand inline-flex items-center gap-2 text-xs py-2 px-4">
                      <span>View Forensic Tools</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                <div className="md:col-span-5 bg-white p-5 rounded-xl border border-zinc-200 shadow-sm space-y-3 font-mono text-xs">
                  <div className="text-[11px] font-bold text-zinc-500 uppercase">Collusion Markers</div>
                  <div className="space-y-2 text-[11px]">
                    <div className="p-2 rounded bg-zinc-50 border border-zinc-100">
                      <span>Shared IP:</span> <strong>198.51.100.44</strong>
                    </div>
                    <div className="p-2 rounded bg-zinc-50 border border-zinc-100">
                      <span>Bid Variance:</span> <strong>&lt; 0.4% Margin</strong>
                    </div>
                    <div className="p-2 rounded bg-zinc-50 border border-zinc-100">
                      <span>Common Author:</span> <strong>DocuSign Meta</strong>
                    </div>
                    <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold">
                      Contract Disqualified & Referred
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* ── 8. CALL TO ACTION (CTA) SECTION ──────────────────────── */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-zinc-950 via-zinc-900 to-red-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center mx-auto shadow-xl shadow-red-600/30">
            <Shield className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white max-w-2xl mx-auto">
            Ready to Supercharge Your Forensic Investigations?
          </h2>

          <p className="text-zinc-300 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Deploy CyberTrace today. Ingest raw spreadsheets, unveil hidden entity networks in Neo4j, and produce court-admissible dossiers in minutes.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/cases/new"
              className="btn-brand flex items-center gap-2 px-7 py-3.5 text-base font-bold shadow-xl shadow-red-600/30"
            >
              <Shield className="w-4 h-4" />
              <span>Launch New Case</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/dashboard"
              className="px-6 py-3.5 text-base font-semibold bg-zinc-800/80 hover:bg-zinc-800 text-white rounded-lg border border-zinc-700 transition-all shadow-sm"
            >
              Enter Investigation Dashboard
            </Link>
          </div>

          <div className="pt-6 flex items-center justify-center gap-6 text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              No Credit Card Required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Pre-loaded Test Cases Included
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Instant Local Verification
            </span>
          </div>

        </div>
      </section>

      {/* ── 9. FOOTER ────────────────────────────────────────────── */}
      <footer id="contact" className="bg-white border-t border-zinc-200 text-zinc-600 pt-16 pb-12 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-zinc-200">
            
            {/* Col 1: Brand & Mission */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-md shadow-red-600/30">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="font-extrabold text-zinc-950 text-lg tracking-tight">Cyber<span className="text-red-600">Trace</span></span>
                  <p className="text-[10px] text-zinc-400 font-semibold tracking-wider uppercase">Forensic Platform</p>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed max-w-sm">
                Next-generation forensic fraud investigation suite pairing graph relationship intelligence, machine learning anomaly detection, and cryptographic chain-of-custody.
              </p>
              <div className="text-xs text-zinc-500 space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>ISO/IEC 27037 Digital Forensics Standards</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-zinc-600" />
                  <span>SHA-256 Tamper-Evident Linked Hashes</span>
                </div>
              </div>
            </div>

            {/* Col 2: Platform Navigation */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-zinc-950 uppercase tracking-wider">Navigation</div>
              <ul className="space-y-2 text-xs">
                <li><button onClick={() => scrollToSection('home')} className="hover:text-red-600 transition-colors">Home</button></li>
                <li><button onClick={() => scrollToSection('about')} className="hover:text-red-600 transition-colors">About CyberTrace</button></li>
                <li><button onClick={() => scrollToSection('features')} className="hover:text-red-600 transition-colors">Platform Features</button></li>
                <li><button onClick={() => scrollToSection('how-it-works')} className="hover:text-red-600 transition-colors">Investigation Workflow</button></li>
                <li><button onClick={() => scrollToSection('cases')} className="hover:text-red-600 transition-colors">Case Scenarios</button></li>
              </ul>
            </div>

            {/* Col 3: Forensic Tools */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-zinc-950 uppercase tracking-wider">Forensic Suite</div>
              <ul className="space-y-2 text-xs">
                <li><Link to="/dashboard" className="hover:text-red-600 transition-colors">Executive Dashboard</Link></li>
                <li><Link to="/cases" className="hover:text-red-600 transition-colors">Investigation Cases</Link></li>
                <li><Link to="/evidence/upload" className="hover:text-red-600 transition-colors">Evidence Ingestion</Link></li>
                <li><Link to="/graph" className="hover:text-red-600 transition-colors">Neo4j Entity Graph</Link></li>
                <li><Link to="/analytics" className="hover:text-red-600 transition-colors">Anomaly Detection</Link></li>
                <li><Link to="/ai" className="hover:text-red-600 transition-colors">AI Investigator Desk</Link></li>
                <li><Link to="/reports" className="hover:text-red-600 transition-colors">ReportLab Dossiers</Link></li>
              </ul>
            </div>

            {/* Col 4: Contact & Direct Inquiries */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-zinc-950 uppercase tracking-wider">Enterprise Inquiries</div>
              <p className="text-xs text-zinc-500">
                Deploy on-premise, inside sovereign cloud environments, or air-gapped forensic labs.
              </p>
              <div className="space-y-2 text-xs text-zinc-600 pt-1">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-red-600" />
                  <span>investigations@cybertrace.internal</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-red-600" />
                  <span>+1 (800) 555-CYBR</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-red-600" />
                  <span>Digital Forensics Lab Division</span>
                </div>
              </div>
              <button
                onClick={() => setContactModalOpen(true)}
                className="mt-2 text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Send Enterprise Inquiry</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
            <div>
              &copy; {new Date().getFullYear()} CyberTrace Forensic Intelligence Platform. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <span className="hover:text-zinc-900 cursor-pointer" onClick={() => scrollToSection('about')}>Privacy & Custody Policy</span>
              <span className="hover:text-zinc-900 cursor-pointer" onClick={() => scrollToSection('features')}>Evidentiary Standards</span>
              <Link to="/dashboard" className="text-red-600 font-semibold hover:underline">
                Enter Platform &rarr;
              </Link>
            </div>
          </div>

        </div>
      </footer>

      {/* ── 10. INTERACTIVE CONTACT MODAL ────────────────────────── */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 border border-zinc-200 shadow-2xl relative">
            <button
              onClick={() => setContactModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-950">Enterprise & Forensic Inquiry</h3>
                <p className="text-xs text-zinc-500">Connect with our digital forensics team</p>
              </div>
            </div>

            {contactSubmitted ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-zinc-950">Inquiry Received</h4>
                <p className="text-xs text-zinc-600 max-w-sm mx-auto">
                  Thank you. A forensic systems specialist will review your inquiry and follow up within 2 business hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Special Agent / Senior Auditor Jane Doe"
                    className="form-input text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">Official Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="jane.doe@agency.gov or corporate email"
                    className="form-input text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">Organization / Agency</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Department of Justice, Forensic Accounting Practice"
                    className="form-input text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">Investigation Scope & Deployment Requirements</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe your case requirements (e.g., on-premise Neo4j deployment, air-gapped Ollama LLM, large-scale financial transaction volumes)..."
                    className="form-input text-xs resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setContactModalOpen(false)}
                    className="btn-ghost text-xs py-2 px-4"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-brand flex items-center gap-1.5 text-xs py-2 px-5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Inquiry</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
