import { useState, useEffect } from 'react'
import StepWizard from '../../components/ui/StepWizard'
import PetSelect from '../../components/ui/PetSelect'
import { useApp } from '../../context/AppContext'
import { todayStr, formatCurrency } from '../../utils/helpers'
import { Banknote, CreditCard, Wallet, ArrowRightLeft } from 'lucide-react'

const EMPTY = { petId: '', ownerId: '', vaccineName: '', catalogId: '', date: todayStr(), nextDue: '', notes: '', paymentMethod: 'efectivo', price: '', paid: false }

const PAYMENT_METHODS = [
  { value: 'efectivo',        label: 'Efectivo',           Icon: Banknote,       surcharge: 0    },
  { value: 'transferencia',   label: 'Transferencia',      Icon: ArrowRightLeft, surcharge: 0    },
  { value: 'tarjeta_debito',  label: 'Tarjeta débito',     Icon: Wallet,         surcharge: 0.05 },
  { value: 'tarjeta_credito', label: 'Tarjeta crédito',    Icon: CreditCard,     surcharge: 0.20 },
]

const STEPS = ['Mascota', 'Vacuna']

function addOneYear(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().slice(0, 10)
}

export default function VaccineForm({ isOpen, onClose, onSave, initial = null }) {
  const { pets, vaccineCatalog } = useApp()
  const [form, setForm]   = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [step, setStep]   = useState(0)

  useEffect(() => {
    if (isOpen) {
      setStep(0)
      setErrors({})
      setForm(initial ? { ...EMPTY, ...initial, price: initial.price != null ? String(initial.price) : '' } : EMPTY)
    }
  }, [isOpen, initial])

  const set = (field) => (e) => {
    const value = e.target.value
    setForm(f => {
      const next = { ...f, [field]: value }
      if (field === 'date' && !initial) next.nextDue = addOneYear(value)
      return next
    })
    setErrors(er => ({ ...er, [field]: '' }))
  }

  const handlePetChange = (petId) => {
    const pet = pets.items.find(p => p.id === petId)
    setForm(f => ({ ...f, petId, ownerId: pet?.ownerId || f.ownerId }))
    setErrors(er => ({ ...er, petId: '' }))
  }

  const handleCatalogSelect = (e) => {
    const id = e.target.value
    const entry = vaccineCatalog.items.find(v => v.id === id)
    setForm(f => ({ ...f, catalogId: id, vaccineName: entry ? entry.name : '' }))
    setErrors(er => ({ ...er, vaccineName: '' }))
  }

  const validateStep = (s) => {
    const errs = {}
    if (s === 0 && !form.petId) errs.petId = 'Seleccioná una mascota'
    if (s === 1) {
      if (!form.vaccineName.trim()) errs.vaccineName = 'Requerido'
      if (!form.date) errs.date = 'Requerido'
    }
    return errs
  }

  const handleNext = () => {
    const e = validateStep(step)
    if (Object.keys(e).length) { setErrors(e); return }
    setStep(s => s + 1)
  }

  const basePrice       = parseFloat(form.price) || 0
  const surcharge       = PAYMENT_METHODS.find(m => m.value === form.paymentMethod)?.surcharge ?? 0
  const surchargeAmount = Math.round(basePrice * surcharge)
  const total           = basePrice + surchargeAmount

  const handleSave = () => {
    const errs = validateStep(1)
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSave({ ...form, nextDue: form.nextDue || null, price: total })
    onClose()
  }

  const catalogOptions = [...vaccineCatalog.items].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <StepWizard
      isOpen={isOpen} onClose={onClose}
      title={initial?.petId ? 'Editar registro de vacuna' : 'Registrar vacuna'}
      steps={STEPS} currentStep={step}
      onNext={handleNext} onPrev={() => setStep(s => s - 1)} onSave={handleSave}
      saveLabel={initial?.petId ? 'Guardar cambios' : 'Registrar'}
    >
      {step === 0 && (
        <PetSelect value={form.petId} onChange={handlePetChange} error={errors.petId} required />
      )}

      {step === 1 && (
        <>
          {/* Vacuna */}
          <div className="form-group">
            <label className="form-label">Vacuna *</label>
            {catalogOptions.length > 0 && (
              <select
                className={`form-input${errors.vaccineName ? ' form-input--error' : ''}`}
                value={form.catalogId || ''}
                onChange={handleCatalogSelect}
              >
                <option value="">Seleccionar del catálogo...</option>
                {catalogOptions.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
                <option value="__custom">Otra / personalizada</option>
              </select>
            )}
            {(form.catalogId === '__custom' || catalogOptions.length === 0) && (
              <input
                className={`form-input${errors.vaccineName ? ' form-input--error' : ''}`}
                value={form.vaccineName}
                onChange={set('vaccineName')}
                placeholder="Nombre de la vacuna"
                style={{ marginTop: catalogOptions.length > 0 ? 8 : 0 }}
                autoFocus
              />
            )}
            {errors.vaccineName && <span className="form-error">{errors.vaccineName}</span>}
          </div>

          {/* Fecha + Vencimiento + Monto */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Fecha aplicada *</label>
              <input
                className={`form-input${errors.date ? ' form-input--error' : ''}`}
                type="date" value={form.date} onChange={set('date')}
              />
              {errors.date && <span className="form-error">{errors.date}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Próximo vencimiento</label>
              <input
                className="form-input"
                type="date" value={form.nextDue} onChange={set('nextDue')}
              />
              <span className="form-hint">+1 año automático</span>
            </div>
            <div className="form-group">
              <label className="form-label">Monto (ARS)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontWeight: 600, pointerEvents: 'none' }}>$</span>
                <input
                  className="form-input"
                  type="number" min="0" step="1"
                  value={form.price}
                  onFocus={e => e.target.select()}
                  onChange={set('price')}
                  placeholder="0"
                  style={{ paddingLeft: 26 }}
                />
              </div>
            </div>
          </div>

          {/* Medio de pago */}
          <div className="form-group">
            <label className="form-label">Medio de pago</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {PAYMENT_METHODS.map(({ value, label, Icon, surcharge: sc }) => {
                const active = form.paymentMethod === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, paymentMethod: value }))}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: 5, padding: '10px 8px',
                      borderRadius: 'var(--r-md)', cursor: 'pointer',
                      border: `2px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                      background: active ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'var(--bg-sub)',
                      color: active ? 'var(--accent)' : 'var(--text-secondary)',
                      fontWeight: active ? 700 : 500,
                      fontSize: 12, transition: 'all var(--t-fast)' }}
                  >
                    <Icon size={18} strokeWidth={2} />
                    <span style={{ textAlign: 'center', lineHeight: 1.2 }}>{label}</span>
                    {sc > 0 && <span style={{ fontSize: 10, opacity: 0.8, fontWeight: 600 }}>+{sc * 100}%</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Estado de pago */}
          <div className="form-group">
            <label className="form-label">Estado de pago</label>
            <div className="toggle-group">
              <button type="button" className={`toggle-btn${!form.paid ? ' on--warn' : ''}`} onClick={() => setForm(f => ({ ...f, paid: false }))}>No pagado</button>
              <button type="button" className={`toggle-btn${form.paid ? ' on--ok' : ''}`} onClick={() => setForm(f => ({ ...f, paid: true }))}>✓ Pagado</button>
            </div>
          </div>

          {/* Recargo */}
          {surchargeAmount > 0 && (
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '8px 14px', borderRadius: 'var(--r-md)', background: 'var(--bg-sub)', border: '1px solid var(--border)', marginTop: -4 }}>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)' }}>
                <span>Subtotal</span><span>{formatCurrency(basePrice)}</span>
              </div>
              <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
              <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--warn)', fontWeight: 600 }}>
                <span>Recargo ({surcharge * 100}%)</span><span>+{formatCurrency(surchargeAmount)}</span>
              </div>
              <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
              <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 14, color: 'var(--accent)' }}>
                <span>Total</span><span>{formatCurrency(total)}</span>
              </div>
            </div>
          )}

          {/* Observaciones */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Observaciones</label>
            <textarea
              className="form-input"
              value={form.notes}
              onChange={set('notes')}
              placeholder="Lote, veterinario, reacciones..."
              rows={2}
            />
          </div>
        </>
      )}
    </StepWizard>
  )
}
