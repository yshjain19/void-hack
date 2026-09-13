import { useEffect } from 'react'
import { Navigate, useNavigate, Link } from 'react-router-dom'
import { FolderOpen, ArrowLeft, Network, BarChart3, Brain, FileText } from 'lucide-react'
import { useCase } from '../lib/CaseContext'

interface ToolRedirectProps {
  tool: 'graph' | 'analytics' | 'ai' | 'reports'
  title: string
}

export default function ToolRedirect({ tool, title }: ToolRedirectProps) {
  const { activeCaseId, openCaseSelector } = useCase()
  const navigate = useNavigate()

  useEffect(() => {
    if (!activeCaseId) {
      openCaseSelector({ label: title, path: `/${tool}` })
    }
  }, [activeCaseId, tool, title, openCaseSelector])

  if (activeCaseId) {
    return <Navigate to={`/cases/${activeCaseId}/${tool}`} replace />
  }

  const getIcon = () => {
    switch (tool) {
      case 'graph': return Network
      case 'analytics': return BarChart3
      case 'ai': return Brain
      case 'reports': return FileText
    }
  }

  const Icon = getIcon()

  return (
    <div className="max-w-xl mx-auto my-12 p-8 glass rounded-2xl text-center space-y-5 animate-slide-up">
      <div className="w-14 h-14 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 mx-auto">
        <Icon className="w-7 h-7" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
        <p className="text-slate-400 text-sm">
          Please select or open an investigation case to utilize this forensic analysis tool.
        </p>
      </div>
      <div className="flex justify-center gap-3 pt-2">
        <button
          onClick={() => openCaseSelector({ label: title, path: `/${tool}` })}
          className="btn-brand flex items-center gap-2"
        >
          <FolderOpen className="w-4 h-4" /> Select Case
        </button>
        <Link to="/" className="btn-ghost flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Return to Dashboard
        </Link>
      </div>
    </div>
  )
}
