import { useState, useEffect } from 'react'
import Modal from '../../components/ui/Modal'

const EMPTY = { name: '', species: 'dog', ageLabel: '', description: '', tone: 'first' }

export default function VaccineCatalogForm({ isOpen, onClose, onSave, initial = null }) {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen) {
      setForm(initial ? { ...EMPTY, ...initial } : EMPTY)
      setErrors({})
    }
  }, [isOpen, initial])

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setErrors(er => ({ ...er, [field]: '' }))
  }

  const handleSave = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Requerido'
    if (!form.ageLabel.trim()) errs.ageLabel = 'Requerido'
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSave(form)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? 'Editar vacuna' : 'Nueva vacuna'}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn--primary" onClick={handleSave}>
            {initial ? 'Guardar cambios' : 'Agregar'}
          </button>
        </>
      }
    >
      <div className="form-group">
        <label className="form-label">Nombre *</label>
        <input
          className={`form-input${errors.name ? ' form-input--error' : ''}`}
          value={form.name}
          onChange={set('name')}
          placeholder="Ej: Séxtuple, Antirrábica..."
        />
        {errors.name && <span className="form-error">{errors.name}</span>}
      </div>

      <div className="form-row form-row--2">
        <div className="form-group">
          <label className="form-label">Especie</label>
          <select className="form-input" value={form.species} onChange={set('species')}>
            <option value="dog">Perro</option>
            <option value="cat">Gato</option>
            <option value="both">Ambos</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Tipo</label>
          <select className="form-input" value={form.tone} onChange={set('tone')}>
            <option value="first">Cachorro / Inicial</option>
            <option value="annual">Refuerzo anual</option>
            <option value="optional">Opcional</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Edad / Frecuencia *</label>
        <input
          className={`form-input${errors.ageLabel ? ' form-input--error' : ''}`}
          value={form.ageLabel}
          onChange={set('ageLabel')}
          placeholder="Ej: 45 días, Anual, Opcional..."
        />
        {errors.ageLabel && <span className="form-error">{errors.ageLabel}</span>}
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Descripción</label>
        <textarea
          className="form-input"
          value={form.description}
          onChange={set('description')}
          placeholder="Enfermedades que cubre, indicaciones..."
          rows={3}
        />
      </div>
    </Modal>
  )
}
