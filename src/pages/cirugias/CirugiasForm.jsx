import { useState, useEffect } from 'react'
import StepWizard from '../../components/ui/StepWizard'
import PetSelect from '../../components/ui/PetSelect'
import { useApp } from '../../context/AppContext'
import { todayStr, formatCurrency } from '../../utils/helpers'

const EMPTY = { petId: '', ownerId: '', date: todayStr(), diagnostico: '', costos: '', observaciones: '', paymentMethod: 'efectivo' }
const STEPS = ['Paciente', 'Diagnóstico', 'Costos']
const PAYMENT_METHODS = [
  { value: 'efectivo',        label: 'Efectivo',         surcharge: 0    },
  { value: 'transferencia',   label: 'Transferencia',    surcharge: 0    },
  { value: 'tarjeta_debito',  label: 'Tarjeta débito',   surcharge: 0.05 },
  { value: 'tarjeta_credito', label: 'Tarjeta crédito',  surcharge: 0.20 },
]

export default function CirugiasForm({ isOpen, onClose, onSave, initial = null }) {
  const { pets } = useApp()
  const [form, setForm]     = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [step, setStep]     = useState(0)

  useEffect(() => {
    if (isOpen) { setStep(0); setErrors({}); setForm(initial ? { ...EMPTY, ...initial } : EMPTY) }
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
      if (!form.petId) errs.petId = 'Seleccioná una mascota'
    }
    if (s === 1) {
      if (!form.date)               errs.date        = 'Requerido'
      if (!form.diagnostico.trim()) errs.diagnostico = 'Requerido'
    }
    return errs
  }

  const basePrice    = parseFloat(form.costos) || 0
  const surcharge    = PAYMENT_METHODS.find(m => m.value === form.paymentMethod)?.surcharge ?? 0
  const surchargeAmt = Math.round(basePrice * surcharge)
  const total        = basePrice + surchargeAmt

  const handleNext = () => { const e = validateStep(step); if (Object.keys(e).length) { setErrors(e); return }; setStep(s => s + 1) }
  const handleSave = () => {
    const e = validateStep(step); if (Object.keys(e).length) { setErrors(e); return }
    onSave({ ...form, costos: total, petId: form.petId || null, ownerId: form.ownerId || null }); onClose()
  }

  return (
    <StepWizard
      isOpen={isOpen} onClose={onClose}
      title={initial ? 'Editar cirugía' : 'Nueva cirugía'}
      steps={STEPS} currentStep={step}
      onNext={handleNext} onPrev={() => setStep(s => s - 1)} onSave={handleSave}
      saveLabel={initial ? 'Guardar cambios' : 'Registrar cirugía'}
    >
      {step === 0 && (
        <PetSelect value={form.petId} onChange={handlePetChange} error={errors.petId} required />
      )}

      {step === 1 && (
        <>
          <div className="form-group">
            <label className="form-label">Fecha *</label>
            <input className={`form-input${errors.date ? ' form-input--error' : ''}`} type="date" value={form.date} onChange={set('date')} />
            {errors.date && <span className="form-error">{errors.date}</span>}
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Diagnóstico / Procedimiento *</label>
            <textarea className={`form-input${errors.diagnostico ? ' form-input--error' : ''}`} rows={4} value={form.diagnostico} onChange={set('diagnostico')} placeholder="Descripción de la cirugía y diagnóstico..." />
            {errors.diagnostico && <span className="form-error">{errors.diagnostico}</span>}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="form-group">
            <label className="form-label">Costos</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontWeight: 600, pointerEvents: 'none' }}>$</span>
              <input className="form-input" type="number" min="0" step="1" value={form.costos} onFocus={e => e.target.select()} onChange={set('costos')} placeholder="0" style={{ paddingLeft: 26 }} />
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
          <div className="form-group">
            <label className="form-label">Medio de pago</label>
            <div className="toggle-group">
              {PAYMENT_METHODS.map(m => (
                <button key={m.value} type="button" className={`toggle-btn${form.paymentMethod === m.value ? ' on' : ''}`} onClick={() => setForm(f => ({ ...f, paymentMethod: m.value }))}>{m.label}</button>
              ))}
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Observaciones</label>
            <textarea className="form-input" rows={4} value={form.observaciones} onChange={set('observaciones')} placeholder="Evolución post-operatoria, notas adicionales..." />
          </div>
        </>
      )}
    </StepWizard>
  )
}
