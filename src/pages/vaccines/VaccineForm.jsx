import { useState, useEffect } from 'react'
import Modal from '../../components/ui/Modal'
import { useApp } from '../../context/AppContext'
import { todayStr } from '../../utils/helpers'

const COMMON_VACCINES = [
  'Séxtuple / Séptuple (Parvovirus, Moquillo, etc.)',
  'Antirrábica',
  'Triple felina (Rinotraqueítis, Calicivirus, Panleucopenia)',
  'Leucemia felina',
  'Bordetella',
  'Leptospirosis',
  'Giardia',
]

const EMPTY = { petId: '', name: '', appliedDate: todayStr(), nextDose: '', notes: '' }

export default function VaccineForm({ isOpen, onClose, onSave, initial = null, defaultPetId = '' }) {
  const { pets, owners } = useApp()
  const [form, setForm] = useState(initial || { ...EMPTY, petId: defaultPetId })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen) setForm(initial || { ...EMPTY, petId: defaultPetId })
  }, [isOpen, initial, defaultPetId])

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setErrors(er => ({ ...er, [field]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.petId)           errs.petId = 'Seleccioná una mascota'
    if (!form.name.trim())     errs.name  = 'Requerido'
    if (!form.appliedDate)     errs.appliedDate = 'Requerido'
    return errs
  }

  const handleSave = () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSave(form)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? 'Editar vacuna' : 'Registrar vacuna'}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn--primary" onClick={handleSave}>
            {initial ? 'Guardar' : 'Registrar'}
          </button>
        </>
      }
    >
      <div className="form-group">
        <label className="form-label">Mascota *</label>
        <select className={`form-input${errors.petId ? ' form-input--error' : ''}`} value={form.petId} onChange={set('petId')}>
          <option value="">Seleccionar mascota...</option>
          {pets.items.map(p => {
            const owner = owners.find(p.ownerId)
            return <option key={p.id} value={p.id}>{p.name} ({owner?.name || '?'})</option>
          })}
        </select>
        {errors.petId && <span style={{ color: 'var(--red)', fontSize: 12 }}>{errors.petId}</span>}
      </div>

      <div className="form-group">
        <label className="form-label">Nombre de la vacuna *</label>
        <input
          className={`form-input${errors.name ? ' form-input--error' : ''}`}
          list="vaccine-suggestions"
          value={form.name}
          onChange={set('name')}
          placeholder="Nombre de la vacuna..."
        />
        <datalist id="vaccine-suggestions">
          {COMMON_VACCINES.map(v => <option key={v} value={v} />)}
        </datalist>
        {errors.name && <span style={{ color: 'var(--red)', fontSize: 12 }}>{errors.name}</span>}
      </div>

      <div className="form-row form-row--2">
        <div className="form-group">
          <label className="form-label">Fecha aplicada *</label>
          <input className={`form-input${errors.appliedDate ? ' form-input--error' : ''}`} type="date" value={form.appliedDate} onChange={set('appliedDate')} />
        </div>
        <div className="form-group">
          <label className="form-label">Próxima dosis</label>
          <input className="form-input" type="date" value={form.nextDose} onChange={set('nextDose')} />
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Notas</label>
        <input className="form-input" value={form.notes} onChange={set('notes')} placeholder="Observaciones adicionales..." />
      </div>
    </Modal>
  )
}
