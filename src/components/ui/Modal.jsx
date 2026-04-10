import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ isOpen, onClose, title, children, footer, size = '', className = '' }) {
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className={`modal ${size ? `modal--${size}` : ''} ${className}`} role="dialog" aria-modal="true">
        <div className="modal__header">
          <h2 className="modal__title">{title}</h2>
          <button className="btn btn--subtle btn--icon btn--sm" onClick={onClose} aria-label="Cerrar">
            <X size={16} strokeWidth={2} />
          </button>
        </div>
        <div className="modal__body">
          {children}
        </div>
        {footer && (
          <div className="modal__footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
