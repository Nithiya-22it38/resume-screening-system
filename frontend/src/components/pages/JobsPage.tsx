import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { jobsApi } from '../../lib/api'
import { PageHeader, EmptyState, Skeleton, Toast } from '../ui'
import { Briefcase, Plus, MapPin, Users, Clock, ChevronRight, Search, Filter } from 'lucide-react'
import type { Job } from '../../types'
import clsx from 'clsx'

const statusColors: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  paused: 'bg-amber-50 text-amber-700 border-amber-200',
  closed: 'bg-slate-100 text-slate-600 border-slate-200',
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    jobsApi.list().then(r => setJobs(r.data.jobs)).catch(() => setToast({ message: 'Failed to load jobs', type: 'error' })).finally(() => setLoading(false))
  }, [])

  const filtered = jobs.filter(j => {
    const matchSearch = j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.department.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || j.status === statusFilter
    return matchSearch && matchStatus
  })

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return null
    const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n}`
    if (min && max) return `${fmt(min)} – ${fmt(max)}`
    if (min) return `From ${fmt(min)}`
    return `Up to ${fmt(max!)}`
  }

  return (
    <div className="animate-fade-in">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <PageHeader
        title="Job Listings"
        subtitle={`${jobs.filter(j => j.status === 'active').length} active positions`}
        actions={
          <Link to="/jobs/new" className="btn-primary">
            <Plus size={16} /> New Job
          </Link>
        }
      />

      <div className="px-8 pb-8 space-y-5">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" placeholder="Search jobs..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-slate-400" />
            {['all', 'active', 'paused', 'closed'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={clsx('px-3.5 py-2 rounded-xl text-xs font-medium border transition-all', statusFilter === s ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300')}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Job cards */}
        {loading ? (
          <div className="grid gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Briefcase size={40} />}
            title="No jobs found"
            description={search ? 'Try adjusting your search.' : 'Get started by creating your first job listing.'}
            action={<Link to="/jobs/new" className="btn-primary"><Plus size={16} />Create Job</Link>}
          />
        ) : (
          <div className="grid gap-4">
            {filtered.map(job => (
              <Link key={job.id} to={`/jobs/${job.id}`} className="card-hover p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                      <Briefcase size={18} className="text-brand-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-semibold text-slate-900">{job.title}</h3>
                        <span className={clsx('badge border text-xs', statusColors[job.status])}>
                          {job.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1"><MapPin size={11} />{job.location}</span>
                        <span className="font-medium text-slate-500">{job.department}</span>
                        <span>{job.type}</span>
                        {formatSalary(job.salaryMin, job.salaryMax) && (
                          <span className="text-emerald-600 font-medium">{formatSalary(job.salaryMin, job.salaryMax)}</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-2 line-clamp-2">{job.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 flex-shrink-0">
                    <div className="text-center hidden sm:block">
                      <div className="flex items-center gap-1 text-slate-700 font-semibold">
                        <Users size={14} className="text-slate-400" />
                        <span>{job.applicationCount}</span>
                      </div>
                      <p className="text-xs text-slate-400">applicants</p>
                    </div>
                    {(job.shortlistedCount ?? 0) > 0 && (
                      <div className="text-center hidden sm:block">
                        <p className="text-emerald-600 font-semibold">{job.shortlistedCount}</p>
                        <p className="text-xs text-slate-400">shortlisted</p>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock size={12} />
                      {new Date(job.createdAt).toLocaleDateString()}
                    </div>
                    <ChevronRight size={16} className="text-slate-300" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
