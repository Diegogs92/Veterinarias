import { useState, useEffect } from 'react'
import Modal from '../../components/ui/Modal'
import { useApp } from '../../context/AppContext'
import { todayStr } from '../../utils/helpers'

const EMPTY = {
  type: 'consultation', description: '', price: '', date: todayStr(),
  ownerId: '', petId: '',
}

export default function SaleForm({ isOpen, onClose, onSave, initial = null }) {
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
    if (!form.description.trim()) errs.description = 'Requerido'
    if (!form.price || isNaN(parseFloat(form.price)) || parseFloat(form.price) <= 0) errs.price = 'Precio válido requerido'
    if (!form.date) errs.date = 'Requerido'
    return errs
  }

  const handleSave = () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSave({ ...form, price: parseFloat(form.price) })
    onClose()
  }

  const filteredPets = form.ownerId
    ? pets.items.filter(p => p.ownerId === form.ownerId)
    : pets.items

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? 'Editar venta' : 'Registrar venta'}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn--primary" onClick={handleSave}>
            {initial ? 'Guardar' : 'Registrar'}
          </button>
        </>
      }
    >
      <div className="form-row form-row--2">
        <div className="form-group">
          <label className="form-label">Tipo</label>
          <select className="form-input" value={form.type} onChange={set('type')}>
            <option value="consultation">🩺 Consulta</option>
            <option value="product">📦 Producto / Insumo</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Fecha *</label>
          <input className={`form-input${errors.date ? ' form-input--error' : ''}`} type="date" value={form.date} onChange={set('date')} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Descripción *</label>
        <input
          className={`form-input${errors.description ? ' form-input--error' : ''}`}
          value={form.description}
          onChange={set('description')}
          placeholder={form.type === 'consultation' ? 'Consulta general, vacunas...' : 'Nombre del producto, medicamento...'}
        />
        {errors.description && <span style={{ color: 'var(--red)', fontSize: 12 }}>{errors.description}</span>}
      </div>

      <div className="form-group">
        <label className="form-label">Precio (ARS) *</label>
        <input
          className={`form-input${errors.price ? ' form-input--error' : ''}`}
          type="number"
          min="0"
          step="100"
          value={form.price}
          onChange={set('price')}
          placeholder="0"
        />
        {errors.price && <span style={{ color: 'var(--red)', fontSize: 12 }}>{errors.price}</span>}
      </div>

      <div className="form-row form-row--2">
        <div className="form-group">
          <label className="form-label">Dueño</label>
          <select className="form-input" value={form.ownerId} onChange={set('ownerId')}>
            <option value="">Seleccionar dueño...</option>
            {owners.items.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Mascota</label>
          <select className="form-input" value={form.petId} onChange={set('petId')}>
            <option value="">Seleccionar mascota...</option>
            {filteredPets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>
    </Modal>
  )
}
