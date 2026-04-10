import { useState, useEffect } from 'react'
import Modal from '../../components/ui/Modal'
import { useApp } from '../../context/AppContext'
import { todayStr } from '../../utils/helpers'

const EMPTY = {
  petId: '', ownerId: '', date: todayStr(), time: '09:00',
  reason: '', status: 'pending', notes: '',
}

export default function AppointmentForm({ isOpen, onClose, onSave, initial = null }) {
  const { pets, owners } = useApp()
  const [form, setForm] = useState(initial || EMPTY)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen) setForm(initial || EMPTY)
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
    if (!form.petId)       errs.petId  = 'Seleccioná una mascota'
    if (!form.date)        errs.date   = 'Requerido'
    if (!form.time)        errs.time   = 'Requerido'
    if (!form.reason.trim()) errs.reason = 'Requerido'
    return errs
  }

  const handleSave = () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSave(form)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? 'Editar turno' : 'Nuevo turno'}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn--primary" onClick={handleSave}>
            {initial ? 'Guardar cambios' : 'Agendar turno'}
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

      <div className="form-row form-row--2">
        <div className="form-group">
          <label className="form-label">Fecha *</label>
          <input className={`form-input${errors.date ? ' form-input--error' : ''}`} type="date" value={form.date} onChange={set('date')} />
        </div>
        <div className="form-group">
          <label className="form-label">Hora *</label>
          <input className={`form-input${errors.time ? ' form-input--error' : ''}`} type="time" value={form.time} onChange={set('time')} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Motivo *</label>
        <input
          className={`form-input${errors.reason ? ' form-input--error' : ''}`}
          value={form.reason} onChange={set('reason')}
          placeholder="Consulta general, vacunas, cirugía..."
        />
        {errors.reason && <span style={{ color: 'var(--red)', fontSize: 12 }}>{errors.reason}</span>}
      </div>

      <div className="form-row form-row--2">
        <div className="form-group">
          <label className="form-label">Estado</label>
          <select className="form-input" value={form.status} onChange={set('status')}>
            <option value="pending">Pendiente</option>
            <option value="confirmed">Confirmado</option>
            <option value="attended">Atendido</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Notas adicionales</label>
        <textarea className="form-input" value={form.notes} onChange={set('notes')} placeholder="Instrucciones previas, observaciones..." rows={2} />
      </div>
    </Modal>
  )
}
