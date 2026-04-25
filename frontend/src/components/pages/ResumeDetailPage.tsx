import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { resumesApi, screeningApi } from '../../lib/api'
import { PageHeader, StatusBadge, ScoreRing, Toast, Spinner, ConfirmDialog } from '../ui'
import { ArrowLeft, Zap, Trash2, CheckCircle, AlertTriangle, HelpCircle, Star, User, Phone, Mail, MapPin, Briefcase, GraduationCap } from 'lucide-react'
import type { Resume, FullScreeningResult } from '../../types'
import clsx from 'clsx'

const SCORE_LABELS = [
  { key: 'skillsMatch', label: 'Skills Match' },
  { key: 'experienceMatch', label: 'Experience' },
  { key: 'educationMatch', label: 'Education' },
  { key: 'cultureFit', label: 'Culture Fit' },
] as const

const scoreColor = (s: number) => s >= 75 ? 'bg-emerald-500' : s >= 55 ? 'bg-amber-400' : 'bg-red-400'

export default function ResumeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [resume, setResume] = useState<Resume | null>(null)
  const [screening, setScreening] = useState<FullScreeningResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [statusUpdating, setStatusUpdating] = useState(false)

  const loadData = async () => {
    try {
      const res = await resumesApi.get(id!)
      setResume(res.data.resume)
      if (res.data.resume.screeningStatus === 'completed') {
        const sr = await screeningApi.getResult(id!).catch(() => null)
        if (sr) setScreening(sr.data.screeningResult)
      }
    } catch { navigate('/resumes') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [id])

  const handleScreen = async () => {
    setAiLoading(true)
    try {
      const res = await screeningApi.screenOne(id!)
      setScreening(res.data.screeningResult)
      setResume(r => r ? { ...r, screeningStatus: 'completed', status: res.data.screeningResult.status } : r)
      setToast({ message: 'Resume screened successfully!', type: 'success' })
    } catch (err: any) {
      setToast({ message: err?.response?.data?.error || 'Screening failed. Please try again.', type: 'error' })
    } finally { setAiLoading(false) }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    setStatusUpdating(true)
    try {
      await resumesApi.updateStatus(id!, newStatus)
      setResume(r => r ? { ...r, status: newStatus as any } : r)
      setToast({ message: `Status updated to ${newStatus}`, type: 'success' })
    } catch { setToast({ message: 'Failed to update status', type: 'error' }) }
    finally { setStatusUpdating(false) }
  }

  const handleDelete = async () => {
    try {
      await resumesApi.delete(id!)
      navigate(resume?.job ? `/jobs/${resume.job.id}` : '/resumes')
    } catch { setToast({ message: 'Failed to delete resume', type: 'error' }) }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size={28} /></div>
  if (!resume) return null

  const profile = screening?.candidateProfile

  return (
    <div className="animate-fade-in">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {deleteConfirm && <ConfirmDialog title="Delete Resume?" message="This will permanently remove this candidate's resume and screening results." onConfirm={handleDelete} onCancel={() => setDeleteConfirm(false)} confirmLabel="Delete" danger />}

      <PageHeader
        title={resume.candidateName}
        subtitle={resume.job ? `Applied for ${resume.job.title}` : 'Resume details'}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="btn-ghost"><ArrowLeft size={15} />Back</button>
            {resume.screeningStatus !== 'completed' && (
              <button onClick={handleScreen} disabled={aiLoading} className="btn-primary">
                {aiLoading ? <Spinner size={15} /> : <Zap size={15} />}
                {aiLoading ? 'Screening...' : 'Screen with AI'}
              </button>
            )}
            <button onClick={() => setDeleteConfirm(true)} className="btn-ghost text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
          </div>
        }
      />

      {aiLoading && (
        <div className="mx-8 mb-6 p-4 bg-brand-50 border border-brand-200 rounded-2xl flex items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-brand-500 border-t-transparent animate-spin flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-brand-800">Analyzing resume with Claude AI...</p>
            <p className="text-xs text-brand-600">This may take 15-30 seconds. Evaluating skills, experience, and fit.</p>
          </div>
        </div>
      )}

      <div className="px-8 pb-8 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="space-y-4">
          {/* Candidate profile card */}
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-600 text-lg font-bold">
                {resume.candidateName.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{profile?.name || resume.candidateName}</p>
                {profile?.currentTitle && <p className="text-sm text-slate-500">{profile.currentTitle}</p>}
              </div>
            </div>

            <div className="space-y-2.5 text-sm">
              {profile?.email && <div className="flex items-center gap-2 text-slate-600"><Mail size={13} className="text-slate-400" />{profile.email}</div>}
              {profile?.phone && <div className="flex items-center gap-2 text-slate-600"><Phone size={13} className="text-slate-400" />{profile.phone}</div>}
              {profile?.location && <div className="flex items-center gap-2 text-slate-600"><MapPin size={13} className="text-slate-400" />{profile.location}</div>}
              {profile?.yearsOfExperience !== undefined && <div className="flex items-center gap-2 text-slate-600"><Briefcase size={13} className="text-slate-400" />{profile.yearsOfExperience} years experience</div>}
              {profile?.educationLevel && <div className="flex items-center gap-2 text-slate-600"><GraduationCap size={13} className="text-slate-400" />{profile.educationLevel}</div>}
            </div>

            {profile?.topSkills?.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium text-slate-500 mb-2">Top Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.topSkills.map(skill => (
                    <span key={skill} className="px-2.5 py-0.5 bg-brand-50 text-brand-700 text-xs rounded-lg border border-brand-100">{skill}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Status management */}
          <div className="card p-5">
            <p className="text-sm font-semibold text-slate-800 mb-3">Update Status</p>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-slate-500">Current:</span>
              <StatusBadge status={resume.status} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(['shortlisted', 'review', 'rejected', 'hired'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => handleStatusUpdate(s)}
                  disabled={statusUpdating || resume.status === s}
                  className={clsx('text-xs py-2 px-3 rounded-xl border font-medium transition-all',
                    resume.status === s ? 'bg-brand-50 border-brand-200 text-brand-600' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  )}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* File info */}
          <div className="card p-5">
            <p className="text-sm font-semibold text-slate-800 mb-3">File Info</p>
            <div className="space-y-2 text-xs text-slate-500">
              <div className="flex justify-between"><span>Filename</span><span className="text-slate-700 font-medium truncate max-w-[140px]">{resume.filename}</span></div>
              <div className="flex justify-between"><span>Size</span><span className="text-slate-700 font-medium">{(resume.fileSize / 1024).toFixed(1)} KB</span></div>
              <div className="flex justify-between"><span>Uploaded</span><span className="text-slate-700 font-medium">{new Date(resume.uploadedAt).toLocaleDateString()}</span></div>
              <div className="flex justify-between"><span>Screening</span><span><StatusBadge status={resume.screeningStatus} /></span></div>
            </div>
          </div>
        </div>

        {/* Right column - screening results */}
        <div className="lg:col-span-2 space-y-4">
          {!screening ? (
            <div className="card p-12 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                <Zap size={24} className="text-slate-300" />
              </div>
              <h3 className="text-base font-semibold text-slate-700 mb-1">Not yet screened</h3>
              <p className="text-sm text-slate-400 mb-5">Use AI to analyze this resume against the job requirements.</p>
              <button onClick={handleScreen} disabled={aiLoading} className="btn-primary">
                {aiLoading ? <Spinner size={15} /> : <Zap size={15} />}
                {aiLoading ? 'Analyzing...' : 'Screen with AI'}
              </button>
            </div>
          ) : (
            <>
              {/* Score overview */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="section-title">AI Screening Results</h2>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={screening.status} />
                    <ScoreRing score={screening.overallScore} size={56} />
                  </div>
                </div>

                <p className="text-sm text-slate-600 mb-5 leading-relaxed bg-slate-50 p-3 rounded-xl">{screening.summary}</p>

                {/* Score breakdown */}
                <div className="space-y-3">
                  {SCORE_LABELS.map(({ key, label }) => (
                    <div key={key}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600 font-medium">{label}</span>
                        <span className="font-semibold text-slate-800">{screening.scores[key]}/100</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={clsx('h-full rounded-full transition-all duration-700', scoreColor(screening.scores[key]))}
                          style={{ width: `${screening.scores[key]}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths & Concerns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle size={15} className="text-emerald-500" />
                    <h3 className="text-sm font-semibold text-slate-800">Strengths</h3>
                  </div>
                  <ul className="space-y-2">
                    {screening.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <Star size={12} className="text-emerald-400 mt-1 flex-shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={15} className="text-amber-500" />
                    <h3 className="text-sm font-semibold text-slate-800">Concerns</h3>
                  </div>
                  <ul className="space-y-2">
                    {screening.concerns.length > 0 ? screening.concerns.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <AlertTriangle size={12} className="text-amber-400 mt-1 flex-shrink-0" />
                        {c}
                      </li>
                    )) : <li className="text-sm text-slate-400 italic">No significant concerns.</li>}
                  </ul>
                </div>
              </div>

              {/* Requirements match */}
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">Requirements Match</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-emerald-600 font-medium mb-2">✓ Matched ({screening.matchedRequirements.length})</p>
                    <ul className="space-y-1.5">
                      {screening.matchedRequirements.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                          <CheckCircle size={11} className="text-emerald-500 mt-0.5 flex-shrink-0" />{r}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {screening.missingRequirements.length > 0 && (
                    <div>
                      <p className="text-xs text-red-500 font-medium mb-2">✗ Missing ({screening.missingRequirements.length})</p>
                      <ul className="space-y-1.5">
                        {screening.missingRequirements.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                            <span className="text-red-400 mt-0.5 flex-shrink-0">✗</span>{r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Interview questions */}
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <HelpCircle size={15} className="text-brand-500" />
                  <h3 className="text-sm font-semibold text-slate-800">Suggested Interview Questions</h3>
                </div>
                <ol className="space-y-2.5">
                  {screening.interviewQuestions.map((q, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                      <span className="w-5 h-5 rounded-full bg-brand-50 text-brand-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                      {q}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Recommendation */}
              <div className="card p-5 bg-gradient-to-br from-brand-50 to-white border-brand-100">
                <div className="flex items-center gap-2 mb-2">
                  <User size={15} className="text-brand-500" />
                  <h3 className="text-sm font-semibold text-brand-800">AI Recommendation</h3>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{screening.recommendation}</p>
                <p className="text-xs text-slate-400 mt-3">Screened by {screening.model} · {new Date(screening.createdAt).toLocaleString()}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
