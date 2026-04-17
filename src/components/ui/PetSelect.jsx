import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import OwnerSelect from './OwnerSelect'

const SPECIES = [
  { value: 'perro',   label: 'Perro' },
  { value: 'gato',    label: 'Gato' },
  { value: 'conejo',  label: 'Conejo' },
  { value: 'pajaro',  label: 'Pájaro' },
  { value: 'hamster', label: 'Hámster' },
  { value: 'pez',     label: 'Pez' },
  { value: 'tortuga', label: 'Tortuga' },
  { value: 'otro',    label: 'Otro' },
]

/**
 * PetSelect — select de mascota con botón "+ Nueva" que abre panel inline.
 * Props:
 *   value, onChange(id), error, required, disabled, label
 *   ownerId — si se pasa: filtra la lista por dueño y pre-rellena el dueño al crear
 *   placeholder — texto de la primera opción (default "Seleccionar mascota...")
 */
export default function PetSelect({
  value, onChange, error,
  required = false, disabled = false,
  label = 'Mascota', ownerId = '',
  placeholder = 'Seleccionar mascota...',
}) {
  const { pets, owners } = useApp()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', species: 'perro', breed: '', ownerId: '' })
  const [errs, setErrs] = useState({})

  const displayPets = ownerId
    ? pets.items.filter(p => p.ownerId === ownerId)
    : pets.items

  const set = f => e => {
    setForm(p => ({ ...p, [f]: e.target.value }))
    setErrs(p => ({ ...p, [f]: '' }))
  }

  const handleOpen = () => {
    setForm({ name: '', species: 'perro', breed: '', ownerId: ownerId || '' })
    setErrs({})
    setShowAdd(true)
  }

  const handleAdd = () => {
    const e = {}
    if (!form.name.trim()) e.name    = 'Requerido'
    if (!form.ownerId)     e.ownerId = 'Seleccioná un dueño'
    if (Object.keys(e).length) { setErrs(e); return }
    const created = pets.add(form)
    onChange(created.id)
    setShowAdd(false)
    setErrs({})
  }

  const close = () => { setShowAdd(false); setErrs({}) }

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
          <option value="">{placeholder}</option>
          {displayPets.map(p => {
            const owner = owners.find(p.ownerId)
            return (
              <option key={p.id} value={p.id}>
                {p.name}{!ownerId ? ` (${owner?.name || '?'})` : ''}
              </option>
            )
          })}
        </select>
        {!disabled && (
          <button
            type="button"
            className="btn btn--subtle btn--sm"
            onClick={handleOpen}
            style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}
          >
            <Plus size={13} strokeWidth={2.5} />
            Nueva
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
            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--vet-teal)' }}>Nueva mascota</span>
            <button type="button" className="btn btn--subtle btn--icon btn--sm" onClick={close}>
              <X size={14} strokeWidth={2} />
            </button>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: 12 }}>Nombre *</label>
            <input
              className={`form-input${errs.name ? ' form-input--error' : ''}`}
              value={form.name} onChange={set('name')}
              placeholder="Nombre de la mascota" autoFocus style={{ fontSize: 13 }}
            />
            {errs.name && <span style={{ color: 'var(--red)', fontSize: 11 }}>{errs.name}</span>}
          </div>

          <div className="form-row form-row--2">
            <div className="form-group">
              <label className="form-label" style={{ fontSize: 12 }}>Especie</label>
              <select className="form-input" value={form.species} onChange={set('species')} style={{ fontSize: 13 }}>
                {SPECIES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: 12 }}>Raza</label>
              <input
                className="form-input" value={form.breed} onChange={set('breed')}
                placeholder="Labrador, Siamés..." style={{ fontSize: 13 }}
              />
            </div>
          </div>

          {/* When there's no owner context, show OwnerSelect (which also supports creating owners) */}
          {!ownerId && (
            <OwnerSelect
              value={form.ownerId}
              onChange={id => { setForm(f => ({ ...f, ownerId: id })); setErrs(er => ({ ...er, ownerId: '' })) }}
              error={errs.ownerId}
              required
              label="Dueño *"
            />
          )}

          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={handleAdd}
            style={{ width: '100%', marginTop: 4 }}
          >
            Agregar mascota
          </button>
        </div>
      )}
    </div>
  )
}
