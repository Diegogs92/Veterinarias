import { useState, useEffect, useRef } from 'react'
import { Camera, X, Link } from 'lucide-react'
import StepWizard from '../../components/ui/StepWizard'
import SpeciesIcon from '../../components/ui/SpeciesIcon'
import OwnerSelect from '../../components/ui/OwnerSelect'
import OwnerForm from '../owners/OwnerForm'
import { useApp } from '../../context/AppContext'

const EMPTY = { name: '', species: 'perro', breed: '', birthDate: '', weight: '', ownerId: '', photo: '', allergies: '', observations: '' }

const SPECIES = [
  { value: 'perro',   label: '🐕 Perro'   },
  { value: 'gato',    label: '🐈 Gato'    },
  { value: 'conejo',  label: '🐇 Conejo'  },
  { value: 'pajaro',  label: '🦜 Pájaro'  },
  { value: 'hamster', label: '🐹 Hámster' },
  { value: 'pez',     label: '🐟 Pez'     },
  { value: 'tortuga', label: '🐢 Tortuga' },
  { value: 'otro',    label: '🐾 Otro'    },
]

const STEPS = ['Datos básicos', 'Salud']

export default function PetForm({ isOpen, onClose, onSave, initial = null, defaultOwnerId = '' }) {
  const { owners } = useApp()
  const [form, setForm]         = useState(EMPTY)
  const [errors, setErrors]     = useState({})
  const [photoError, setPhotoError] = useState('')
  const [urlMode, setUrlMode]   = useState(false)
  const [step, setStep]         = useState(0)
  const [ownerFormOpen, setOwnerFormOpen] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setStep(0)
      setErrors({})
      setPhotoError('')
      setUrlMode(false)
      setForm(initial || { ...EMPTY, ownerId: defaultOwnerId })
    }
  }, [isOpen, initial, defaultOwnerId])

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setErrors(er => ({ ...er, [field]: '' }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setPhotoError('La imagen no puede superar 2 MB.'); return }
    setPhotoError('')
    const reader = new FileReader()
    reader.onload = (ev) => setForm(f => ({ ...f, photo: ev.target.result }))
    reader.readAsDataURL(file)
  }

  const validateStep = (s) => {
    const errs = {}
    if (s === 0) {
      if (!form.name.trim()) errs.name    = 'Requerido'
      if (!form.ownerId)     errs.ownerId = 'Seleccioná un dueño'
    }
    return errs
  }

  const handleNext = () => {
    const errs = validateStep(step)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setStep(s => s + 1)
  }

  const handleSave = () => {
    onSave({ ...form, weight: form.weight ? parseFloat(form.weight) : null })
    onClose()
  }

  const handleAddOwner = (ownerData) => {
    const newOwner = owners.add(ownerData)
    setForm(f => ({ ...f, ownerId: newOwner.id }))
    setErrors(er => ({ ...er, ownerId: '' }))
    setOwnerFormOpen(false)
  }

  const hasPhoto = !!form.photo

  return (
    <>
    <StepWizard
      isOpen={isOpen} onClose={onClose}
      title={initial ? 'Editar mascota' : 'Nueva mascota'}
      steps={STEPS} currentStep={step}
      onNext={handleNext} onPrev={() => setStep(s => s - 1)} onSave={handleSave}
      saveLabel={initial ? 'Guardar cambios' : 'Agregar mascota'}
    >
      {/* ── Paso 1: Datos básicos ── */}
      {step === 0 && (
        <>
          {/* Foto */}
          <div className="form-group" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{
              width: 76, height: 76, borderRadius: 'var(--r-md)', flexShrink: 0,
              background: 'var(--bg-sub)', border: '1.5px dashed var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            }}>
              {hasPhoto
                ? <img src={form.photo} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setForm(f => ({ ...f, photo: '' }))} />
                : <span style={{ color: 'var(--text-tertiary)' }}><SpeciesIcon species={form.species} size={32} strokeWidth={1.25} /></span>
              }
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label">Foto (opcional)</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" className="btn btn--subtle btn--sm" onClick={() => fileRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Camera size={13} /> Subir
                </button>
                <button type="button" className={`btn btn--sm ${urlMode ? 'btn--primary' : 'btn--subtle'}`} onClick={() => setUrlMode(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Link size={13} /> URL
                </button>
                {hasPhoto && (
                  <button type="button" className="btn btn--subtle btn--sm" onClick={() => { setForm(f => ({ ...f, photo: '' })); setPhotoError('') }} style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--danger)' }}>
                    <X size={13} /> Quitar
                  </button>
                )}
              </div>
              {urlMode && <input className="form-input" style={{ marginTop: 8 }} value={form.photo} onChange={(e) => { setForm(f => ({ ...f, photo: e.target.value })); setPhotoError('') }} placeholder="https://..." />}
              {photoError && <span className="form-error">{photoError}</span>}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            </div>
          </div>

          <div className="form-row form-row--2">
            <div className="form-group">
              <label className="form-label">Nombre *</label>
              <input className={`form-input${errors.name ? ' form-input--error' : ''}`} value={form.name} onChange={set('name')} placeholder="Nombre de la mascota" autoFocus />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Raza</label>
              <input className="form-input" value={form.breed} onChange={set('breed')} placeholder="Ej: Labrador, Siamés..." />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Especie</label>
            <div className="toggle-group">
              {SPECIES.map(s => (
                <button key={s.value} type="button" className={`toggle-btn${form.species === s.value ? ' on' : ''}`}
                  onClick={() => setForm(f => ({ ...f, species: s.value }))}>{s.label}</button>
              ))}
            </div>
          </div>

          <OwnerSelect
            value={form.ownerId}
            onChange={id => { setForm(f => ({ ...f, ownerId: id })); setErrors(er => ({ ...er, ownerId: '' })) }}
            error={errors.ownerId} label="Dueño" required
            onAddNew={() => setOwnerFormOpen(true)}
          />
        </>
      )}

      {/* ── Paso 2: Salud ── */}
      {step === 1 && (
        <>
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
            <textarea className="form-input" value={form.observations} onChange={set('observations')} placeholder="Notas adicionales..." rows={4} />
          </div>
        </>
      )}
    </StepWizard>

    <OwnerForm isOpen={ownerFormOpen} onClose={() => setOwnerFormOpen(false)} onSave={handleAddOwner} />
    </>
  )
}
