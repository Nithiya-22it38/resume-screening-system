import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Zap, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { Spinner } from '../ui'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('admin@company.com')
  const [password, setPassword] = useState('Admin@1234')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await login(email, password)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-brand-50/30 to-slate-100 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-100/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-100/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-500 flex items-center justify-center shadow-glow-brand mb-4">
            <Zap size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Welcome to HireIQ</h1>
          <p className="text-sm text-slate-500 mt-1">AI-powered resume screening at scale</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
                <AlertCircle size={15} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full justify-center py-3"
            >
              {isLoading ? <Spinner size={16} /> : null}
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center mb-3">Demo credentials</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Admin', email: 'admin@company.com', pw: 'Admin@1234' },
                { label: 'Recruiter', email: 'recruiter@company.com', pw: 'Recruiter@1234' },
              ].map(c => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => { setEmail(c.email); setPassword(c.pw) }}
                  className="text-xs p-2.5 rounded-lg border border-dashed border-slate-200 text-slate-500 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition-all"
                >
                  <span className="font-medium block">{c.label}</span>
                  <span className="text-[10px] opacity-70">{c.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Powered by Claude AI · HireIQ v1.0
        </p>
      </div>
    </div>
  )
}
