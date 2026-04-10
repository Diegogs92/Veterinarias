import { useState, useEffect, useRef } from 'react'
import { Camera, X, Link } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import SpeciesIcon from '../../components/ui/SpeciesIcon'
import { useApp } from '../../context/AppContext'

const EMPTY = {
  name: '', species: 'perro', breed: '', birthDate: '', weight: '',
  ownerId: '', photo: '', allergies: '', observations: '',
}

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

const MAX_SIZE = 2 * 1024 * 1024 // 2 MB

export default function PetForm({ isOpen, onClose, onSave, initial = null, defaultOwnerId = '' }) {
  const { owners } = useApp()
  const [form, setForm] = useState(initial || { ...EMPTY, ownerId: defaultOwnerId })
  const [errors, setErrors] = useState({})
  const [photoError, setPhotoError] = useState('')
  const [urlMode, setUrlMode] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setForm(initial || { ...EMPTY, ownerId: defaultOwnerId })
      setErrors({})
      setPhotoError('')
      setUrlMode(false)
    }
  }, [isOpen, initial, defaultOwnerId])

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setErrors(er => ({ ...er, [field]: '' }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_SIZE) {
      setPhotoError('La imagen no puede superar 2 MB.')
      return
    }
    setPhotoError('')
    const reader = new FileReader()
    reader.onload = (ev) => setForm(f => ({ ...f, photo: ev.target.result }))
    reader.readAsDataURL(file)
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim())    errs.name    = 'Requerido'
    if (!form.ownerId)        errs.ownerId = 'Seleccioná un dueño'
    return errs
  }

  const handleSave = () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSave({ ...form, weight: form.weight ? parseFloat(form.weight) : null })
    onClose()
  }

  const hasPhoto = !!form.photo

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? 'Editar mascota' : 'Nueva mascota'}
      size="lg"
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn--primary" onClick={handleSave}>
            {initial ? 'Guardar cambios' : 'Agregar mascota'}
          </button>
        </>
      }
    >
      {/* Photo upload area */}
      <div className="form-group" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* Preview */}
        <div
          style={{
            width: 80, height: 80, borderRadius: 'var(--r-md)', flexShrink: 0,
            background: 'var(--bg-input)', border: '1.5px dashed var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', position: 'relative',
          }}
        >
          {hasPhoto ? (
            <img src={form.photo} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setForm(f => ({ ...f, photo: '' }))} />
          ) : (
            <span style={{ color: 'var(--text-tertiary)' }}>
              <SpeciesIcon species={form.species} size={32} strokeWidth={1.25} />
            </span>
          )}
        </div>

        {/* Controls */}
        <div style={{ flex: 1 }}>
          <label className="form-label">Foto</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            <button
              type="button"
              className="btn btn--subtle btn--sm"
              onClick={() => fileRef.current?.click()}
              style={{ display: 'flex', alignItems: 'center', gap: 5 }}
            >
              <Camera size={13} strokeWidth={2} /> Subir imagen
            </button>
            <button
              type="button"
              className={`btn btn--sm ${urlMode ? 'btn--primary' : 'btn--subtle'}`}
              onClick={() => setUrlMode(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: 5 }}
            >
              <Link size={13} strokeWidth={2} /> URL
            </button>
            {hasPhoto && (
              <button
                type="button"
                className="btn btn--subtle btn--sm"
                onClick={() => { setForm(f => ({ ...f, photo: '' })); setPhotoError('') }}
                style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--red)' }}
              >
                <X size={13} strokeWidth={2} /> Quitar
              </button>
            )}
          </div>

          {urlMode && (
            <input
              className="form-input"
              value={form.photo}
              onChange={(e) => { setForm(f => ({ ...f, photo: e.target.value })); setPhotoError('') }}
              placeholder="https://..."
              style={{ fontSize: 13 }}
            />
          )}
          {photoError && <span style={{ color: 'var(--red)', fontSize: 12 }}>{photoError}</span>}

          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
        </div>
      </div>

      <div className="form-row form-row--2">
        <div className="form-group">
          <label className="form-label">Nombre *</label>
          <input className={`form-input${errors.name ? ' form-input--error' : ''}`} value={form.name} onChange={set('name')} placeholder="Nombre de la mascota" />
          {errors.name && <span style={{ color: 'var(--red)', fontSize: 12 }}>{errors.name}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Especie</label>
          <select className="form-input" value={form.species} onChange={set('species')}>
            {SPECIES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <div className="form-row form-row--2">
        <div className="form-group">
          <label className="form-label">Raza</label>
          <input className="form-input" value={form.breed} onChange={set('breed')} placeholder="Ej: Labrador, Siamés..." />
        </div>
        <div className="form-group">
          <label className="form-label">Dueño *</label>
          <select className={`form-input${errors.ownerId ? ' form-input--error' : ''}`} value={form.ownerId} onChange={set('ownerId')}>
            <option value="">Seleccionar dueño...</option>
            {owners.items.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          {errors.ownerId && <span style={{ color: 'var(--red)', fontSize: 12 }}>{errors.ownerId}</span>}
        </div>
      </div>

      <div className="form-row form-row--2">
        <div className="form-group">
          <label className="form-label">Fecha de nacimiento</label>
          <input className="form-input" type="date" value={form.birthDate} onChange={set('birthDate')} />
        </div>
        <div className="form-group">
          <label className="form-label">Peso (kg)</label>
          <input className="form-input" type="number" step="0.1" min="0" value={form.weight} onChange={set('weight')} placeholder="0.0" />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Alergias</label>
        <input className="form-input" value={form.allergies} onChange={set('allergies')} placeholder="Ninguna, polen, antibióticos..." />
      </div>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Observaciones</label>
        <textarea className="form-input" value={form.observations} onChange={set('observations')} placeholder="Notas adicionales..." rows={3} />
      </div>
    </Modal>
  )
}
