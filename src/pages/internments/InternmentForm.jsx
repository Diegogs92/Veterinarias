import { useState, useEffect } from 'react'
import Modal from '../../components/ui/Modal'
import { useApp } from '../../context/AppContext'
import { todayStr } from '../../utils/helpers'

const EMPTY = {
  petId: '', ownerId: '', admissionDate: todayStr(), admissionTime: '08:00',
  reason: '', diagnosis: '', treatment: '', medication: '',
  status: 'active', cage: '', dischargeDate: '', dailyNotes: [],
}

export default function InternmentForm({ isOpen, onClose, onSave, initial = null }) {
  const { pets, owners } = useApp()
  const [form, setForm] = useState(initial || EMPTY)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen) setForm(initial ? { ...initial, dischargeDate: initial.dischargeDate || '' } : EMPTY)
  }, [isOpen, initial])

  const set = (field) => (e) => {
    const value = e.target.value
    setForm(f => {
      const updated = { ...f, [field]: value }
      if (field === 'petId') {
        const pet = pets.items.find(p => p.id === value)
        if (pet) updated.ownerId = pet.ownerId
      }
      return updated
    })
    setErrors(er => ({ ...er, [field]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.petId)           errs.petId  = 'Seleccioná una mascota'
    if (!form.admissionDate)   errs.admissionDate = 'Requerido'
    if (!form.reason.trim())   errs.reason = 'Requerido'
    return errs
  }

  const handleSave = () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSave({
      ...form,
      dischargeDate: form.dischargeDate || null,
      dailyNotes: form.dailyNotes || [],
    })
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
      <div className="form-row form-row--2">
        <div className="form-group">
          <label className="form-label">Mascota *</label>
          <select className={`form-input${errors.petId ? ' form-input--error' : ''}`} value={form.petId} onChange={set('petId')}>
            <option value="">Seleccionar mascota...</option>
            {pets.items.map(p => {
              const owner = owners.find(p.ownerId)
              return <option key={p.id} value={p.id}>{p.name} ({owner?.name || '?'})</option>
            })}
          </select>
          {errors.petId && <span style={{ color: 'var(--red)', fontSize: 12 }}>{errors.petId}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Dueño</label>
          <select className="form-input" value={form.ownerId} onChange={set('ownerId')} disabled={!!form.petId}>
            <option value="">—</option>
            {owners.items.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
      </div>

      <div className="form-row form-row--3">
        <div className="form-group">
          <label className="form-label">Fecha ingreso *</label>
          <input className={`form-input${errors.admissionDate ? ' form-input--error' : ''}`} type="date" value={form.admissionDate} onChange={set('admissionDate')} />
        </div>
        <div className="form-group">
          <label className="form-label">Hora ingreso</label>
          <input className="form-input" type="time" value={form.admissionTime} onChange={set('admissionTime')} />
        </div>
        <div className="form-group">
          <label className="form-label">Jaula / Box</label>
          <input className="form-input" value={form.cage} onChange={set('cage')} placeholder="Box 1, Jaula A..." />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Motivo de internación *</label>
        <input
          className={`form-input${errors.reason ? ' form-input--error' : ''}`}
          value={form.reason} onChange={set('reason')}
          placeholder="Cirugía, fractura, intoxicación..."
        />
        {errors.reason && <span style={{ color: 'var(--red)', fontSize: 12 }}>{errors.reason}</span>}
      </div>

      <div className="form-group">
        <label className="form-label">Diagnóstico</label>
        <textarea className="form-input" value={form.diagnosis} onChange={set('diagnosis')} placeholder="Diagnóstico inicial..." rows={2} />
      </div>

      <div className="form-group">
        <label className="form-label">Tratamiento</label>
        <textarea className="form-input" value={form.treatment} onChange={set('treatment')} placeholder="Plan de tratamiento..." rows={2} />
      </div>

      <div className="form-group">
        <label className="form-label">Medicación</label>
        <input className="form-input" value={form.medication} onChange={set('medication')} placeholder="Medicamento, dosis, frecuencia..." />
      </div>

      <div className="form-row form-row--2">
        <div className="form-group">
          <label className="form-label">Estado</label>
          <select className="form-input" value={form.status} onChange={set('status')}>
            <option value="active">🟡 Internado</option>
            <option value="critical">🔴 Crítico</option>
            <option value="improving">🟢 Mejorando</option>
            <option value="discharged">✅ Alta</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Fecha de alta (si corresponde)</label>
          <input className="form-input" type="date" value={form.dischargeDate || ''} onChange={set('dischargeDate')} />
        </div>
      </div>
    </Modal>
  )
}
