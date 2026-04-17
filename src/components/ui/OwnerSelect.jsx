import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useApp } from '../../context/AppContext'

const EMPTY = { name: '', phone: '', email: '' }

/**
 * OwnerSelect — select de dueño con botón "+ Nuevo" que abre panel inline.
 * Props: value, onChange(id), error, required, disabled, label
 */
export default function OwnerSelect({
  value, onChange, error,
  required = false, disabled = false, label = 'Dueño',
}) {
  const { owners } = useApp()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [errs, setErrs] = useState({})

  const set = f => e => {
    setForm(p => ({ ...p, [f]: e.target.value }))
    setErrs(p => ({ ...p, [f]: '' }))
  }

  const handleAdd = () => {
    const e = {}
    if (!form.name.trim())  e.name  = 'Requerido'
    if (!form.phone.trim()) e.phone = 'Requerido'
    if (Object.keys(e).length) { setErrs(e); return }
    const created = owners.add({ ...form, discount: 0 })
    onChange(created.id)
    setShowAdd(false)
    setForm(EMPTY)
    setErrs({})
  }

  const close = () => { setShowAdd(false); setForm(EMPTY); setErrs({}) }

  return (
    <div className="form-group">
      <label className="form-label">{label}{required && ' *'}</label>
      <div style={{ display: 'flex', gap: 6 }}>
        <select
          className={`form-input${error ? ' form-input--error' : ''}`}
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          style={{ flex: 1 }}
        >
          <option value="">Seleccionar dueño...</option>
          {[...owners.items].sort((a, b) => a.name.localeCompare(b.name)).map(o => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
        {!disabled && (
          <button
            type="button"
            className="btn btn--subtle btn--sm"
            onClick={() => setShowAdd(v => !v)}
            style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}
          >
            <Plus size={13} strokeWidth={2.5} />
            Nuevo
          </button>
        )}
      </div>
      {error && <span style={{ color: 'var(--red)', fontSize: 12 }}>{error}</span>}

      {showAdd && (
        <div style={{
          marginTop: 8, padding: '14px 16px',
          background: 'var(--surface-2)',
          border: '1px solid var(--vet-teal)',
          borderRadius: 8,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--vet-teal)' }}>Nuevo dueño</span>
            <button type="button" className="btn btn--subtle btn--icon btn--sm" onClick={close}>
              <X size={14} strokeWidth={2} />
            </button>
          </div>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: 12 }}>Nombre *</label>
            <input
              className={`form-input${errs.name ? ' form-input--error' : ''}`}
              value={form.name} onChange={set('name')}
              placeholder="Nombre completo" autoFocus style={{ fontSize: 13 }}
            />
            {errs.name && <span style={{ color: 'var(--red)', fontSize: 11 }}>{errs.name}</span>}
          </div>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: 12 }}>Teléfono *</label>
            <input
              className={`form-input${errs.phone ? ' form-input--error' : ''}`}
              value={form.phone} onChange={set('phone')}
              placeholder="11-1234-5678" style={{ fontSize: 13 }}
            />
            {errs.phone && <span style={{ color: 'var(--red)', fontSize: 11 }}>{errs.phone}</span>}
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label" style={{ fontSize: 12 }}>Email</label>
            <input
              className="form-input" type="email"
              value={form.email} onChange={set('email')}
              placeholder="correo@email.com" style={{ fontSize: 13 }}
            />
          </div>
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={handleAdd}
            style={{ width: '100%' }}
          >
            Agregar dueño
          </button>
        </div>
      )}
    </div>
  )
}
