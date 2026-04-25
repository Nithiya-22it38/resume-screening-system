import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { jobsApi, resumesApi, screeningApi } from '../../lib/api'
import { PageHeader, StatusBadge, ScoreRing, EmptyState, Skeleton, Toast, ConfirmDialog } from '../ui'
import { Edit2, Trash2, Upload, Zap, Users, MapPin, ArrowLeft, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import type { Job, Resume } from '../../types'
import clsx from 'clsx'

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [job, setJob] = useState<Job | null>(null)
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(true)
  const [screening, setScreening] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'shortlisted' | 'review' | 'rejected'>('all')

  const loadData = async () => {
    try {
      const [jobRes, resumeRes] = await Promise.all([
        jobsApi.get(id!),
        resumesApi.list({ jobId: id })
      ])
      setJob(jobRes.data.job)
      setResumes(resumeRes.data.resumes)
    } catch { navigate('/jobs') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [id])

  const handleBatchScreen = async () => {
    const pending = resumes.filter(r => r.screeningStatus === 'pending')
    if (!pending.length) return setToast({ message: 'All resumes have already been screened.', type: 'info' })
    setScreening(true)
    try {
      await screeningApi.screenBatch(id!)
      setToast({ message: `Batch screening started for ${pending.length} resume(s). Results will appear shortly.`, type: 'success' })
      setTimeout(loadData, 5000)
    } catch (err: any) {
      setToast({ message: err?.response?.data?.error || 'Batch screening failed.', type: 'error' })
    } finally { setScreening(false) }
  }

  const handleDelete = async () => {
    try {
      await jobsApi.delete(id!)
      navigate('/jobs')
    } catch { setToast({ message: 'Failed to delete job.', type: 'error' }) }
    setDeleteConfirm(false)
  }

  const filteredResumes = activeTab === 'all' ? resumes : resumes.filter(r => r.status === activeTab)
  const pendingCount = resumes.filter(r => r.screeningStatus === 'pending').length

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" /></div>
  if (!job) return null

  return (
    <div className="animate-fade-in">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {deleteConfirm && <ConfirmDialog title="Delete Job?" message="This will permanently delete the job and all associated resumes." onConfirm={handleDelete} onCancel={() => setDeleteConfirm(false)} confirmLabel="Delete" danger />}

      <PageHeader
        title={job.title}
        subtitle={`${job.department} · ${job.location}`}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/jobs')} className="btn-ghost"><ArrowLeft size={15} />Back</button>
            <Link to={`/jobs/${id}/edit`} className="btn-secondary"><Edit2 size={14} />Edit</Link>
            <button onClick={() => setDeleteConfirm(true)} className="btn-ghost text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
          </div>
        }
      />

      <div className="px-8 pb-8 space-y-6">
        {/* Job info card */}
        <div className="card p-6 grid grid-cols-2 sm:grid-cols-4 gap-5">
          {[
            { label: 'Status', value: <span className={`badge border text-xs ${job.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{job.status}</span> },
            { label: 'Type', value: job.type },
            { label: 'Applicants', value: <span className="flex items-center gap-1 font-semibold"><Users size={14} className="text-slate-400" />{resumes.length}</span> },
            { label: 'Shortlisted', value: <span className="font-semibold text-emerald-600">{resumes.filter(r => r.status === 'shortlisted').length}</span> },
          ].map(item => (
            <div key={item.label}>
              <p className="text-xs text-slate-400 mb-1">{item.label}</p>
              <div className="text-sm text-slate-800">{item.value}</div>
            </div>
          ))}
        </div>

        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-2">
            {(['all', 'shortlisted', 'review', 'rejected'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={clsx('px-3.5 py-2 rounded-xl text-xs font-medium border transition-all',
                  activeTab === tab ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                )}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                <span className="ml-1.5 opacity-70">
                  ({tab === 'all' ? resumes.length : resumes.filter(r => r.status === tab).length})
                </span>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Link to={`/upload?jobId=${id}`} className="btn-secondary"><Upload size={15} />Upload Resumes</Link>
            {pendingCount > 0 && (
              <button onClick={handleBatchScreen} disabled={screening} className="btn-primary">
                {screening ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <Zap size={15} />}
                {screening ? 'Screening...' : `Screen ${pendingCount} Pending`}
              </button>
            )}
          </div>
        </div>

        {/* Resumes table */}
        {filteredResumes.length === 0 ? (
          <EmptyState
            icon={<Users size={36} />}
            title="No candidates yet"
            description="Upload resumes to start screening candidates for this position."
            action={<Link to={`/upload?jobId=${id}`} className="btn-primary"><Upload size={15} />Upload Resumes</Link>}
          />
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Candidate', 'Score', 'Status', 'Screening', 'Uploaded', ''].map(h => (
                    <th key={h} className="text-left text-xs font-medium text-slate-500 px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredResumes.map(resume => (
                  <tr key={resume.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 text-xs font-semibold flex-shrink-0">
                          {resume.candidateName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{resume.candidateName}</p>
                          <p className="text-xs text-slate-400">{resume.filename}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {resume.screeningResult ? (
                        <ScoreRing score={resume.screeningResult.overallScore} size={44} />
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={resume.status} /></td>
                    <td className="px-5 py-3.5">
                      {resume.screeningStatus === 'completed' && <span className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle size={13} />Done</span>}
                      {resume.screeningStatus === 'processing' && <span className="flex items-center gap-1 text-xs text-blue-600"><div className="w-3 h-3 rounded-full border border-blue-600 border-t-transparent animate-spin" />Processing</span>}
                      {resume.screeningStatus === 'pending' && <span className="flex items-center gap-1 text-xs text-slate-400"><Clock size={13} />Pending</span>}
                      {resume.screeningStatus === 'failed' && <span className="flex items-center gap-1 text-xs text-red-500"><AlertCircle size={13} />Failed</span>}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">{new Date(resume.uploadedAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5">
                      <Link to={`/resumes/${resume.id}`} className="text-xs text-brand-500 hover:text-brand-700 font-medium">View →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
