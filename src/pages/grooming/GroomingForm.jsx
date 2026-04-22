import { useState, useEffect } from 'react'
import StepWizard from '../../components/ui/StepWizard'
import OwnerSelect from '../../components/ui/OwnerSelect'
import PetSelect from '../../components/ui/PetSelect'
import { useApp } from '../../context/AppContext'
import { todayStr } from '../../utils/helpers'

const SERVICES = ['Baño', 'Corte', 'Corte de uñas', 'Limpieza de orejas', 'Baño + corte completo']
const EMPTY    = { petId: '', ownerId: '', date: todayStr(), time: '', services: [], price: '', observations: '', status: 'completed' }
const STEPS    = ['Turno', 'Servicios']

export default function GroomingForm({ isOpen, onClose, onSave, initial = null }) {
  const { pets } = useApp()
  const [form, setForm]     = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [step, setStep]     = useState(0)

  useEffect(() => {
    if (isOpen) { setStep(0); setErrors({}); setForm(initial ? { ...initial, services: initial.services || [] } : EMPTY) }
  }, [isOpen, initial])

  const set = (field) => (e) => { setForm(f => ({ ...f, [field]: e.target.value })); setErrors(er => ({ ...er, [field]: '' })) }

  const handlePetChange = (petId) => {
    const pet = pets.items.find(p => p.id === petId)
    setForm(f => ({ ...f, petId, ownerId: pet?.ownerId || f.ownerId }))
    setErrors(er => ({ ...er, petId: '' }))
  }

  const toggleService = (svc) => setForm(f => ({ ...f, services: f.services.includes(svc) ? f.services.filter(s => s !== svc) : [...f.services, svc] }))

  const validateStep = (s) => {
    const errs = {}
    if (s === 0) {
      if (!form.petId) errs.petId = 'Seleccioná una mascota'
      if (!form.date)  errs.date  = 'Requerido'
    }
    return errs
  }

  const handleNext = () => { const e = validateStep(step); if (Object.keys(e).length) { setErrors(e); return }; setStep(s => s + 1) }
  const handleSave = () => { onSave({ ...form, price: parseFloat(form.price) || 0 }); onClose() }

  return (
    <StepWizard
      isOpen={isOpen} onClose={onClose}
      title={initial ? 'Editar turno' : 'Nuevo turno de peluquería'}
      steps={STEPS} currentStep={step}
      onNext={handleNext} onPrev={() => setStep(s => s - 1)} onSave={handleSave}
      saveLabel={initial ? 'Guardar cambios' : 'Registrar'}
    >
      {step === 0 && (
        <>
          <PetSelect value={form.petId} onChange={handlePetChange} error={errors.petId} required />
          <OwnerSelect value={form.ownerId} onChange={id => setForm(f => ({ ...f, ownerId: id }))} disabled={!!form.petId} label="Dueño" />
          <div className="form-row form-row--2">
            <div className="form-group">
              <label className="form-label">Fecha *</label>
              <input className={`form-input${errors.date ? ' form-input--error' : ''}`} type="date" value={form.date} onChange={set('date')} />
              {errors.date && <span className="form-error">{errors.date}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Horario</label>
              <input className="form-input" type="time" value={form.time} onChange={set('time')} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Estado</label>
            <div className="toggle-group">
              <button type="button" className={`toggle-btn${form.status === 'scheduled' ? ' on' : ''}`} onClick={() => setForm(f => ({ ...f, status: 'scheduled' }))}>📅 Programado</button>
              <button type="button" className={`toggle-btn${form.status === 'completed' ? ' on--ok' : ''}`} onClick={() => setForm(f => ({ ...f, status: 'completed' }))}>✅ Realizado</button>
            </div>
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <div className="form-group">
            <label className="form-label">Servicios</label>
            <div className="toggle-group">
              {SERVICES.map(svc => (
                <button key={svc} type="button" className={`toggle-btn${form.services.includes(svc) ? ' on' : ''}`} onClick={() => toggleService(svc)}>{svc}</button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Precio</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontWeight: 600, pointerEvents: 'none' }}>$</span>
              <input className="form-input" type="number" min="0" step="1" value={form.price} onFocus={e => e.target.select()} onChange={set('price')} placeholder="0" style={{ paddingLeft: 26 }} />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Observaciones</label>
            <textarea className="form-input" rows={3} value={form.observations} onChange={set('observations')} placeholder="Notas del servicio..." />
          </div>
        </>
      )}
    </StepWizard>
  )
}
