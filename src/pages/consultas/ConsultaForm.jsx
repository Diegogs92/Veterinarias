import { useState, useEffect } from 'react'
import StepWizard from '../../components/ui/StepWizard'
import PetSelect from '../../components/ui/PetSelect'
import { useApp } from '../../context/AppContext'
import { todayStr, formatCurrency } from '../../utils/helpers'

const PAYMENT_METHODS = [
  { value: 'efectivo',        label: 'Efectivo',         surcharge: 0    },
  { value: 'tarjeta_credito', label: 'Tarjeta crédito',  surcharge: 0.20 },
  { value: 'tarjeta_debito',  label: 'Tarjeta débito',   surcharge: 0.05 },
  { value: 'transferencia',   label: 'Transferencia',    surcharge: 0    },
]

const EMPTY = {
  petId: '', ownerId: '', date: todayStr(),
  type: 'consultorio', reason: '', diagnosis: '', treatment: '',
  medicationsProvided: false, medicationsDetail: '',
  xrays: false, xraysNotes: '', address: '',
  price: '', paymentStatus: 'pending', paymentMethod: 'efectivo',
}

const STEPS = ['Paciente', 'Consulta', 'Pago']

const PAYMENT_OPTS = [
  { value: 'pending', label: 'No pagado', tone: 'warn' },
  { value: 'paid',    label: 'Pagado',    tone: 'ok'   },
]

export default function ConsultaForm({ isOpen, onClose, onSave, initial = null }) {
  const { pets, owners } = useApp()
  const [form, setForm]   = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [step, setStep]   = useState(0)

  useEffect(() => {
    if (isOpen) {
      setStep(0)
      setErrors({})
      setForm(initial
        ? { ...EMPTY, ...initial, medicationsProvided: !!initial.medicationsProvided, xrays: !!initial.xrays }
        : EMPTY
      )
    }
  }, [isOpen, initial])

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setErrors(er => ({ ...er, [field]: '' }))
  }
  const setCheck = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.checked }))

  const handlePetChange = (petId) => {
    const pet   = pets.items.find(p => p.id === petId)
    const owner = pet ? owners.items.find(o => o.id === pet.ownerId) : null
    setForm(f => ({ ...f, petId, ownerId: pet?.ownerId || f.ownerId, address: owner?.address || f.address }))
    setErrors(er => ({ ...er, petId: '' }))
  }

  const validateStep = (s) => {
    const errs = {}
    if (s === 0) {
      if (!form.petId) errs.petId = 'Seleccioná una mascota'
    }
    if (s === 1) {
      if (!form.date)          errs.date   = 'Requerido'
      if (!form.reason.trim()) errs.reason = 'Requerido'
    }
    return errs
  }

  const handleNext = () => {
    const errs = validateStep(step)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setStep(s => s + 1)
  }

  const basePrice    = parseFloat(form.price) || 0
  const surcharge    = PAYMENT_METHODS.find(m => m.value === form.paymentMethod)?.surcharge ?? 0
  const surchargeAmt = Math.round(basePrice * surcharge)
  const total        = basePrice + surchargeAmt

  const handleSave = () => {
    const errs = validateStep(step)
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSave({ ...form, price: total, petId: form.petId || null, ownerId: form.ownerId || null })
    onClose()
  }

  return (
    <StepWizard
      isOpen={isOpen} onClose={onClose}
      title={initial ? 'Editar consulta' : 'Nueva consulta'}
      steps={STEPS} currentStep={step}
      onNext={handleNext} onPrev={() => setStep(s => s - 1)} onSave={handleSave}
      saveLabel={initial ? 'Guardar cambios' : 'Registrar consulta'}
    >
      {/* ── Paso 1: Paciente ── */}
      {step === 0 && (
        <PetSelect value={form.petId} onChange={handlePetChange} error={errors.petId} required />
      )}

      {/* ── Paso 2: Consulta ── */}
      {step === 1 && (
        <>
          <div className="form-row form-row--2">
            <div className="form-group">
              <label className="form-label">Fecha *</label>
              <input className={`form-input${errors.date ? ' form-input--error' : ''}`} type="date" value={form.date} onChange={set('date')} />
              {errors.date && <span className="form-error">{errors.date}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Tipo</label>
              <div className="toggle-group">
                {[{ value: 'consultorio', label: '🏥 Consultorio' }, { value: 'domicilio', label: '🏠 Domicilio' }].map(t => (
                  <button key={t.value} type="button" className={`toggle-btn${form.type === t.value ? ' on' : ''}`}
                    onClick={() => setForm(f => ({ ...f, type: t.value }))}>{t.label}</button>
                ))}
              </div>
            </div>
          </div>

          {form.type === 'domicilio' && (
            <div className="form-group">
              <label className="form-label">Dirección</label>
              <input className="form-input" value={form.address} onChange={set('address')} placeholder="Calle y número..." />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Motivo *</label>
            <input className={`form-input${errors.reason ? ' form-input--error' : ''}`} value={form.reason} onChange={set('reason')} placeholder="¿Por qué viene el paciente?" />
            {errors.reason && <span className="form-error">{errors.reason}</span>}
          </div>

          <div className="form-row form-row--2">
            <div className="form-group">
              <label className="form-label">Diagnóstico</label>
              <textarea className="form-input" rows={3} value={form.diagnosis} onChange={set('diagnosis')} placeholder="Diagnóstico..." />
            </div>
            <div className="form-group">
              <label className="form-label">Tratamiento</label>
              <textarea className="form-input" rows={3} value={form.treatment} onChange={set('treatment')} placeholder="Tratamiento indicado..." />
            </div>
          </div>

          {form.type === 'consultorio' && (
            <div style={{ background: 'var(--bg-sub)', borderRadius: 'var(--r-md)', padding: '14px 16px' }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, color: 'var(--text-secondary)' }}>Detalles adicionales</div>
              <div className="form-group" style={{ marginBottom: 10 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.medicationsProvided} onChange={setCheck('medicationsProvided')} style={{ width: 17, height: 17, accentColor: 'var(--accent)' }} />
                  <span style={{ fontSize: 14, fontWeight: 500 }}>Se entregaron medicamentos</span>
                </label>
                {form.medicationsProvided && <input className="form-input" style={{ marginTop: 8 }} value={form.medicationsDetail} onChange={set('medicationsDetail')} placeholder="Medicamento, dosis, frecuencia..." />}
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.xrays} onChange={setCheck('xrays')} style={{ width: 17, height: 17, accentColor: 'var(--accent)' }} />
                  <span style={{ fontSize: 14, fontWeight: 500 }}>Se realizaron radiografías</span>
                </label>
                {form.xrays && <input className="form-input" style={{ marginTop: 8 }} value={form.xraysNotes} onChange={set('xraysNotes')} placeholder="Zona, hallazgos..." />}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Paso 3: Pago ── */}
      {step === 2 && (
        <>
          <div className="form-group">
            <label className="form-label">Precio</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontWeight: 600, pointerEvents: 'none' }}>$</span>
              <input className="form-input" type="number" min="0" step="0.01" value={form.price} onFocus={e => e.target.select()} onChange={set('price')} placeholder="0" style={{ paddingLeft: 26 }} />
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
            <label className="form-label">Estado de pago</label>
            <div className="toggle-group">
              {PAYMENT_OPTS.map(opt => (
                <button key={opt.value} type="button"
                  className={`toggle-btn${form.paymentStatus === opt.value ? ` on--${opt.tone}` : ''}`}
                  onClick={() => setForm(f => ({ ...f, paymentStatus: opt.value }))}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </StepWizard>
  )
}
