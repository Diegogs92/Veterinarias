import { useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react'

export default function StepWizard({
  isOpen, onClose, title, steps, currentStep,
  onNext, onPrev, onSave, size = 'lg', children,
  saveLabel = 'Guardar',
}) {
  useEffect(() => {
    if (!isOpen) return
    const fn = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const isFirst = currentStep === 0
  const isLast  = currentStep === steps.length - 1

  return (
    <div
      className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={`modal${size === 'lg' ? ' modal--lg' : ''}`}>

        {/* Header */}
        <div className="modal__header">
          <div className="modal__title">{title}</div>
          <button className="btn btn--subtle btn--icon" onClick={onClose} style={{ width: 48, height: 48 }}>
            <X size={28} strokeWidth={2} />
          </button>
        </div>

        {/* Progress */}
        <div style={{ padding: '16px 24px 14px', borderBottom: '1px solid var(--border-2)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            {steps.map((label, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', flex: i < steps.length - 1 ? 1 : 'none' }}>
                {/* Step item */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, fontWeight: 700,
                    background: i < currentStep ? 'var(--accent)' : i === currentStep ? 'var(--accent)' : 'var(--bg-sub)',
                    border: `2.5px solid ${i <= currentStep ? 'var(--accent)' : 'var(--border)'}`,
                    color: i <= currentStep ? 'white' : 'var(--text-tertiary)',
                    boxShadow: i === currentStep ? '0 0 0 4px color-mix(in srgb, var(--accent) 15%, transparent)' : 'none',
                    transition: 'all var(--t-normal)',
                  }}>
                    {i < currentStep ? <Check size={17} strokeWidth={3} /> : i + 1}
                  </div>
                  <span style={{
                    fontSize: 13, whiteSpace: 'nowrap', fontWeight: i === currentStep ? 700 : 500,
                    color: i === currentStep ? 'var(--text-primary)'
                      : i < currentStep ? 'var(--accent)'
                      : 'var(--text-tertiary)',
                    letterSpacing: i === currentStep ? 0.1 : 0,
                  }}>
                    {label}
                  </span>
                </div>
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div style={{
                    flex: 1, height: 2.5, minWidth: 20, marginTop: 15, borderRadius: 2,
                    background: i < currentStep ? 'var(--accent)' : 'var(--border)',
                    transition: 'background var(--t-normal)',
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contenido del paso */}
        <div className="modal__body">{children}</div>

        {/* Footer */}
        <div className="modal__footer" style={{ justifyContent: 'space-between' }}>
          <button
            className="btn"
            onClick={isFirst ? onClose : onPrev}
            style={isFirst ? {
              background: 'var(--danger-3)', color: 'var(--danger)', border: '1px solid transparent',
            } : {}}
            onMouseEnter={isFirst ? e => { e.currentTarget.style.background = 'var(--danger)'; e.currentTarget.style.color = 'white' } : undefined}
            onMouseLeave={isFirst ? e => { e.currentTarget.style.background = 'var(--danger-3)'; e.currentTarget.style.color = 'var(--danger)' } : undefined}
          >
            {isFirst
              ? 'Cancelar'
              : <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ChevronLeft size={20} /> Anterior</span>
            }
          </button>
          <button className="btn btn--primary" onClick={isLast ? onSave : onNext}>
            {isLast
              ? saveLabel
              : <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>Siguiente <ChevronRight size={20} /></span>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
