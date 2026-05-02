import { useState, useEffect } from 'react'
import StepWizard from '../../components/ui/StepWizard'
import PetSelect from '../../components/ui/PetSelect'
import { useApp } from '../../context/AppContext'
import { todayStr } from '../../utils/helpers'

const SERVICES = ['Baño', 'Baño + corte completo']
const EMPTY    = { petId: '', ownerId: '', date: todayStr(), services: [], price: '', observations: '' }
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
    if (s === 0 && !form.petId) errs.petId = 'Seleccioná una mascota'
    return errs
  }

  const handleNext = () => { const e = validateStep(step); if (Object.keys(e).length) { setErrors(e); return }; setStep(s => s + 1) }
  const handleSave = () => { onSave({ ...form, price: parseFloat(form.price) || 0, time: null }); onClose() }

  return (
    <StepWizard
      isOpen={isOpen} onClose={onClose}
      title={initial ? 'Editar turno' : 'Nuevo turno de peluquería'}
      steps={STEPS} currentStep={step}
      onNext={handleNext} onPrev={() => setStep(s => s - 1)} onSave={handleSave}
      saveLabel={initial ? 'Guardar cambios' : 'Registrar'}
    >
      {step === 0 && (
        <PetSelect value={form.petId} onChange={handlePetChange} error={errors.petId} required />
      )}

      {step === 1 && (
        <>
          <div className="form-group">
            <label className="form-label">Servicio</label>
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
