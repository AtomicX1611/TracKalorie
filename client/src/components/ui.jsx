import { cn } from '../lib/utils'

// ── Button ──────────────────────────────────────────────────────────────────
export function Button({ children, variant = 'primary', size = 'md', className, loading, ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer'
  const variants = {
    primary:   'bg-accent text-background hover:bg-accent-dim active:scale-95',
    secondary: 'bg-surface-elevated border border-border text-foreground hover:border-accent/50 hover:bg-surface active:scale-95',
    ghost:     'text-muted-foreground hover:text-foreground hover:bg-surface-elevated active:scale-95',
    danger:    'bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20 active:scale-95',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  }
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} disabled={loading || props.disabled} {...props}>
      {loading && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin-slow" />}
      {children}
    </button>
  )
}

// ── Input ───────────────────────────────────────────────────────────────────
export function Input({ label, error, className, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm text-muted-foreground font-medium">{label}</label>}
      <input
        className={cn(
          'w-full px-3 py-2 rounded-lg text-sm bg-surface border border-border focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all',
          error && 'border-destructive focus:border-destructive focus:ring-destructive/10',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

// ── Select ──────────────────────────────────────────────────────────────────
export function Select({ label, error, children, className, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm text-muted-foreground font-medium">{label}</label>}
      <select
        className={cn(
          'w-full px-3 py-2 rounded-lg text-sm bg-surface border border-border focus:border-accent outline-none transition-all',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

// ── Badge ───────────────────────────────────────────────────────────────────
export function Badge({ children, variant = 'default', className }) {
  const variants = {
    default:  'bg-surface-elevated text-muted-foreground border border-border',
    accent:   'bg-accent/10 text-accent border border-accent/20',
    warning:  'bg-warning/10 text-warning border border-warning/20',
    danger:   'bg-destructive/10 text-destructive border border-destructive/20',
    ai:       'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  }
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  )
}

// ── Card ────────────────────────────────────────────────────────────────────
export function Card({ children, className, elevated, ...props }) {
  return (
    <div className={cn(elevated ? 'card-elevated' : 'card', 'p-4', className)} {...props}>
      {children}
    </div>
  )
}

// ── Spinner ─────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md', className }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }
  return (
    <div className={cn('border-2 border-border border-t-accent rounded-full animate-spin-slow', sizes[size], className)} />
  )
}

// ── Modal ───────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, width = 'max-w-lg' }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative z-10 w-full card-elevated animate-fade-in', width)}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

// ── Empty state ─────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      {Icon && <Icon className="w-10 h-10 text-muted-foreground/40" />}
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {description && <p className="text-xs text-muted-foreground/60 max-w-xs">{description}</p>}
      {action}
    </div>
  )
}

// ── Progress bar ─────────────────────────────────────────────────────────────
export function ProgressBar({ value, max, color = '#7CFFB2', className }) {
  const p = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const over = value > max && max > 0
  return (
    <div className={cn('h-1.5 rounded-full bg-surface-elevated overflow-hidden', className)}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${p}%`, background: over ? '#EF4444' : color }}
      />
    </div>
  )
}

// ── Section header ───────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
