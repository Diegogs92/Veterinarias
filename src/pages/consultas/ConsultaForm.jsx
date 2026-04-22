import { useState, useEffect } from 'react'
import Modal from '../../components/ui/Modal'
import OwnerSelect from '../../components/ui/OwnerSelect'
import PetSelect from '../../components/ui/PetSelect'
import { useApp } from '../../context/AppContext'
import { todayStr } from '../../utils/helpers'

const EMPTY = {
  petId: '', ownerId: '', date: todayStr(),
  type: 'consultorio',
  reason: '', diagnosis: '', treatment: '',
  medicationsProvided: false, medicationsDetail: '',
  xrays: false, xraysNotes: '',
  address: '',
  price: '', paymentStatus: 'pending',
}

const PAYMENT_OPTS = [
  { value: 'pending', label: 'Pendiente', tone: 'warn' },
  { value: 'partial', label: 'Parcial',   tone: 'warn' },
  { value: 'paid',    label: 'Pagado',    tone: 'ok'   },
]

export default function ConsultaForm({ isOpen, onClose, onSave, initial = null }) {
  const { pets, owners } = useApp()
  const [form, setForm] = useState(initial || EMPTY)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen) setForm(initial
      ? { ...EMPTY, ...initial, medicationsProvided: initial.medicationsProvided || false, xrays: initial.xrays || false }
      : EMPTY
    )
    setErrors({})
  }, [isOpen, initial])

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setErrors(er => ({ ...er, [field]: '' }))
  }

  const setCheck = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.checked }))

  const handlePetChange = (petId) => {
    const pet = pets.items.find(p => p.id === petId)
    const owner = pet ? owners.items.find(o => o.id === pet.ownerId) : null
    setForm(f => ({ ...f, petId, ownerId: pet?.ownerId || f.ownerId, address: owner?.address || f.address }))
    setErrors(er => ({ ...er, petId: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.petId)         errs.petId  = 'Seleccioná una mascota'
    if (!form.date)          errs.date   = 'Requerido'
    if (!form.reason.trim()) errs.reason = 'Requerido'
    return errs
  }

  const handleSave = () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSave({ ...form, price: parseFloat(form.price) || 0 })
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? 'Editar consulta' : 'Nueva consulta'}
      size="lg"
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn--primary" onClick={handleSave}>
            {initial ? 'Guardar cambios' : 'Registrar consulta'}
          </button>
        </>
      }
    >
      <PetSelect value={form.petId} onChange={handlePetChange} error={errors.petId} required />
      <OwnerSelect
        value={form.ownerId}
        onChange={id => setForm(f => ({ ...f, ownerId: id }))}
        disabled={!!form.petId}
        label="Dueño"
      />

      <div className="form-row form-row--2">
        <div className="form-group">
          <label className="form-label">Fecha *</label>
          <input
            className={`form-input${errors.date ? ' form-input--error' : ''}`}
            type="date" value={form.date} onChange={set('date')}
          />
          {errors.date && <span className="form-error">{errors.date}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Tipo</label>
          <div className="toggle-group">
            {[
              { value: 'consultorio', label: '🏥 Consultorio' },
              { value: 'domicilio',   label: '🏠 Domicilio' },
            ].map(t => (
              <button
                key={t.value}
                type="button"
                className={`toggle-btn${form.type === t.value ? ' on' : ''}`}
                onClick={() => setForm(f => ({ ...f, type: t.value }))}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {form.type === 'domicilio' && (
        <div className="form-group">
          <label className="form-label">Dirección de la visita</label>
          <input
            className="form-input"
            value={form.address} onChange={set('address')}
            placeholder="Calle y número..."
          />
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Motivo *</label>
        <input
          className={`form-input${errors.reason ? ' form-input--error' : ''}`}
          value={form.reason} onChange={set('reason')}
          placeholder="¿Por qué viene el paciente?"
        />
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
        <div style={{
          background: 'var(--bg-sub)', borderRadius: 'var(--r-md)',
          padding: '14px 16px', marginBottom: 16,
        }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, color: 'var(--text-secondary)' }}>
            Detalles de consultorio
          </div>
          <div className="form-group" style={{ marginBottom: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox" checked={form.medicationsProvided} onChange={setCheck('medicationsProvided')}
                style={{ width: 17, height: 17, cursor: 'pointer', accentColor: 'var(--accent)' }}
              />
              <span style={{ fontSize: 14, fontWeight: 500 }}>Se entregaron medicamentos</span>
            </label>
            {form.medicationsProvided && (
              <input
                className="form-input" style={{ marginTop: 8 }}
                value={form.medicationsDetail} onChange={set('medicationsDetail')}
                placeholder="Medicamento, dosis, frecuencia..."
              />
            )}
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox" checked={form.xrays} onChange={setCheck('xrays')}
                style={{ width: 17, height: 17, cursor: 'pointer', accentColor: 'var(--accent)' }}
              />
              <span style={{ fontSize: 14, fontWeight: 500 }}>Se realizaron radiografías</span>
            </label>
            {form.xrays && (
              <input
                className="form-input" style={{ marginTop: 8 }}
                value={form.xraysNotes} onChange={set('xraysNotes')}
                placeholder="Zona, hallazgos..."
              />
            )}
          </div>
        </div>
      )}

      <div className="form-row form-row--2">
        <div className="form-group">
          <label className="form-label">Precio</label>
          <input
            className="form-input" type="number" min="0" step="0.01"
            value={form.price} onChange={set('price')} placeholder="0"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Estado de pago</label>
          <div className="toggle-group">
            {PAYMENT_OPTS.map(opt => (
              <button
                key={opt.value}
                type="button"
                className={`toggle-btn${form.paymentStatus === opt.value ? ` on--${opt.tone}` : ''}`}
                onClick={() => setForm(f => ({ ...f, paymentStatus: opt.value }))}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}
