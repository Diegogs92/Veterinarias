import { useState, useEffect } from 'react'
import Modal from '../../components/ui/Modal'

const EMPTY = { name: '' }

export default function CategoryForm({ isOpen, onClose, onSave, initial = null }) {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen) { setForm(initial || EMPTY); setErrors({}) }
  }, [isOpen, initial])

  const handleSave = () => {
    if (!form.name.trim()) { setErrors({ name: 'Requerido' }); return }
    onSave(form)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? 'Editar categoría' : 'Nueva categoría'}
      size="sm"
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn--primary" onClick={handleSave}>
            {initial ? 'Guardar' : 'Crear'}
          </button>
        </>
      }
    >
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Nombre de la categoría *</label>
        <input
          className={`form-input${errors.name ? ' form-input--error' : ''}`}
          value={form.name}
          onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors({}) }}
          placeholder="Ej: Medicamentos, Alimentos..."
          autoFocus
        />
        {errors.name && <span style={{ color: 'var(--red)', fontSize: 12 }}>{errors.name}</span>}
      </div>
    </Modal>
  )
}
