import { X } from 'lucide-react'

export default function InlinePanel({ isOpen, onClose, title, children, width, headerColor }) {
  if (!isOpen) return null

  return (
    <div
      style={{
        width: width || '100%',
        flexShrink: 0,
        background: 'var(--bg-elev)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        overflow: 'hidden',
        alignSelf: 'flex-start',
        position: 'sticky',
        top: 0,
        maxHeight: 'calc(100vh - 120px)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        background: headerColor || undefined,
      }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{title}</h3>
        <button className="btn btn--subtle btn--icon" onClick={onClose} style={{ width: 30, height: 30 }}>
          <X size={16} strokeWidth={2.5} />
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {children}
      </div>
    </div>
  )
}
