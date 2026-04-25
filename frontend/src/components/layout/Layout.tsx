import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import {
  LayoutDashboard, Briefcase, FileText, Upload,
  BarChart3, LogOut, Zap, ChevronRight, User, FlaskConical
} from 'lucide-react'
import clsx from 'clsx'
import api from '../../lib/api'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/jobs', icon: Briefcase, label: 'Jobs' },
  { to: '/resumes', icon: FileText, label: 'Resumes' },
  { to: '/upload', icon: Upload, label: 'Upload' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isDemoMode, setIsDemoMode] = useState<boolean | null>(null)

  useEffect(() => {
    api.get('/screening/mode').then(r => setIsDemoMode(r.data.isDemoMode)).catch(() => {})
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-white border-r border-slate-100 flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center shadow-glow-brand">
              <Zap size={16} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 leading-tight">HireIQ</p>
              <p className="text-[10px] text-slate-400 leading-tight">AI Resume Screening</p>
            </div>
          </div>
        </div>

        {/* Demo mode badge */}
        {isDemoMode === true && (
          <div className="mx-3 mt-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
            <FlaskConical size={13} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[10px] font-semibold text-amber-700">Demo Mode</p>
              <p className="text-[10px] text-amber-600 leading-tight">Mock AI — no API key needed</p>
            </div>
          </div>
        )}
        {isDemoMode === false && (
          <div className="mx-3 mt-3 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2">
            <Zap size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[10px] font-semibold text-emerald-700">Real AI Active</p>
              <p className="text-[10px] text-emerald-600 leading-tight">Powered by Claude</p>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                isActive
                  ? 'bg-brand-50 text-brand-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              )}
            >
              {({ isActive }) => (
                <>
                  <Icon size={17} className={isActive ? 'text-brand-500' : 'text-slate-400 group-hover:text-slate-600'} />
                  <span>{label}</span>
                  {isActive && <ChevronRight size={14} className="ml-auto text-brand-400" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-slate-100">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
              <User size={14} className="text-brand-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate capitalize">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 text-slate-400 transition-colors"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
