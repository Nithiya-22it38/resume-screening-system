import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { analyticsApi } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { PageHeader, StatCard, StatusBadge, Skeleton } from '../ui'
import { Briefcase, FileText, CheckCircle, TrendingUp, ArrowRight, Clock } from 'lucide-react'
import type { AnalyticsOverview } from '../../types'

export default function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState<AnalyticsOverview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analyticsApi.overview().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false))
  }, [])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`${greeting()}, ${user?.name?.split(' ')[0]} 👋`}
        subtitle="Here's what's happening with your hiring pipeline today."
      />

      <div className="px-8 pb-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
          ) : (
            <>
              <StatCard label="Active Jobs" value={data?.summary.activeJobs ?? 0} icon={<Briefcase size={20} />} color="text-brand-600" trend={`${data?.summary.totalJobs ?? 0} total`} />
              <StatCard label="Total Resumes" value={data?.summary.totalResumes ?? 0} icon={<FileText size={20} />} color="text-slate-900" trend={`${data?.summary.screened ?? 0} screened`} />
              <StatCard label="Shortlisted" value={data?.summary.shortlisted ?? 0} icon={<CheckCircle size={20} />} color="text-emerald-600" trend="Ready for interview" />
              <StatCard label="Screening Rate" value={data?.summary.totalResumes ? `${Math.round(((data?.summary.screened ?? 0) / data.summary.totalResumes) * 100)}%` : '0%'} icon={<TrendingUp size={20} />} color="text-amber-600" trend="AI-powered" />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Job Applications Chart */}
          <div className="lg:col-span-2 card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title">Applications by Job</h2>
              <Link to="/jobs" className="text-xs text-brand-500 hover:text-brand-700 flex items-center gap-1 font-medium">View all <ArrowRight size={12} /></Link>
            </div>
            {loading ? (
              <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}</div>
            ) : (
              <div className="space-y-3">
                {(data?.jobApplicationCounts || []).slice(0, 5).map((item, i) => {
                  const max = Math.max(...(data?.jobApplicationCounts || []).map(j => j.count), 1)
                  const pct = Math.round((item.count / max) * 100)
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-slate-700 font-medium truncate max-w-xs">{item.jobTitle}</span>
                        <span className="text-slate-500 ml-2 flex-shrink-0">{item.count} applicants</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-400 rounded-full transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
                {!data?.jobApplicationCounts?.length && (
                  <p className="text-sm text-slate-400 py-8 text-center">No applications yet. <Link to="/jobs" className="text-brand-500">Create a job</Link> to get started.</p>
                )}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title">Recent Activity</h2>
              <Clock size={16} className="text-slate-300" />
            </div>
            {loading ? (
              <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
            ) : (
              <div className="space-y-2">
                {(data?.recentActivity || []).slice(0, 8).map(item => (
                  <Link
                    key={item.id}
                    to={`/resumes/${item.id}`}
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0 text-brand-600 text-xs font-semibold">
                      {item.candidateName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate group-hover:text-brand-600">{item.candidateName}</p>
                      <p className="text-xs text-slate-400 truncate">{item.jobTitle}</p>
                    </div>
                    <StatusBadge status={item.status} className="flex-shrink-0 mt-0.5" />
                  </Link>
                ))}
                {!data?.recentActivity?.length && (
                  <p className="text-sm text-slate-400 text-center py-8">No recent activity.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { to: '/jobs/new', icon: <Briefcase size={20} />, label: 'Post a Job', desc: 'Create a new job listing', color: 'bg-brand-50 text-brand-600' },
            { to: '/upload', icon: <FileText size={20} />, label: 'Upload Resumes', desc: 'Bulk upload and screen candidates', color: 'bg-emerald-50 text-emerald-600' },
            { to: '/analytics', icon: <TrendingUp size={20} />, label: 'View Analytics', desc: 'Insights into your pipeline', color: 'bg-amber-50 text-amber-600' },
          ].map(a => (
            <Link key={a.to} to={a.to} className="card-hover p-5 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.color}`}>{a.icon}</div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{a.label}</p>
                <p className="text-xs text-slate-400">{a.desc}</p>
              </div>
              <ArrowRight size={16} className="ml-auto text-slate-300" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
