import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { jobsApi } from '../../lib/api'
import { PageHeader, Toast, Spinner } from '../ui'
import { Plus, X, ArrowLeft } from 'lucide-react'

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote']
const DEPARTMENTS = ['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'Operations', 'HR', 'Finance', 'Legal', 'Other']

export default function CreateJobPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [form, setForm] = useState({
    title: '', department: 'Engineering', location: '', type: 'Full-time',
    description: '', requirements: [''], niceToHave: [''],
    salaryMin: '', salaryMax: '', status: 'active',
  })
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isEdit) {
      jobsApi.get(id!).then(r => {
        const j = r.data.job
        setForm({
          title: j.title, department: j.department, location: j.location,
          type: j.type, description: j.description,
          requirements: j.requirements.length ? j.requirements : [''],
          niceToHave: j.niceToHave?.length ? j.niceToHave : [''],
          salaryMin: j.salaryMin?.toString() || '', salaryMax: j.salaryMax?.toString() || '',
          status: j.status,
        })
      }).catch(() => navigate('/jobs')).finally(() => setFetching(false))
    }
  }, [id])

  const setField = (field: string, value: unknown) => {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => { const next = { ...e }; delete next[field]; return next })
  }

  const listOps = (field: 'requirements' | 'niceToHave') => ({
    update: (i: number, v: string) => setField(field, form[field].map((x, j) => j === i ? v : x)),
    add: () => setField(field, [...form[field], '']),
    remove: (i: number) => setField(field, form[field].filter((_, j) => j !== i)),
  })

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.title.trim()) e.title = 'Title is required'
    if (!form.location.trim()) e.location = 'Location is required'
    if (!form.description.trim() || form.description.length < 50) e.description = 'Description must be at least 50 characters'
    if (form.requirements.filter(r => r.trim()).length === 0) e.requirements = 'At least one requirement is needed'
    if (form.salaryMin && form.salaryMax && Number(form.salaryMin) > Number(form.salaryMax)) e.salaryMin = 'Min salary cannot exceed max'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const payload = {
        ...form,
        requirements: form.requirements.filter(r => r.trim()),
        niceToHave: form.niceToHave.filter(n => n.trim()),
        salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
      }
      if (isEdit) await jobsApi.update(id!, payload)
      else await jobsApi.create(payload)
      navigate('/jobs')
    } catch (err: any) {
      setToast({ message: err?.response?.data?.error || 'Failed to save job', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return <div className="flex items-center justify-center h-64"><Spinner size={28} /></div>

  return (
    <div className="animate-fade-in">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader
        title={isEdit ? 'Edit Job' : 'Create New Job'}
        subtitle="Fill in the details for this position."
        actions={<button onClick={() => navigate(-1)} className="btn-ghost"><ArrowLeft size={16} />Back</button>}
      />

      <form onSubmit={handleSubmit} className="px-8 pb-8 max-w-3xl space-y-6">
        {/* Basic info */}
        <div className="card p-6 space-y-5">
          <h2 className="section-title">Basic Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Job Title *</label>
              <input className={`input ${errors.title ? 'border-red-300' : ''}`} value={form.title} onChange={e => setField('title', e.target.value)} placeholder="e.g. Senior Software Engineer" />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
            </div>
            <div>
              <label className="label">Department *</label>
              <select className="input" value={form.department} onChange={e => setField('department', e.target.value)}>
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Job Type *</label>
              <select className="input" value={form.type} onChange={e => setField('type', e.target.value)}>
                {JOB_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Location *</label>
              <input className={`input ${errors.location ? 'border-red-300' : ''}`} value={form.location} onChange={e => setField('location', e.target.value)} placeholder="e.g. San Francisco, CA or Remote" />
              {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
            </div>
            <div>
              <label className="label">Min Salary ($)</label>
              <input type="number" className={`input ${errors.salaryMin ? 'border-red-300' : ''}`} value={form.salaryMin} onChange={e => setField('salaryMin', e.target.value)} placeholder="80000" />
              {errors.salaryMin && <p className="text-xs text-red-500 mt-1">{errors.salaryMin}</p>}
            </div>
            <div>
              <label className="label">Max Salary ($)</label>
              <input type="number" className="input" value={form.salaryMax} onChange={e => setField('salaryMax', e.target.value)} placeholder="150000" />
            </div>
            {isEdit && (
              <div>
                <label className="label">Status</label>
                <select className="input" value={form.status} onChange={e => setField('status', e.target.value)}>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="card p-6 space-y-4">
          <h2 className="section-title">Job Description</h2>
          <div>
            <label className="label">Description * <span className="text-slate-400 font-normal">({form.description.length} chars)</span></label>
            <textarea
              className={`input min-h-[140px] resize-none ${errors.description ? 'border-red-300' : ''}`}
              value={form.description}
              onChange={e => setField('description', e.target.value)}
              placeholder="Describe the role, team, and what makes this position exciting..."
            />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
          </div>
        </div>

        {/* Requirements */}
        <div className="card p-6 space-y-4">
          <h2 className="section-title">Requirements</h2>
          {errors.requirements && <p className="text-xs text-red-500">{errors.requirements}</p>}
          <div className="space-y-2">
            {form.requirements.map((req, i) => {
              const ops = listOps('requirements')
              return (
                <div key={i} className="flex gap-2">
                  <input className="input flex-1" value={req} onChange={e => ops.update(i, e.target.value)} placeholder={`Requirement ${i + 1}`} />
                  {form.requirements.length > 1 && (
                    <button type="button" onClick={() => ops.remove(i)} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"><X size={15} /></button>
                  )}
                </div>
              )
            })}
          </div>
          <button type="button" onClick={listOps('requirements').add} className="btn-ghost text-brand-500 hover:bg-brand-50 text-xs">
            <Plus size={14} />Add requirement
          </button>
        </div>

        {/* Nice to Have */}
        <div className="card p-6 space-y-4">
          <h2 className="section-title">Nice to Have <span className="text-sm font-normal text-slate-400">(Optional)</span></h2>
          <div className="space-y-2">
            {form.niceToHave.map((item, i) => {
              const ops = listOps('niceToHave')
              return (
                <div key={i} className="flex gap-2">
                  <input className="input flex-1" value={item} onChange={e => ops.update(i, e.target.value)} placeholder={`Nice to have ${i + 1}`} />
                  {form.niceToHave.length > 1 && (
                    <button type="button" onClick={() => ops.remove(i)} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"><X size={15} /></button>
                  )}
                </div>
              )
            })}
          </div>
          <button type="button" onClick={listOps('niceToHave').add} className="btn-ghost text-brand-500 hover:bg-brand-50 text-xs">
            <Plus size={14} />Add item
          </button>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <Spinner size={16} /> : null}
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Job'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  )
}
