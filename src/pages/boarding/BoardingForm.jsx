import { useState, useEffect } from 'react'
import StepWizard from '../../components/ui/StepWizard'
import OwnerSelect from '../../components/ui/OwnerSelect'
import PetSelect from '../../components/ui/PetSelect'
import { useApp } from '../../context/AppContext'
import { todayStr, formatCurrency } from '../../utils/helpers'

const EMPTY = { petId: '', ownerId: '', entryDate: todayStr(), exitDate: '', dailyPrice: '', feeding: '', observations: '', status: 'active', paymentMethod: 'efectivo' }
const STEPS  = ['Paciente', 'Cuidados']
const PAYMENT_METHODS = [
  { value: 'efectivo',        label: 'Efectivo',         surcharge: 0    },
  { value: 'tarjeta_credito', label: 'Tarjeta crédito',  surcharge: 0.20 },
  { value: 'tarjeta_debito',  label: 'Tarjeta débito',   surcharge: 0.05 },
  { value: 'transferencia',   label: 'Transferencia',    surcharge: 0    },
]

export default function BoardingForm({ isOpen, onClose, onSave, initial = null }) {
  const { pets } = useApp()
  const [form, setForm]     = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [step, setStep]     = useState(0)

  useEffect(() => {
    if (isOpen) { setStep(0); setErrors({}); setForm(initial ? { ...EMPTY, ...initial, exitDate: initial.exitDate || '' } : EMPTY) }
  }, [isOpen, initial])

  const set = (field) => (e) => { setForm(f => ({ ...f, [field]: e.target.value })); setErrors(er => ({ ...er, [field]: '' })) }

  const handlePetChange = (petId) => {
    const pet = pets.items.find(p => p.id === petId)
    setForm(f => ({ ...f, petId, ownerId: pet?.ownerId || f.ownerId }))
    setErrors(er => ({ ...er, petId: '' }))
  }

  const validateStep = (s) => {
    const errs = {}
    if (s === 0) {
      if (!form.petId)     errs.petId     = 'Seleccioná una mascota'
      if (!form.entryDate) errs.entryDate = 'Requerido'
    }
    return errs
  }

  const basePrice    = parseFloat(form.dailyPrice) || 0
  const surcharge    = PAYMENT_METHODS.find(m => m.value === form.paymentMethod)?.surcharge ?? 0
  const surchargeAmt = Math.round(basePrice * surcharge)
  const total        = basePrice + surchargeAmt

  const handleNext = () => { const e = validateStep(step); if (Object.keys(e).length) { setErrors(e); return }; setStep(s => s + 1) }
  const handleSave = () => { onSave({ ...form, dailyPrice: total, exitDate: form.exitDate || null, petId: form.petId || null, ownerId: form.ownerId || null }); onClose() }

  return (
    <StepWizard
      isOpen={isOpen} onClose={onClose}
      title={initial ? 'Editar pensionado' : 'Nuevo pensionado'}
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
              <label className="form-label">Ingreso *</label>
              <input className={`form-input${errors.entryDate ? ' form-input--error' : ''}`} type="date" value={form.entryDate} onChange={set('entryDate')} />
              {errors.entryDate && <span className="form-error">{errors.entryDate}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Egreso</label>
              <input className="form-input" type="date" value={form.exitDate} onChange={set('exitDate')} />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Precio por día</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontWeight: 600, pointerEvents: 'none' }}>$</span>
              <input className="form-input" type="number" min="0" step="1" value={form.dailyPrice} onFocus={e => e.target.select()} onChange={set('dailyPrice')} placeholder="0" style={{ paddingLeft: 26 }} />
            </div>
            {surchargeAmt > 0 && (
              <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 2, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--orange)' }}>
                  <span>Recargo ({surcharge * 100}%)</span><span>+ {formatCurrency(surchargeAmt)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--accent)', borderTop: '1px solid var(--border-2)', paddingTop: 4 }}>
                  <span>Total</span><span>{formatCurrency(total)}</span>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <div className="form-group">
            <label className="form-label">Alimentación</label>
            <input className="form-input" value={form.feeding} onChange={set('feeding')} placeholder="Ej: 150g croquetas, 2 veces por día..." />
          </div>
          <div className="form-group">
            <label className="form-label">Observaciones</label>
            <textarea className="form-input" rows={4} value={form.observations} onChange={set('observations')} placeholder="Medicación, cuidados especiales, notas..." />
          </div>
          <div className="form-group">
            <label className="form-label">Medio de pago</label>
            <div className="toggle-group">
              {PAYMENT_METHODS.map(m => (
                <button key={m.value} type="button" className={`toggle-btn${form.paymentMethod === m.value ? ' on' : ''}`} onClick={() => setForm(f => ({ ...f, paymentMethod: m.value }))}>{m.label}</button>
              ))}
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Estado</label>
            <div className="toggle-group">
              <button type="button" className={`toggle-btn${form.status === 'active' ? ' on' : ''}`} onClick={() => setForm(f => ({ ...f, status: 'active' }))}>🏠 En pensión</button>
              <button type="button" className={`toggle-btn${form.status === 'completed' ? ' on--ok' : ''}`} onClick={() => setForm(f => ({ ...f, status: 'completed' }))}>✅ Retirado</button>
            </div>
          </div>
        </>
      )}
    </StepWizard>
  )
}
