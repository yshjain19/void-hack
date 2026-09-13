import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Upload, File, CheckCircle, XCircle, Loader2,
  AlertTriangle, Hash, Shield, ChevronDown
} from 'lucide-react'
import { evidenceApi, casesApi } from '../lib/api'
import { formatBytes, truncateHash } from '../lib/utils'

interface UploadFile {
  file: File
  id: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  hash?: string
  evidenceId?: string
  error?: string
}

export default function EvidenceUpload() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const defaultCaseId = searchParams.get('case_id') || ''

  const [caseId, setCaseId] = useState(defaultCaseId)
  const [cases, setCases] = useState<any[]>([])
  const [actor, setActor] = useState('analyst')
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState<UploadFile[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    casesApi.list({ limit: 100 }).then(r => setCases(r.data.items || [])).catch(() => {})
  }, [])

  const onDrop = useCallback((accepted: File[]) => {
    const newFiles: UploadFile[] = accepted.map(f => ({
      file: f,
      id: Math.random().toString(36).slice(2),
      status: 'pending',
    }))
    setFiles(prev => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
      'message/rfc822': ['.eml'],
      'application/json': ['.json'],
    },
    multiple: true,
  })

  const removeFile = (id: string) => setFiles(prev => prev.filter(f => f.id !== id))

  const uploadAll = async () => {
    if (!caseId) return alert('Please select a case first')
    setUploading(true)

    for (const uf of files.filter(f => f.status === 'pending')) {
      setFiles(prev => prev.map(f => f.id === uf.id ? { ...f, status: 'uploading' } : f))

      try {
        const formData = new FormData()
        formData.append('case_id', caseId)
        formData.append('actor', actor)
        formData.append('description', description)
        formData.append('file', uf.file)

        const res = await evidenceApi.upload(formData)
        setFiles(prev => prev.map(f => f.id === uf.id ? {
          ...f, status: 'success',
          hash: res.data.sha256_hash,
          evidenceId: res.data.id,
        } : f))
      } catch (err: any) {
        setFiles(prev => prev.map(f => f.id === uf.id ? {
          ...f, status: 'error',
          error: err?.response?.data?.detail || 'Upload failed',
        } : f))
      }
    }

    setUploading(false)
  }

  const allDone = files.every(f => f.status === 'success' || f.status === 'error')
  const anySuccess = files.some(f => f.status === 'success')

  const FILE_TYPE_COLORS: Record<string, string> = {
    xlsx: 'text-emerald-400', xls: 'text-emerald-400',
    csv: 'text-blue-400', eml: 'text-amber-400',
    json: 'text-purple-400', msg: 'text-amber-400',
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Upload Evidence</h1>
        <p className="text-slate-400 text-sm mt-1">
          Files are SHA-256 hashed automatically with full chain-of-custody logging
        </p>
      </div>

      {/* Options */}
      <div className="glass p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Case <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <select
              value={caseId}
              onChange={e => setCaseId(e.target.value)}
              className="form-input pr-8 appearance-none cursor-pointer"
            >
              <option value="" className="bg-slate-900">Select a case...</option>
              {cases.map(c => (
                <option key={c.id} value={c.id} className="bg-slate-900">{c.title}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Uploaded By</label>
            <input type="text" value={actor} onChange={e => setActor(e.target.value)} className="form-input" placeholder="analyst" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="form-input" placeholder="Optional notes..." />
          </div>
        </div>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300 ${
          isDragActive
            ? 'border-brand-400 bg-brand-500/10 shadow-lg shadow-brand-500/20'
            : 'border-slate-700 hover:border-slate-500 bg-slate-900/30'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
            isDragActive ? 'bg-brand-500/20' : 'bg-slate-800/60'
          }`}>
            <Upload className={`w-8 h-8 transition-colors ${isDragActive ? 'text-brand-400' : 'text-slate-500'}`} />
          </div>
          {isDragActive ? (
            <p className="text-brand-300 font-semibold">Drop files here...</p>
          ) : (
            <>
              <p className="text-slate-300 font-medium">Drag & drop evidence files</p>
              <p className="text-slate-500 text-sm">or click to browse</p>
            </>
          )}
          <div className="flex gap-2 flex-wrap justify-center mt-2">
            {['.xlsx', '.csv', '.eml', '.json'].map(ext => (
              <span key={ext} className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                {ext}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="glass overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-800">
            <span className="text-sm font-semibold text-slate-200">{files.length} file{files.length !== 1 ? 's' : ''} selected</span>
            <div className="flex gap-2">
              {anySuccess && (
                <button
                  onClick={() => navigate(`/cases/${caseId}`)}
                  className="btn-ghost text-sm flex items-center gap-2"
                >
                  View Case →
                </button>
              )}
              <button
                onClick={uploadAll}
                disabled={uploading || !caseId || files.every(f => f.status !== 'pending')}
                className="btn-brand text-sm flex items-center gap-2"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? 'Uploading...' : 'Upload All'}
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-800">
            {files.map(uf => {
              const ext = uf.file.name.split('.').pop()?.toLowerCase() || ''
              const colorClass = FILE_TYPE_COLORS[ext] || 'text-slate-400'
              return (
                <div key={uf.id} className="flex items-center gap-4 p-4 hover:bg-slate-800/20 transition-colors">
                  <File className={`w-8 h-8 shrink-0 ${colorClass}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{uf.file.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-slate-500">{formatBytes(uf.file.size)}</span>
                      <span className="text-xs text-slate-600 uppercase">{ext}</span>
                    </div>
                    {uf.hash && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <Hash className="w-3 h-3 text-slate-600" />
                        <code className="hash-text">{truncateHash(uf.hash)}</code>
                        <Shield className="w-3 h-3 text-emerald-500" />
                      </div>
                    )}
                    {uf.error && (
                      <p className="text-xs text-red-400 mt-1">{uf.error}</p>
                    )}
                  </div>

                  {/* Status */}
                  <div className="shrink-0">
                    {uf.status === 'pending' && (
                      <span className="text-xs text-slate-500 border border-slate-700 px-2 py-1 rounded">Pending</span>
                    )}
                    {uf.status === 'uploading' && (
                      <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
                    )}
                    {uf.status === 'success' && (
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    )}
                    {uf.status === 'error' && (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                  </div>

                  {uf.status === 'pending' && (
                    <button onClick={() => removeFile(uf.id)} className="text-slate-600 hover:text-slate-400 transition-colors">
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="glass p-4 border-l-4 border-emerald-500">
        <div className="flex items-start gap-3">
          <Shield className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="text-emerald-300 font-semibold">Forensic Integrity Guaranteed</p>
            <p className="text-slate-400 mt-0.5">
              Every uploaded file is immediately SHA-256 hashed. All subsequent access,
              verification, and deletion events are recorded in an immutable chain-of-custody
              log with chained hashes, ensuring tamper-evident audit trails.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
