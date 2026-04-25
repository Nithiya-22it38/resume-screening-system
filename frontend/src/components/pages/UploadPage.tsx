import { useCallback, useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { resumesApi, jobsApi } from '../../lib/api'
import { PageHeader, Toast, Spinner } from '../ui'
import { Upload, X, FileText, CheckCircle, AlertCircle, CloudUpload, Zap } from 'lucide-react'
import type { Job, UploadResult } from '../../types'
import clsx from 'clsx'

interface FileItem {
  file: File
  id: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  resumeId?: string
}

export default function UploadPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const preselectedJobId = searchParams.get('jobId') || ''

  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJobId, setSelectedJobId] = useState(preselectedJobId)
  const [files, setFiles] = useState<FileItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [results, setResults] = useState<UploadResult[]>([])
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  useEffect(() => {
    jobsApi.list({ status: 'active' }).then(r => setJobs(r.data.jobs))
  }, [])

  const onDrop = useCallback((accepted: File[]) => {
    const newFiles: FileItem[] = accepted.map(file => ({
      file,
      id: Math.random().toString(36).slice(2),
      status: 'pending',
    }))
    setFiles(prev => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 10,
    maxSize: 10 * 1024 * 1024,
    onDropRejected: (rejected) => {
      const reasons = rejected.map(r => r.errors[0]?.message).filter(Boolean)
      setToast({ message: `Some files rejected: ${reasons[0] || 'Invalid file'}`, type: 'error' })
    },
  })

  const removeFile = (id: string) => setFiles(f => f.filter(x => x.id !== id))

  const handleUpload = async () => {
    if (!selectedJobId) return setToast({ message: 'Please select a job first.', type: 'error' })
    if (!files.length) return setToast({ message: 'Please add at least one resume file.', type: 'error' })

    const pending = files.filter(f => f.status === 'pending')
    if (!pending.length) return setToast({ message: 'No pending files to upload.', type: 'info' })

    setUploading(true)
    setResults([])

    const formData = new FormData()
    formData.append('jobId', selectedJobId)
    pending.forEach(f => formData.append('resumes', f.file))

    // Mark all as uploading
    setFiles(prev => prev.map(f =>
      f.status === 'pending' ? { ...f, status: 'uploading' } : f
    ))

    try {
      const res = await resumesApi.upload(formData)
      const uploadResults: UploadResult[] = res.data.results

      setResults(uploadResults)
      setFiles(prev => prev.map(f => {
        const match = uploadResults.find(r => r.filename === f.file.name)
        if (!match) return f
        return {
          ...f,
          status: match.success ? 'success' : 'error',
          error: match.error,
          resumeId: match.resume?.id,
        }
      }))

      const successful = uploadResults.filter(r => r.success).length
      const failed = uploadResults.filter(r => !r.success).length
      setToast({
        message: `${successful} resume(s) uploaded successfully${failed > 0 ? `, ${failed} failed` : ''}.`,
        type: successful > 0 ? 'success' : 'error',
      })
    } catch (err: any) {
      setToast({ message: err?.response?.data?.error || 'Upload failed. Please try again.', type: 'error' })
      setFiles(prev => prev.map(f => f.status === 'uploading' ? { ...f, status: 'error', error: 'Upload failed' } : f))
    } finally {
      setUploading(false)
    }
  }

  const hasSuccessful = files.some(f => f.status === 'success')
  const pendingCount = files.filter(f => f.status === 'pending').length
  const selectedJob = jobs.find(j => j.id === selectedJobId)

  const formatSize = (bytes: number) =>
    bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`

  return (
    <div className="animate-fade-in">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <PageHeader
        title="Upload Resumes"
        subtitle="Upload up to 10 resumes at once for AI-powered screening."
      />

      <div className="px-8 pb-8 max-w-3xl space-y-5">
        {/* Job Selection */}
        <div className="card p-6">
          <h2 className="section-title mb-4">Select Job Position</h2>
          <select
            className="input"
            value={selectedJobId}
            onChange={e => setSelectedJobId(e.target.value)}
          >
            <option value="">— Select a job —</option>
            {jobs.map(j => (
              <option key={j.id} value={j.id}>{j.title} · {j.department}</option>
            ))}
          </select>
          {selectedJob && (
            <p className="text-xs text-slate-500 mt-2">
              📍 {selectedJob.location} · {selectedJob.type}
              {selectedJob.applicationCount > 0 && ` · ${selectedJob.applicationCount} existing applicants`}
            </p>
          )}
          {!jobs.length && (
            <p className="text-sm text-amber-600 mt-2">
              No active jobs found. <button onClick={() => navigate('/jobs/new')} className="underline">Create a job first.</button>
            </p>
          )}
        </div>

        {/* Drop zone */}
        <div className="card p-6">
          <h2 className="section-title mb-4">Add Resume Files</h2>
          <div
            {...getRootProps()}
            className={clsx(
              'border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200',
              isDragActive
                ? 'border-brand-400 bg-brand-50 scale-[1.01]'
                : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50'
            )}
          >
            <input {...getInputProps()} />
            <div className={clsx('w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4', isDragActive ? 'bg-brand-100' : 'bg-slate-100')}>
              <CloudUpload size={26} className={isDragActive ? 'text-brand-500' : 'text-slate-400'} />
            </div>
            {isDragActive ? (
              <p className="text-brand-600 font-semibold">Drop your resumes here!</p>
            ) : (
              <>
                <p className="text-slate-700 font-semibold mb-1">Drag & drop resumes here</p>
                <p className="text-slate-400 text-sm">or click to browse files</p>
              </>
            )}
            <p className="text-xs text-slate-400 mt-3">PDF, DOC, DOCX, TXT · Max 10MB per file · Up to 10 files</p>
          </div>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">Files ({files.length})</h2>
              {files.some(f => f.status === 'pending') && (
                <button
                  onClick={() => setFiles(f => f.filter(x => x.status !== 'pending'))}
                  className="text-xs text-slate-400 hover:text-red-500"
                >
                  Clear pending
                </button>
              )}
            </div>
            <div className="space-y-2">
              {files.map(f => (
                <div key={f.id} className={clsx('flex items-center gap-3 p-3 rounded-xl border', {
                  'bg-white border-slate-100': f.status === 'pending',
                  'bg-blue-50 border-blue-100': f.status === 'uploading',
                  'bg-emerald-50 border-emerald-100': f.status === 'success',
                  'bg-red-50 border-red-100': f.status === 'error',
                })}>
                  <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', {
                    'bg-slate-100': f.status === 'pending',
                    'bg-blue-100': f.status === 'uploading',
                    'bg-emerald-100': f.status === 'success',
                    'bg-red-100': f.status === 'error',
                  })}>
                    {f.status === 'pending' && <FileText size={15} className="text-slate-500" />}
                    {f.status === 'uploading' && <Spinner size={15} className="border-blue-500" />}
                    {f.status === 'success' && <CheckCircle size={15} className="text-emerald-500" />}
                    {f.status === 'error' && <AlertCircle size={15} className="text-red-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{f.file.name}</p>
                    <p className="text-xs text-slate-400">
                      {formatSize(f.file.size)}
                      {f.error && <span className="text-red-500 ml-2">{f.error}</span>}
                      {f.status === 'success' && f.resumeId && (
                        <button onClick={() => navigate(`/resumes/${f.resumeId}`)} className="text-brand-500 ml-2">View →</button>
                      )}
                    </p>
                  </div>
                  {f.status === 'pending' && (
                    <button onClick={() => removeFile(f.id)} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload button */}
        <div className="flex gap-3">
          <button
            onClick={handleUpload}
            disabled={uploading || !pendingCount || !selectedJobId}
            className="btn-primary"
          >
            {uploading ? <Spinner size={16} /> : <Upload size={16} />}
            {uploading ? 'Uploading...' : `Upload ${pendingCount || ''} Resume${pendingCount !== 1 ? 's' : ''}`}
          </button>

          {hasSuccessful && selectedJobId && (
            <button
              onClick={() => navigate(`/jobs/${selectedJobId}`)}
              className="btn-secondary"
            >
              <Zap size={15} />
              Go to Job & Screen
            </button>
          )}
        </div>

        {/* Tips */}
        <div className="card p-5 bg-gradient-to-br from-brand-50 to-white border-brand-100">
          <p className="text-sm font-semibold text-brand-800 mb-2">💡 Upload Tips</p>
          <ul className="space-y-1.5 text-xs text-slate-600">
            <li>• PDF format works best for text extraction accuracy</li>
            <li>• Ensure resumes are not password-protected</li>
            <li>• Image-only scanned PDFs may not extract correctly</li>
            <li>• After upload, use "Screen with AI" on each resume or batch-screen from the job page</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
