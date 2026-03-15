import clsx from 'clsx'

// ── Avatar ────────────────────────────────────────────────────────────────────
export function Avatar({ src, name, size = 'md', verified = false }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-12 h-12 text-sm', lg: 'w-16 h-16 text-lg', xl: 'w-24 h-24 text-2xl' }
  return (
    <div className="relative inline-block">
      {src ? (
        <img src={src} alt={name}
          className={clsx('rounded-full object-cover border-2 border-primary-200', sizes[size])} />
      ) : (
        <div className={clsx('rounded-full bg-primary-500 flex items-center justify-center font-bold text-white border-2 border-primary-300', sizes[size])}>
          {name?.[0]?.toUpperCase() || '?'}
        </div>
      )}
      {verified && (
        <span className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 rounded-full p-0.5">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
      )}
    </div>
  )
}

// ── CompatibilityBar ─────────────────────────────────────────────────────────
export function CompatibilityBar({ score }) {
  const color = score >= 90 ? 'bg-emerald-500' : score >= 80 ? 'bg-primary-500' : 'bg-yellow-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-orange-100 rounded-full overflow-hidden">
        <div className={clsx('h-full rounded-full transition-all', color)} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-bold font-mono text-brand-dark w-10 text-right">{score}%</span>
    </div>
  )
}

// ── StarRating ────────────────────────────────────────────────────────────────
export function StarRating({ value, max = 5, onChange }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <button key={i}
          type="button"
          onClick={() => onChange?.(i + 1)}
          className={clsx('text-2xl transition-colors', i < value ? 'text-primary-500' : 'text-orange-200',
            onChange && 'hover:text-primary-400 cursor-pointer')}
        >★</button>
      ))}
    </div>
  )
}

// ── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ children, variant = 'orange' }) {
  const variants = {
    orange: 'bg-primary-100 text-primary-700',
    green:  'bg-emerald-100 text-emerald-700',
    red:    'bg-red-100 text-red-700',
    gray:   'bg-gray-100 text-gray-600',
    dark:   'bg-brand-dark text-brand-cream',
  }
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', variants[variant])}>
      {children}
    </span>
  )
}

// ── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className={clsx('border-4 border-orange-200 border-t-primary-500 rounded-full animate-spin', sizes[size])} />
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      {icon && <div className="text-5xl mb-4">{icon}</div>}
      <h3 className="font-display font-bold text-xl text-brand-dark mb-2">{title}</h3>
      {description && <p className="text-orange-400 max-w-sm">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
        {title && (
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-xl">{title}</h2>
            <button onClick={onClose} className="p-1 hover:bg-orange-50 rounded-lg transition-colors text-orange-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
