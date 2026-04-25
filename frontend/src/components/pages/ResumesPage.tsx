import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { resumesApi } from '../../lib/api'
import { PageHeader, StatusBadge, ScoreRing, EmptyState, Skeleton, Toast } from '../ui'
import { FileText, Search, Filter, ArrowUpRight } from 'lucide-react'
import type { Resume, ResumeStatus } from '../../types'
import clsx from 'clsx'

const STATUS_TABS: Array<{ key: 'all' | ResumeStatus; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'review', label: 'Review' },
  { key: 'pending', label: 'Pending' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'hired', label: 'Hired' },
]

export default function ResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusTab, setStatusTab] = useState<'all' | ResumeStatus>('all')
  const [toast, setToast] = useState<{ message: string; type: 'error' } | null>(null)

  useEffect(() => {
    resumesApi.list().then(r => setResumes(r.data.resumes))
      .catch(() => setToast({ message: 'Failed to load resumes', type: 'error' }))
      .finally(() => setLoading(false))
  }, [])

  const filtered = resumes.filter(r => {
    const matchSearch = r.candidateName.toLowerCase().includes(search.toLowerCase()) ||
      r.filename.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusTab === 'all' || r.status === statusTab
    return matchSearch && matchStatus
  })

  const count = (s: 'all' | ResumeStatus) =>
    s === 'all' ? resumes.length : resumes.filter(r => r.status === s).length

  return (
    <div className="animate-fade-in">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <PageHeader
        title="Resumes"
        subtitle={`${resumes.length} total candidates across all jobs`}
      />

      <div className="px-8 pb-8 space-y-5">
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search by candidate name or file..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter size={14} className="text-slate-400 mr-1" />
          {STATUS_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusTab(tab.key)}
              className={clsx(
                'px-3 py-1.5 rounded-xl text-xs font-medium border transition-all',
                statusTab === tab.key
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              )}
            >
              {tab.label}
              <span className="ml-1.5 opacity-70">({count(tab.key)})</span>
            </button>
          ))}
        </div>

        {/* Resumes grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<FileText size={40} />}
            title="No resumes found"
            description={search ? 'Try adjusting your search.' : 'Upload resumes to see them here.'}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(resume => (
              <Link
                key={resume.id}
                to={`/resumes/${resume.id}`}
                className="card-hover p-5 flex flex-col gap-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 font-bold text-base flex-shrink-0">
                      {resume.candidateName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{resume.candidateName}</p>
                      <p className="text-xs text-slate-400 truncate">{resume.filename}</p>
                    </div>
                  </div>
                  {resume.screeningResult ? (
                    <ScoreRing score={resume.screeningResult.overallScore} size={44} />
                  ) : (
                    <div className="w-11 h-11 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center">
                      <span className="text-xs text-slate-300">—</span>
                    </div>
                  )}
                </div>

                {/* Job info */}
                {resume.job && (
                  <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-2.5 py-1.5 truncate">
                    {resume.job.title}
                  </p>
                )}

                {/* Status row */}
                <div className="flex items-center justify-between">
                  <StatusBadge status={resume.status} />
                  <div className="flex items-center gap-1 text-xs text-brand-500 font-medium">
                    View <ArrowUpRight size={12} />
                  </div>
                </div>

                {/* Score breakdown mini */}
                {resume.screeningResult && (
                  <div className="pt-2 border-t border-slate-50 grid grid-cols-2 gap-2">
                    {[
                      { label: 'Skills', val: resume.screeningResult.scores.skillsMatch },
                      { label: 'Experience', val: resume.screeningResult.scores.experienceMatch },
                    ].map(({ label, val }) => (
                      <div key={label}>
                        <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                          <span>{label}</span><span>{val}</span>
                        </div>
                        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${val >= 75 ? 'bg-emerald-400' : val >= 55 ? 'bg-amber-400' : 'bg-red-400'}`}
                            style={{ width: `${val}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-[10px] text-slate-400">
                  {new Date(resume.uploadedAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
