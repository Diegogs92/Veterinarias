import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'

const ICONS = {
  ok:     <CheckCircle2 size={18} strokeWidth={2.5} />,
  warn:   <AlertTriangle size={18} strokeWidth={2.5} />,
  danger: <XCircle size={18} strokeWidth={2.5} />,
}

export default function Toast({ toast }) {
  if (!toast) return null
  return (
    <div className="toast-wrap">
      <div className={`toast toast--${toast.type}`}>
        <span style={{ flexShrink: 0 }}>{ICONS[toast.type]}</span>
        <span style={{ fontWeight: 600, fontSize: 14 }}>{toast.message}</span>
      </div>
    </div>
  )
}
