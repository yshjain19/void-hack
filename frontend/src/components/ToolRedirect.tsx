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

  const ToolIcon = getIcon()

  return (
    <div className="max-w-xl mx-auto my-12 p-8 glass rounded-2xl text-center space-y-5 animate-slide-up border-zinc-200/90 shadow-sm">
      <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mx-auto shadow-xs">
        <ToolIcon className="w-7 h-7" />
      </div>
      <div>
        <h2 className="text-xl font-extrabold text-zinc-950 mb-1.5">{title}</h2>
        <p className="text-zinc-500 text-sm max-w-sm mx-auto">
          Please select or register an active investigation case to utilize this forensic analysis capability.
        </p>
      </div>
      <div className="flex justify-center gap-3 pt-2">
        <button
          onClick={() => openCaseSelector({ label: title, path: `/${tool}` })}
          className="btn-brand flex items-center gap-2 text-xs py-2 px-4 shadow-xs"
        >
          <FolderOpen className="w-4 h-4" /> Select Investigation
        </button>
        <Link to="/" className="btn-ghost flex items-center gap-2 text-xs py-2 px-4">
          <ArrowLeft className="w-4 h-4" /> Return to Dashboard
        </Link>
      </div>
    </div>
  )
}
