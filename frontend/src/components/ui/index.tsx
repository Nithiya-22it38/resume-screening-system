import React from 'react'
import clsx from 'clsx'
import type { ResumeStatus, ScreeningStatus } from '../../types'

// ── Score Ring ───────────────────────────────────────
interface ScoreRingProps { score: number; size?: number; strokeWidth?: number; className?: string }
export const ScoreRing: React.FC<ScoreRingProps> = ({ score, size = 56, strokeWidth = 5, className }) => {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const filled = (score / 100) * circumference
  const color = score >= 75 ? '#10b981' : score >= 55 ? '#f59e0b' : '#ef4444'
  return (
    <div className={clsx('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={`${filled} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <span className="absolute text-sm font-semibold" style={{ color }}>{score}</span>
    </div>
  )
}

// ── Status Badge ─────────────────────────────────────
interface StatusBadgeProps { status: ResumeStatus | ScreeningStatus; className?: string }
export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const map: Record<string, string> = {
    shortlisted: 'badge-shortlisted',
    review: 'badge-review',
    rejected: 'badge-rejected',
    pending: 'badge-pending',
    hired: 'badge-hired',
    processing: 'badge bg-blue-50 text-blue-700 border border-blue-200',
    completed: 'badge bg-emerald-50 text-emerald-700 border border-emerald-200',
    failed: 'badge bg-red-50 text-red-700 border border-red-200',
  }
  const labels: Record<string, string> = {
    shortlisted: 'Shortlisted', review: 'Review', rejected: 'Rejected',
    pending: 'Pending', hired: 'Hired', processing: 'Processing',
    completed: 'Screened', failed: 'Failed',
  }
  return <span className={clsx(map[status] || 'badge badge-pending', className)}>{labels[status] || status}</span>
}

// ── Skeleton ─────────────────────────────────────────
export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={clsx('skeleton', className)} />
)

// ── Empty State ──────────────────────────────────────
interface EmptyStateProps { icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode }
export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
    {icon && <div className="mb-4 text-slate-300">{icon}</div>}
    <h3 className="text-base font-semibold text-slate-700 mb-1">{title}</h3>
    {description && <p className="text-sm text-slate-400 max-w-xs mb-5">{description}</p>}
    {action}
  </div>
)

// ── Page Header ───────────────────────────────────────
interface PageHeaderProps { title: string; subtitle?: string; actions?: React.ReactNode }
export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions }) => (
  <div className="flex items-start justify-between gap-4 px-8 pt-8 pb-6">
    <div>
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
  </div>
)

// ── Stat Card ─────────────────────────────────────────
interface StatCardProps { label: string; value: string | number; icon?: React.ReactNode; color?: string; trend?: string }
export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color = 'text-slate-900', trend }) => (
  <div className="card p-5">
    <div className="flex items-center justify-between mb-3">
      <p className="text-sm text-slate-500 font-medium">{label}</p>
      {icon && <div className="text-slate-300">{icon}</div>}
    </div>
    <p className={clsx('text-2xl font-semibold', color)}>{value}</p>
    {trend && <p className="text-xs text-slate-400 mt-1">{trend}</p>}
  </div>
)

// ── Loading Spinner ───────────────────────────────────
export const Spinner: React.FC<{ size?: number; className?: string }> = ({ size = 20, className }) => (
  <div
    className={clsx('rounded-full border-2 border-brand-500 border-t-transparent animate-spin', className)}
    style={{ width: size, height: size }}
  />
)

// ── Toast ─────────────────────────────────────────────
interface ToastProps { message: string; type?: 'success' | 'error' | 'info'; onClose: () => void }
export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
  const colors = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-brand-50 border-brand-200 text-brand-800',
  }
  return (
    <div className={clsx('fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium animate-slide-in-right max-w-sm', colors[type])}>
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="opacity-60 hover:opacity-100 ml-2">✕</button>
    </div>
  )
}

// ── Confirm Dialog ────────────────────────────────────
interface ConfirmDialogProps {
  title: string; message: string
  onConfirm: () => void; onCancel: () => void
  confirmLabel?: string; danger?: boolean
}
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ title, message, onConfirm, onCancel, confirmLabel = 'Confirm', danger }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in">
    <div className="card w-full max-w-sm mx-4 p-6 animate-slide-up">
      <h3 className="text-base font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onCancel} className="btn-secondary">Cancel</button>
        <button onClick={onConfirm} className={danger ? 'btn-danger' : 'btn-primary'}>{confirmLabel}</button>
      </div>
    </div>
  </div>
)
