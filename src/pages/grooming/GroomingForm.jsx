import { useState, useEffect } from 'react'
import Modal from '../../components/ui/Modal'
import OwnerSelect from '../../components/ui/OwnerSelect'
import PetSelect from '../../components/ui/PetSelect'
import { useApp } from '../../context/AppContext'
import { todayStr } from '../../utils/helpers'

const SERVICES = ['Baño', 'Corte', 'Corte de uñas', 'Limpieza de orejas', 'Baño + corte completo']

const EMPTY = {
  petId: '', ownerId: '', date: todayStr(),
  services: [], price: '', observations: '', status: 'completed',
}

export default function GroomingForm({ isOpen, onClose, onSave, initial = null }) {
  const { pets } = useApp()
  const [form, setForm] = useState(initial || EMPTY)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen) setForm(initial ? { ...initial, services: initial.services || [] } : EMPTY)
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

  const toggleService = (svc) => {
    setForm(f => ({
      ...f,
      services: f.services.includes(svc)
        ? f.services.filter(s => s !== svc)
        : [...f.services, svc],
    }))
  }

  const validate = () => {
    const errs = {}
    if (!form.petId) errs.petId = 'Seleccioná una mascota'
    if (!form.date)  errs.date  = 'Requerido'
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
      title={initial ? 'Editar turno de peluquería' : 'Nuevo turno de peluquería'}
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
          <label className="form-label">Fecha *</label>
          <input
            className={`form-input${errors.date ? ' form-input--error' : ''}`}
            type="date" value={form.date} onChange={set('date')}
          />
          {errors.date && <span className="form-error">{errors.date}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Estado</label>
          <div className="toggle-group">
            <button
              type="button"
              className={`toggle-btn${form.status === 'scheduled' ? ' on' : ''}`}
              onClick={() => setForm(f => ({ ...f, status: 'scheduled' }))}
            >
              📅 Programado
            </button>
            <button
              type="button"
              className={`toggle-btn${form.status === 'completed' ? ' on--ok' : ''}`}
              onClick={() => setForm(f => ({ ...f, status: 'completed' }))}
            >
              ✅ Realizado
            </button>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Servicios</label>
        <div className="toggle-group">
          {SERVICES.map(svc => (
            <button
              key={svc}
              type="button"
              className={`toggle-btn${form.services.includes(svc) ? ' on' : ''}`}
              onClick={() => toggleService(svc)}
            >
              {svc}
            </button>
          ))}
        </div>
      </div>

      <div className="form-row form-row--2">
        <div className="form-group">
          <label className="form-label">Precio</label>
          <input
            className="form-input" type="number" min="0" step="0.01"
            value={form.price} onChange={set('price')} placeholder="0"
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Observaciones</label>
        <textarea
          className="form-input" rows={2}
          value={form.observations} onChange={set('observations')}
          placeholder="Notas sobre el servicio..."
        />
      </div>
    </Modal>
  )
}
