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
    onSave({ ...form, dailyPrice: parseFloat(form.dailyPrice) || 0, exitDate: form.exitDate || null })
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
        label="Dueño"
      />

      <div className="form-row form-row--2">
        <div className="form-group">
          <label className="form-label">Ingreso *</label>
          <input
            className={`form-input${errors.entryDate ? ' form-input--error' : ''}`}
            type="date" value={form.entryDate} onChange={set('entryDate')}
          />
          {errors.entryDate && <span className="form-error">{errors.entryDate}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Egreso</label>
          <input className="form-input" type="date" value={form.exitDate} onChange={set('exitDate')} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Precio por día</label>
        <input
          className="form-input" type="number" min="0" step="1"
          value={form.dailyPrice} onChange={set('dailyPrice')} placeholder="0"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Alimentación</label>
        <input
          className="form-input"
          value={form.feeding} onChange={set('feeding')}
          placeholder="Ej: 150g de croquetas, 2 veces por día..."
        />
      </div>

      <div className="form-group">
        <label className="form-label">Observaciones</label>
        <textarea
          className="form-input" rows={3}
          value={form.observations} onChange={set('observations')}
          placeholder="Medicación, cuidados especiales, notas para el personal..."
        />
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Estado</label>
        <div className="toggle-group">
          <button
            type="button"
            className={`toggle-btn${form.status === 'active' ? ' on' : ''}`}
            onClick={() => setForm(f => ({ ...f, status: 'active' }))}
          >
            🏠 En pensión
          </button>
          <button
            type="button"
            className={`toggle-btn${form.status === 'completed' ? ' on--ok' : ''}`}
            onClick={() => setForm(f => ({ ...f, status: 'completed' }))}
          >
            ✅ Retirado
          </button>
        </div>
      </div>
    </Modal>
  )
}
