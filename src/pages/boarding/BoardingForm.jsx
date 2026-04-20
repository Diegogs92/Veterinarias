import { useState, useEffect } from 'react'
import Modal from '../../components/ui/Modal'
import OwnerSelect from '../../components/ui/OwnerSelect'
import PetSelect from '../../components/ui/PetSelect'
import { useApp } from '../../context/AppContext'
import { todayStr } from '../../utils/helpers'

const EMPTY = {
  petId: '', ownerId: '',
  entryDate: todayStr(), exitDate: '',
  dailyPrice: '', feeding: '', observations: '',
  status: 'active',
}

export default function BoardingForm({ isOpen, onClose, onSave, initial = null }) {
  const { pets } = useApp()
  const [form, setForm] = useState(initial || EMPTY)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen) setForm(initial ? { ...initial, exitDate: initial.exitDate || '' } : EMPTY)
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
    if (!form.petId)     errs.petId     = 'Seleccioná una mascota'
    if (!form.entryDate) errs.entryDate = 'Requerido'
    return errs
  }

  const handleSave = () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSave({
      ...form,
      dailyPrice: parseFloat(form.dailyPrice) || 0,
      exitDate: form.exitDate || null,
    })
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? 'Editar pensionado' : 'Nuevo pensionado'}
      size="lg"
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn--primary" onClick={handleSave}>
            {initial ? 'Guardar cambios' : 'Registrar'}
          </button>
        </>
      }
    >
      <PetSelect value={form.petId} onChange={handlePetChange} error={errors.petId} required />
      <OwnerSelect
        value={form.ownerId}
        onChange={id => setForm(f => ({ ...f, ownerId: id }))}
        disabled={!!form.petId}
        label="Dueño (auto-completa al elegir mascota)"
      />

      <div className="form-row form-row--3">
        <div className="form-group">
          <label className="form-label">Fecha de ingreso *</label>
          <input
            className={`form-input${errors.entryDate ? ' form-input--error' : ''}`}
            type="date" value={form.entryDate} onChange={set('entryDate')}
          />
          {errors.entryDate && <span style={{ color: 'var(--red)', fontSize: 12 }}>{errors.entryDate}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Fecha de egreso</label>
          <input className="form-input" type="date" value={form.exitDate} onChange={set('exitDate')} />
        </div>
        <div className="form-group">
          <label className="form-label">Precio por día</label>
          <input
            className="form-input" type="number" min="0" step="0.01"
            value={form.dailyPrice} onChange={set('dailyPrice')}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Alimentación</label>
        <input
          className="form-input"
          value={form.feeding} onChange={set('feeding')}
          placeholder="Ej: Croquetas marca X, 2 veces por día, 150g..."
        />
      </div>

      <div className="form-group">
        <label className="form-label">Observaciones</label>
        <textarea
          className="form-input" rows={3}
          value={form.observations} onChange={set('observations')}
          placeholder="Ej: El dueño dejó cama, juguetes. Tiene medicación, no convive bien con otros perros..."
        />
      </div>

      <div className="form-group">
        <label className="form-label">Estado</label>
        <select className="form-input" value={form.status} onChange={set('status')}>
          <option value="active">🏠 En pensión</option>
          <option value="completed">✅ Retirado</option>
        </select>
      </div>
    </Modal>
  )
}
