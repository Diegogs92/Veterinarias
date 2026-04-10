import { useState, useEffect } from 'react'
import Modal from '../../components/ui/Modal'
import { useApp } from '../../context/AppContext'
import { todayStr } from '../../utils/helpers'

const EMPTY = {
  petId: '', date: todayStr(), reason: '', diagnosis: '',
  treatment: '', medication: '', observations: '',
}

export default function ConsultationForm({ isOpen, onClose, onSave, initial = null, defaultPetId = '' }) {
  const { pets, owners } = useApp()
  const [form, setForm] = useState(initial || { ...EMPTY, petId: defaultPetId })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen) setForm(initial || { ...EMPTY, petId: defaultPetId })
  }, [isOpen, initial, defaultPetId])

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setErrors(er => ({ ...er, [field]: '' }))
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
    onSave(form)
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
          <label className="form-label">Fecha *</label>
          <input className={`form-input${errors.date ? ' form-input--error' : ''}`} type="date" value={form.date} onChange={set('date')} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Motivo de consulta *</label>
        <input
          className={`form-input${errors.reason ? ' form-input--error' : ''}`}
          value={form.reason} onChange={set('reason')}
          placeholder="Vómitos, fiebre, control, accidente..."
        />
        {errors.reason && <span style={{ color: 'var(--red)', fontSize: 12 }}>{errors.reason}</span>}
      </div>

      <div className="form-group">
        <label className="form-label">Diagnóstico</label>
        <textarea className="form-input" value={form.diagnosis} onChange={set('diagnosis')} placeholder="Diagnóstico clínico..." rows={2} />
      </div>

      <div className="form-group">
        <label className="form-label">Tratamiento</label>
        <textarea className="form-input" value={form.treatment} onChange={set('treatment')} placeholder="Indicaciones, reposo, cirugía..." rows={2} />
      </div>

      <div className="form-group">
        <label className="form-label">Medicación</label>
        <input className="form-input" value={form.medication} onChange={set('medication')} placeholder="Nombre del medicamento, dosis, frecuencia..." />
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Observaciones</label>
        <textarea className="form-input" value={form.observations} onChange={set('observations')} placeholder="Notas adicionales, próximo control..." rows={2} />
      </div>
    </Modal>
  )
}
