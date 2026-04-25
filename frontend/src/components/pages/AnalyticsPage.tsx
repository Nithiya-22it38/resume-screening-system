import { useEffect, useState } from 'react'
import { analyticsApi } from '../../lib/api'
import { PageHeader, StatCard, Skeleton } from '../ui'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { BarChart3, Users, Briefcase, CheckCircle, TrendingUp, Clock } from 'lucide-react'
import type { AnalyticsOverview } from '../../types'

const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#94a3b8', '#1a52ff']

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-100 shadow-card px-3 py-2 rounded-xl text-xs">
      <p className="font-medium text-slate-700">{label}</p>
      <p className="text-brand-600">{payload[0]?.value} applications</p>
    </div>
  )
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsOverview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analyticsApi.overview()
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const pieData = data
    ? [
        { name: 'Shortlisted', value: data.summary.shortlisted },
        { name: 'Review', value: data.summary.screened - data.summary.shortlisted - data.summary.rejected },
        { name: 'Rejected', value: data.summary.rejected },
        { name: 'Pending', value: data.summary.totalResumes - data.summary.screened },
      ].filter(d => d.value > 0)
    : []

  const scoreDistData = data
    ? Object.entries(data.scoreDistribution).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([k, v]) => ({ range: k, count: v }))
    : []

  const jobBarData = (data?.jobApplicationCounts || [])
    .sort((a, b) => b.count - a.count)
    .slice(0, 7)
    .map(j => ({
      name: j.jobTitle.length > 20 ? j.jobTitle.slice(0, 20) + '…' : j.jobTitle,
      count: j.count,
    }))

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Analytics"
        subtitle="Insights into your hiring pipeline performance."
      />

      <div className="px-8 pb-8 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {loading ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />) : (
            <>
              <StatCard label="Total Jobs" value={data?.summary.totalJobs ?? 0} icon={<Briefcase size={18} />} />
              <StatCard label="Active Jobs" value={data?.summary.activeJobs ?? 0} icon={<TrendingUp size={18} />} color="text-brand-600" />
              <StatCard label="Total Resumes" value={data?.summary.totalResumes ?? 0} icon={<Users size={18} />} />
              <StatCard label="Screened" value={data?.summary.screened ?? 0} icon={<BarChart3 size={18} />} color="text-blue-600" />
              <StatCard label="Shortlisted" value={data?.summary.shortlisted ?? 0} icon={<CheckCircle size={18} />} color="text-emerald-600" />
              <StatCard
                label="Screen Rate"
                value={data?.summary.totalResumes ? `${Math.round((data.summary.screened / data.summary.totalResumes) * 100)}%` : '0%'}
                icon={<Clock size={18} />}
                color="text-amber-600"
              />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Applications per Job bar chart */}
          <div className="lg:col-span-2 card p-6">
            <h2 className="section-title mb-5">Applications by Job</h2>
            {loading ? <Skeleton className="h-60 rounded-xl" /> : jobBarData.length === 0 ? (
              <div className="h-60 flex items-center justify-center text-sm text-slate-400">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={jobBarData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="count" fill="#1a52ff" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Candidate status pie */}
          <div className="card p-6">
            <h2 className="section-title mb-5">Candidate Status</h2>
            {loading ? <Skeleton className="h-60 rounded-xl" /> : pieData.length === 0 ? (
              <div className="h-60 flex items-center justify-center text-sm text-slate-400">No candidates yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="45%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: any) => [v, 'Candidates']} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Score distribution */}
        {scoreDistData.length > 0 && (
          <div className="card p-6">
            <h2 className="section-title mb-5">Score Distribution</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={scoreDistData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="count" name="Candidates" radius={[4, 4, 0, 0]} maxBarSize={48}
                  fill="url(#scoreGradient)" />
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#1a52ff" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent activity table */}
        <div className="card p-6">
          <h2 className="section-title mb-4">Recent Candidate Activity</h2>
          {loading ? <Skeleton className="h-40 rounded-xl" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Candidate', 'Job', 'Status', 'Date'].map(h => (
                      <th key={h} className="text-left text-xs font-medium text-slate-400 pb-3 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(data?.recentActivity || []).map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 pr-4 font-medium text-slate-800">{item.candidateName}</td>
                      <td className="py-2.5 pr-4 text-slate-500 text-xs">{item.jobTitle}</td>
                      <td className="py-2.5 pr-4">
                        <span className={`badge text-xs ${
                          item.status === 'shortlisted' ? 'badge-shortlisted' :
                          item.status === 'rejected' ? 'badge-rejected' :
                          item.status === 'review' ? 'badge-review' : 'badge-pending'
                        }`}>{item.status}</span>
                      </td>
                      <td className="py-2.5 text-slate-400 text-xs">{new Date(item.uploadedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {!data?.recentActivity?.length && (
                    <tr><td colSpan={4} className="py-8 text-center text-slate-400 text-sm">No activity yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
