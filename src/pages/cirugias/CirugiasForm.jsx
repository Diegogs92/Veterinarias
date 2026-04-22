import { useState, useEffect } from 'react'
import Modal from '../../components/ui/Modal'
import OwnerSelect from '../../components/ui/OwnerSelect'
import PetSelect from '../../components/ui/PetSelect'
import { useApp } from '../../context/AppContext'
import { todayStr } from '../../utils/helpers'

const EMPTY = {
  petId: '', ownerId: '', date: todayStr(),
  diagnostico: '', costos: '', observaciones: '',
}

export default function CirugiasForm({ isOpen, onClose, onSave, initial = null }) {
  const { pets } = useApp()
  const [form, setForm] = useState(initial || EMPTY)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen) setForm(initial ? { ...initial } : EMPTY)
    setErrors({})
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
    if (!form.petId)              errs.petId       = 'Seleccioná una mascota'
    if (!form.date)               errs.date        = 'Requerido'
    if (!form.diagnostico.trim()) errs.diagnostico = 'Requerido'
    return errs
  }

  const handleSave = () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSave({ ...form, costos: parseFloat(form.costos) || 0 })
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? 'Editar cirugía' : 'Nueva cirugía'}
      size="lg"
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn--primary" onClick={handleSave}>
            {initial ? 'Guardar cambios' : 'Registrar cirugía'}
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
          <label className="form-label">Costos</label>
          <input
            className="form-input" type="number" min="0" step="1"
            value={form.costos} onChange={set('costos')} placeholder="0"
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Diagnóstico / Procedimiento *</label>
        <textarea
          className={`form-input${errors.diagnostico ? ' form-input--error' : ''}`}
          rows={3}
          value={form.diagnostico} onChange={set('diagnostico')}
          placeholder="Descripción de la cirugía y diagnóstico..."
        />
        {errors.diagnostico && <span className="form-error">{errors.diagnostico}</span>}
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Observaciones</label>
        <textarea
          className="form-input" rows={3}
          value={form.observaciones} onChange={set('observaciones')}
          placeholder="Evolución post-operatoria, notas adicionales..."
        />
      </div>
    </Modal>
  )
}
