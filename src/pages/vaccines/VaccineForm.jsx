import { useState, useEffect } from 'react'
import Modal from '../../components/ui/Modal'
import { useApp } from '../../context/AppContext'
import { todayStr } from '../../utils/helpers'

const EMPTY = { petId: '', vaccineName: '', catalogId: '', date: todayStr(), nextDue: '', notes: '' }

function addOneYear(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().slice(0, 10)
}

export default function VaccineForm({ isOpen, onClose, onSave, initial = null }) {
  const { pets, owners, vaccineCatalog } = useApp()
  const [form, setForm]   = useState(EMPTY)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen) {
      setForm(initial ? { ...EMPTY, ...initial } : EMPTY)
      setErrors({})
    }
  }, [isOpen, initial])

  const set = (field) => (e) => {
    const value = e.target.value
    setForm(f => {
      const next = { ...f, [field]: value }
      if (field === 'date' && !initial) next.nextDue = addOneYear(value)
      return next
    })
    setErrors(er => ({ ...er, [field]: '' }))
  }

  const handleCatalogSelect = (e) => {
    const id = e.target.value
    const entry = vaccineCatalog.items.find(v => v.id === id)
    setForm(f => ({ ...f, catalogId: id, vaccineName: entry ? entry.name : '' }))
    setErrors(er => ({ ...er, vaccineName: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.petId) errs.petId = 'Requerido'
    if (!form.vaccineName.trim()) errs.vaccineName = 'Requerido'
    if (!form.date) errs.date = 'Requerido'
    return errs
  }

  const handleSave = () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSave(form)
    onClose()
  }

  const sortedPets = [...pets.items].sort((a, b) => a.name.localeCompare(b.name))
  const catalogOptions = [...vaccineCatalog.items].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial?.petId ? 'Editar registro de vacuna' : 'Registrar vacuna'}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn--primary" onClick={handleSave}>
            {initial?.petId ? 'Guardar cambios' : 'Registrar'}
          </button>
        </>
      }
    >
      <div className="form-group">
        <label className="form-label">Mascota *</label>
        <select
          className={`form-input${errors.petId ? ' form-input--error' : ''}`}
          value={form.petId}
          onChange={set('petId')}
        >
          <option value="">Seleccionar mascota...</option>
          {sortedPets.map(p => {
            const owner = owners.find(p.ownerId)
            return (
              <option key={p.id} value={p.id}>
                {p.name}{owner ? ` — ${owner.name}${owner.apellido ? ` ${owner.apellido}` : ''}` : ''}
              </option>
            )
          })}
        </select>
        {errors.petId && <span className="form-error">{errors.petId}</span>}
      </div>

      <div className="form-group">
        <label className="form-label">Vacuna *</label>
        {catalogOptions.length > 0 && (
          <select
            className="form-input"
            value={form.catalogId || ''}
            onChange={handleCatalogSelect}
            style={{ marginBottom: 8 }}
          >
            <option value="">Seleccionar del catálogo...</option>
            {catalogOptions.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
            <option value="__custom">Otra / personalizada</option>
          </select>
        )}
        <input
          className={`form-input${errors.vaccineName ? ' form-input--error' : ''}`}
          value={form.vaccineName}
          onChange={set('vaccineName')}
          placeholder="Nombre de la vacuna"
        />
        {errors.vaccineName && <span className="form-error">{errors.vaccineName}</span>}
      </div>

      <div className="form-row form-row--2">
        <div className="form-group">
          <label className="form-label">Fecha aplicada *</label>
          <input
            className={`form-input${errors.date ? ' form-input--error' : ''}`}
            type="date" value={form.date} onChange={set('date')}
          />
          {errors.date && <span className="form-error">{errors.date}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Próximo vencimiento</label>
          <input
            className="form-input"
            type="date" value={form.nextDue} onChange={set('nextDue')}
          />
          <span className="form-hint">Se calcula automáticamente como +1 año</span>
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Observaciones</label>
        <textarea
          className="form-input"
          value={form.notes}
          onChange={set('notes')}
          placeholder="Lote, veterinario, reacciones..."
          rows={3}
        />
      </div>
    </Modal>
  )
}
