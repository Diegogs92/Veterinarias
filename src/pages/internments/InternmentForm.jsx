import { useState, useEffect } from 'react'
import Modal from '../../components/ui/Modal'
import OwnerSelect from '../../components/ui/OwnerSelect'
import PetSelect from '../../components/ui/PetSelect'
import { useApp } from '../../context/AppContext'
import { todayStr } from '../../utils/helpers'

const EMPTY = {
  petId: '', ownerId: '', admissionDate: todayStr(), admissionTime: '08:00',
  reason: '', diagnosis: '', treatment: '', medication: '',
  status: 'active', cage: '', dischargeDate: '', dailyNotes: [],
}

const STATUS_OPTS = [
  { value: 'active',     label: '🟡 Internado',  tone: 'warn'   },
  { value: 'critical',   label: '🔴 Crítico',     tone: 'danger' },
  { value: 'improving',  label: '🟢 Mejorando',  tone: 'ok'     },
  { value: 'discharged', label: '✅ Alta',         tone: 'ok'     },
]

export default function InternmentForm({ isOpen, onClose, onSave, initial = null }) {
  const { pets } = useApp()
  const [form, setForm] = useState(initial || EMPTY)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen) setForm(initial ? { ...initial, dischargeDate: initial.dischargeDate || '' } : EMPTY)
  }, [isOpen, initial])

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setErrors(er => ({ ...er, [field]: '' }))
  }

  const handlePetChange = (petId) => {
    const pet = pets.items.find(p => p.id === petId)
    setForm(f => ({ ...f, petId, ownerId: pet?.ownerId || f.ownerId }))
    setErrors(er => ({ ...er, petId: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.petId)         errs.petId         = 'Seleccioná una mascota'
    if (!form.admissionDate) errs.admissionDate  = 'Requerido'
    if (!form.reason.trim()) errs.reason         = 'Requerido'
    return errs
  }

  const handleSave = () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSave({ ...form, dischargeDate: form.dischargeDate || null, dailyNotes: form.dailyNotes || [] })
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? 'Editar internación' : 'Nueva internación'}
      size="lg"
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn--primary" onClick={handleSave}>
            {initial ? 'Guardar cambios' : 'Registrar internación'}
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

      <div className="form-row form-row--3">
        <div className="form-group">
          <label className="form-label">Fecha de ingreso *</label>
          <input
            className={`form-input${errors.admissionDate ? ' form-input--error' : ''}`}
            type="date" value={form.admissionDate} onChange={set('admissionDate')}
          />
          {errors.admissionDate && <span className="form-error">{errors.admissionDate}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Hora</label>
          <input className="form-input" type="time" value={form.admissionTime} onChange={set('admissionTime')} />
        </div>
        <div className="form-group">
          <label className="form-label">Jaula / Box</label>
          <input className="form-input" value={form.cage} onChange={set('cage')} placeholder="Ej: Box 1" />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Motivo de internación *</label>
        <input
          className={`form-input${errors.reason ? ' form-input--error' : ''}`}
          value={form.reason} onChange={set('reason')}
          placeholder="Cirugía, fractura, intoxicación..."
        />
        {errors.reason && <span className="form-error">{errors.reason}</span>}
      </div>

      <div className="form-row form-row--2">
        <div className="form-group">
          <label className="form-label">Diagnóstico</label>
          <textarea className="form-input" value={form.diagnosis} onChange={set('diagnosis')} placeholder="Diagnóstico inicial..." rows={3} />
        </div>
        <div className="form-group">
          <label className="form-label">Tratamiento</label>
          <textarea className="form-input" value={form.treatment} onChange={set('treatment')} placeholder="Plan de tratamiento..." rows={3} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Medicación</label>
        <input className="form-input" value={form.medication} onChange={set('medication')} placeholder="Medicamento, dosis, frecuencia..." />
      </div>

      <div className="form-group">
        <label className="form-label">Estado</label>
        <div className="toggle-group">
          {STATUS_OPTS.map(opt => (
            <button
              key={opt.value}
              type="button"
              className={`toggle-btn${form.status === opt.value ? ` on--${opt.tone}` : ''}`}
              onClick={() => setForm(f => ({ ...f, status: opt.value }))}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {(form.status === 'discharged') && (
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Fecha de alta</label>
          <input className="form-input" type="date" value={form.dischargeDate || ''} onChange={set('dischargeDate')} />
        </div>
      )}
    </Modal>
  )
}
