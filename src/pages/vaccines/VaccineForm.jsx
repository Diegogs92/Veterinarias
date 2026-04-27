import { useState, useEffect } from 'react'
import Modal from '../../components/ui/Modal'
import { useApp } from '../../context/AppContext'
import { todayStr } from '../../utils/helpers'

const VACCINE_OPTIONS = [
  'Quíntuple', 'Séxtuple', 'Séptuple', 'Rabia', 'Parvovirus',
  'Coronavirus', 'Leptospirosis', 'Bordetella', 'Triple viral felina',
  'Leucemia felina', 'Rinotraqueítis felina', 'Otra',
]

const EMPTY = { petId: '', vaccineName: '', date: todayStr(), nextDue: '', notes: '' }

function addOneYear(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().slice(0, 10)
}

export default function VaccineForm({ isOpen, onClose, onSave, initial = null }) {
  const { pets, owners } = useApp()
  const [form, setForm] = useState(EMPTY)
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? 'Editar vacuna' : 'Registrar vacuna'}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn--primary" onClick={handleSave}>
            {initial ? 'Guardar cambios' : 'Registrar'}
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
        <select
          className={`form-input${errors.vaccineName ? ' form-input--error' : ''}`}
          value={VACCINE_OPTIONS.includes(form.vaccineName) ? form.vaccineName : (form.vaccineName ? 'Otra' : '')}
          onChange={e => {
            const v = e.target.value
            setForm(f => ({ ...f, vaccineName: v === 'Otra' ? '' : v }))
            setErrors(er => ({ ...er, vaccineName: '' }))
          }}
        >
          <option value="">Seleccionar vacuna...</option>
          {VACCINE_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        {(!VACCINE_OPTIONS.includes(form.vaccineName) || form.vaccineName === '') && (
          <input
            className={`form-input${errors.vaccineName ? ' form-input--error' : ''}`}
            style={{ marginTop: 8 }}
            value={VACCINE_OPTIONS.includes(form.vaccineName) ? '' : form.vaccineName}
            onChange={set('vaccineName')}
            placeholder="Nombre de la vacuna"
          />
        )}
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
