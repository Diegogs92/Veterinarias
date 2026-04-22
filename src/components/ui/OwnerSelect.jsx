import { useState, useRef, useMemo } from 'react'
import { Plus, X, Search } from 'lucide-react'
import { useApp } from '../../context/AppContext'

const EMPTY = { name: '', apellido: '', dni: '', phone: '', email: '' }

export default function OwnerSelect({
  value, onChange, error,
  required = false, disabled = false, label = 'Dueño', onAddNew,
}) {
  const { owners } = useApp()
  const [showAdd, setShowAdd]       = useState(false)
  const [showDrop, setShowDrop]     = useState(false)
  const [search, setSearch]         = useState('')
  const [form, setForm]             = useState(EMPTY)
  const [errs, setErrs]             = useState({})
  const inputRef                    = useRef(null)

  const set = f => e => {
    setForm(p => ({ ...p, [f]: e.target.value }))
    setErrs(p => ({ ...p, [f]: '' }))
  }

  const selected = owners.items.find(o => o.id === value)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return [...owners.items].sort((a, b) => a.name.localeCompare(b.name)).slice(0, 8)
    return owners.items.filter(o => {
      const full = `${o.name} ${o.apellido || ''} ${o.dni || ''}`.toLowerCase()
      return full.includes(q)
    }).sort((a, b) => a.name.localeCompare(b.name)).slice(0, 8)
  }, [owners.items, search])

  const handleSelect = (id) => {
    onChange(id)
    setSearch('')
    setShowDrop(false)
  }

  const handleClear = () => { onChange(''); setSearch(''); inputRef.current?.focus() }

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

  const ownerLabel = (o) => `${o.name}${o.apellido ? ` ${o.apellido}` : ''}${o.dni ? ` · DNI ${o.dni}` : ''}`

  return (
    <div className="form-group">
      <label className="form-label">{label}{required && ' *'}</label>
      <div style={{ display: 'flex', gap: 6, position: 'relative' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
          {selected && !showDrop ? (
            <div
              className={`form-input${error ? ' form-input--error' : ''}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 36, cursor: disabled ? 'default' : 'pointer', userSelect: 'none' }}
              onClick={() => { if (!disabled) { setShowDrop(true); setSearch(''); setTimeout(() => inputRef.current?.focus(), 0) } }}
            >
              <span style={{ fontWeight: 500 }}>{ownerLabel(selected)}</span>
              {!disabled && <X size={14} strokeWidth={2.5} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} onClick={e => { e.stopPropagation(); handleClear() }} />}
            </div>
          ) : (
            <input
              ref={inputRef}
              className={`form-input${error ? ' form-input--error' : ''}`}
              style={{ paddingLeft: 36 }}
              placeholder={disabled ? '—' : 'Buscar por nombre, apellido o DNI...'}
              value={search}
              disabled={disabled}
              onChange={e => { setSearch(e.target.value); setShowDrop(true) }}
              onFocus={() => setShowDrop(true)}
              onBlur={() => setTimeout(() => setShowDrop(false), 150)}
            />
          )}
          {showDrop && !disabled && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
              background: 'var(--bg-modal)', border: '1px solid var(--border)',
              borderRadius: 8, marginTop: 4, maxHeight: 220, overflowY: 'auto',
              boxShadow: '0 4px 16px rgba(0,0,0,.12)',
            }}>
              {filtered.length === 0
                ? <div style={{ padding: '12px 16px', color: 'var(--text-tertiary)', fontSize: 13 }}>Sin resultados</div>
                : filtered.map(o => (
                  <button key={o.id} type="button" onMouseDown={() => handleSelect(o.id)} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                    width: '100%', padding: '9px 14px', background: 'none', border: 'none',
                    borderBottom: '1px solid var(--border-2)', cursor: 'pointer', textAlign: 'left',
                  }}>
                    <span style={{ fontWeight: 500, fontSize: 14, color: 'var(--text-primary)' }}>
                      {o.name}{o.apellido ? ` ${o.apellido}` : ''}
                    </span>
                    {(o.dni || o.phone) && (
                      <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 1 }}>
                        {o.dni ? `DNI ${o.dni}` : ''}{o.dni && o.phone ? ' · ' : ''}{o.phone || ''}
                      </span>
                    )}
                  </button>
                ))
              }
            </div>
          )}
        </div>
        {!disabled && (
          <button
            type="button"
            className="btn btn--subtle btn--sm"
            onClick={() => onAddNew ? onAddNew() : setShowAdd(v => !v)}
            style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}
          >
            <Plus size={13} strokeWidth={2.5} />
            Nuevo
          </button>
        )}
      </div>
      {error && <span className="form-error">{error}</span>}

      {showAdd && !onAddNew && (
        <div style={{
          marginTop: 8, padding: '14px 16px',
          background: 'var(--bg-sub)',
          border: '1px solid var(--accent)',
          borderRadius: 'var(--r-md)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--accent)' }}>Nuevo dueño</span>
            <button type="button" className="btn btn--subtle btn--icon" onClick={close} style={{ width: 36, height: 36 }}>
              <X size={20} strokeWidth={2} />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: 12 }}>Nombre *</label>
              <input
                className={`form-input${errs.name ? ' form-input--error' : ''}`}
                value={form.name} onChange={set('name')}
                placeholder="Nombre" autoFocus style={{ fontSize: 13 }}
              />
              {errs.name && <span className="form-error" style={{ fontSize: 11 }}>{errs.name}</span>}
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: 12 }}>Apellido</label>
              <input className="form-input" value={form.apellido} onChange={set('apellido')} placeholder="Apellido" style={{ fontSize: 13 }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: 12 }}>DNI</label>
              <input className="form-input" value={form.dni} onChange={set('dni')} placeholder="12345678" style={{ fontSize: 13 }} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: 12 }}>Teléfono *</label>
              <input
                className={`form-input${errs.phone ? ' form-input--error' : ''}`}
                value={form.phone} onChange={set('phone')}
                placeholder="11-1234-5678" style={{ fontSize: 13 }}
              />
              {errs.phone && <span className="form-error" style={{ fontSize: 11 }}>{errs.phone}</span>}
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label" style={{ fontSize: 12 }}>Email</label>
            <input className="form-input" type="email" value={form.email} onChange={set('email')} placeholder="correo@email.com" style={{ fontSize: 13 }} />
          </div>
          <button type="button" className="btn btn--primary btn--sm" onClick={handleAdd} style={{ width: '100%' }}>
            Agregar dueño
          </button>
        </div>
      )}
    </div>
  )
}
