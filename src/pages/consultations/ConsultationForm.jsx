import { useState, useEffect } from 'react'
import Modal from '../../components/ui/Modal'
import { useApp } from '../../context/AppContext'
import { todayStr, formatCurrency } from '../../utils/helpers'

const EMPTY = {
  petId: '', date: todayStr(), reason: '', diagnosis: '',
  treatment: '', medication: '', observations: '',
  price: '', paymentStatus: 'paid', paidAmount: '',
}

export default function ConsultationForm({ isOpen, onClose, onSave, initial = null, defaultPetId = '' }) {
  const { pets, owners } = useApp()
  const [form, setForm] = useState(initial || { ...EMPTY, petId: defaultPetId })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen) {
      setErrors({})
      setForm(initial
        ? { ...initial, price: initial.price != null ? String(initial.price) : '', paidAmount: initial.paidAmount != null ? String(initial.paidAmount) : '' }
        : { ...EMPTY, petId: defaultPetId }
      )
    }
  }, [isOpen, initial, defaultPetId])

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setErrors(er => ({ ...er, [field]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.petId)         errs.petId  = 'Seleccioná una mascota'
    if (!form.date)          errs.date   = 'Requerido'
    if (!form.reason.trim()) errs.reason = 'Requerido'
    if (form.price && (isNaN(parseFloat(form.price)) || parseFloat(form.price) < 0)) errs.price = 'Precio inválido'
    if (form.paymentStatus === 'partial') {
      const paid = parseFloat(form.paidAmount)
      if (!paid || paid <= 0) errs.paidAmount = 'Ingresá el monto pagado'
    }
    return errs
  }

  const priceVal = parseFloat(form.price) || 0

  const handleSave = () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    const paidAmount = form.paymentStatus === 'paid' ? priceVal
      : form.paymentStatus === 'partial' ? parseFloat(form.paidAmount) || 0
      : 0
    onSave({ ...form, price: priceVal, paidAmount })
    onClose()
  }

  const paymentLabel = { paid: 'Pagado', unpaid: 'No pagado', partial: 'Pago parcial' }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? 'Editar consulta' : 'Nueva consulta'}
      size="lg"
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn--primary" onClick={handleSave}>
            {initial ? 'Guardar cambios' : 'Registrar consulta'}
          </button>
        </>
      }
    >
      <div className="form-row form-row--2">
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
          <label className="form-label">Fecha *</label>
          <input className={`form-input${errors.date ? ' form-input--error' : ''}`} type="date" value={form.date} onChange={set('date')} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Motivo de consulta *</label>
        <input
          className={`form-input${errors.reason ? ' form-input--error' : ''}`}
          value={form.reason} onChange={set('reason')}
          placeholder="Vómitos, fiebre, control, accidente..."
        />
        {errors.reason && <span style={{ color: 'var(--red)', fontSize: 12 }}>{errors.reason}</span>}
      </div>

      <div className="form-group">
        <label className="form-label">Diagnóstico</label>
        <textarea className="form-input" value={form.diagnosis} onChange={set('diagnosis')} placeholder="Diagnóstico clínico..." rows={2} />
      </div>

      <div className="form-group">
        <label className="form-label">Tratamiento</label>
        <textarea className="form-input" value={form.treatment} onChange={set('treatment')} placeholder="Indicaciones, reposo, cirugía..." rows={2} />
      </div>

      <div className="form-group">
        <label className="form-label">Medicación</label>
        <input className="form-input" value={form.medication} onChange={set('medication')} placeholder="Nombre del medicamento, dosis, frecuencia..." />
      </div>

      <div className="form-group">
        <label className="form-label">Observaciones</label>
        <textarea className="form-input" value={form.observations} onChange={set('observations')} placeholder="Notas adicionales, próximo control..." rows={2} />
      </div>

      {/* Price & payment */}
      <div className="form-group">
        <label className="form-label">Precio de la consulta (ARS)</label>
        <input
          className={`form-input${errors.price ? ' form-input--error' : ''}`}
          type="number" min="0" step="100"
          value={form.price}
          onChange={e => { setForm(f => ({ ...f, price: e.target.value })); setErrors(er => ({ ...er, price: '' })) }}
          placeholder="0 (sin cargo)"
        />
        {errors.price && <span style={{ color: 'var(--red)', fontSize: 12 }}>{errors.price}</span>}
      </div>

      {priceVal > 0 && (
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Estado de pago</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['paid', 'unpaid', 'partial'].map(status => (
              <button
                key={status}
                type="button"
                onClick={() => setForm(f => ({ ...f, paymentStatus: status }))}
                style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                  border: '2px solid',
                  borderColor: form.paymentStatus === status
                    ? status === 'paid' ? 'var(--vet-emerald)' : status === 'unpaid' ? 'var(--vet-rose)' : 'var(--vet-amber)'
                    : 'var(--border)',
                  background: form.paymentStatus === status
                    ? status === 'paid' ? 'rgba(16,185,129,0.12)' : status === 'unpaid' ? 'rgba(244,63,94,0.12)' : 'rgba(245,158,11,0.12)'
                    : 'transparent',
                  color: form.paymentStatus === status
                    ? status === 'paid' ? 'var(--vet-emerald)' : status === 'unpaid' ? 'var(--vet-rose)' : 'var(--vet-amber)'
                    : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                {paymentLabel[status]}
              </button>
            ))}
          </div>
          {form.paymentStatus === 'partial' && (
            <div className="form-group" style={{ marginTop: 10, marginBottom: 0 }}>
              <label className="form-label">Monto pagado (ARS) *</label>
              <input
                className={`form-input${errors.paidAmount ? ' form-input--error' : ''}`}
                type="number" min="0" step="100"
                value={form.paidAmount}
                onChange={e => { setForm(f => ({ ...f, paidAmount: e.target.value })); setErrors(er => ({ ...er, paidAmount: '' })) }}
                placeholder="0"
              />
              {errors.paidAmount && <span style={{ color: 'var(--red)', fontSize: 12 }}>{errors.paidAmount}</span>}
              {priceVal > 0 && parseFloat(form.paidAmount) > 0 && (
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4, display: 'block' }}>
                  Saldo pendiente: {formatCurrency(priceVal - parseFloat(form.paidAmount))}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
