import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function SidePanel({ isOpen, onClose, title, children, width = 400 }) {
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, zIndex: 190, background: 'rgba(0,0,0,0.18)' }}
        />
      )}
      <div
        style={{
          position: 'fixed', top: 0, right: isOpen ? 0 : -(width + 40),
          width, height: '100dvh',
          background: 'var(--bg)', borderLeft: '1px solid var(--border)',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.13)',
          zIndex: 200, transition: 'right 0.28s cubic-bezier(0.4,0,0.2,1)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{title}</h3>
          <button className="btn btn--subtle btn--icon" onClick={onClose} style={{ width: 34, height: 34 }}>
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {children}
        </div>
      </div>
    </>
  )
}
