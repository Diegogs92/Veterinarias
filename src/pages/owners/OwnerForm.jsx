import { useState, useEffect } from 'react'
import Modal from '../../components/ui/Modal'

const EMPTY = { name: '', apellido: '', dni: '', phone: '', email: '', address: '', discount: 0 }

export default function OwnerForm({ isOpen, onClose, onSave, initial = null }) {
  const [form, setForm] = useState(initial || EMPTY)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen) { setForm(initial || EMPTY); setErrors({}) }
  }, [isOpen, initial])

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setErrors(er => ({ ...er, [field]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim())  errs.name  = 'Requerido'
    if (!form.phone.trim()) errs.phone = 'Requerido'
    return errs
  }

  const handleSave = () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSave(form)
    onClose()
    setForm(EMPTY)
  }

  const handleClose = () => { onClose(); setForm(initial || EMPTY); setErrors({}) }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={initial ? 'Editar dueño' : 'Nuevo dueño'}
      footer={
        <>
          <button className="btn btn--ghost" onClick={handleClose}>Cancelar</button>
          <button className="btn btn--primary" onClick={handleSave}>
            {initial ? 'Guardar cambios' : 'Agregar dueño'}
          </button>
        </>
      }
    >
      <div className="form-row form-row--2">
        <div className="form-group">
          <label className="form-label">Nombre *</label>
          <input
            className={`form-input${errors.name ? ' form-input--error' : ''}`}
            value={form.name} onChange={set('name')} placeholder="Nombre" autoFocus
          />
          {errors.name && <span className="form-error">{errors.name}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Apellido</label>
          <input className="form-input" value={form.apellido} onChange={set('apellido')} placeholder="Apellido" />
        </div>
      </div>

      <div className="form-row form-row--2">
        <div className="form-group">
          <label className="form-label">DNI</label>
          <input className="form-input" value={form.dni} onChange={set('dni')} placeholder="12345678" />
        </div>
        <div className="form-group">
          <label className="form-label">Teléfono *</label>
          <input
            className={`form-input${errors.phone ? ' form-input--error' : ''}`}
            type="tel" value={form.phone} onChange={set('phone')} placeholder="11-1234-5678"
          />
          {errors.phone && <span className="form-error">{errors.phone}</span>}
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Email</label>
        <input className="form-input" type="email" value={form.email} onChange={set('email')} placeholder="correo@email.com" />
      </div>

      <div className="form-group">
        <label className="form-label">Dirección</label>
        <input className="form-input" value={form.address} onChange={set('address')} placeholder="Calle 123, Ciudad" />
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Descuento especial (%)</label>
        <input
          className="form-input" type="number" min="0" max="100" step="1"
          value={form.discount ?? 0} onFocus={e => e.target.select()} onChange={set('discount')} placeholder="0"
        />
        <span className="form-hint">Se aplica automáticamente en cada venta</span>
      </div>
    </Modal>
  )
}
