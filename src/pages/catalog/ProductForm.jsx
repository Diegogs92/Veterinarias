import { useState, useEffect } from 'react'
import Modal from '../../components/ui/Modal'
import BarcodeScanner from '../../components/ui/BarcodeScanner'
import { ScanLine } from 'lucide-react'
import { useApp } from '../../context/AppContext'

const EMPTY = { name: '', categoryId: '', price: '', inStock: true, barcode: '' }

export default function ProductForm({ isOpen, onClose, onSave, initial = null }) {
  const { productCategories } = useApp()
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [scannerOpen, setScannerOpen] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setForm(initial
        ? { ...EMPTY, ...initial, price: String(Math.round(initial.price)), barcode: initial.barcode ?? '' }
        : EMPTY
      )
      setErrors({})
    }
  }, [isOpen, initial])

  const set = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(f => ({ ...f, [field]: value }))
    setErrors(er => ({ ...er, [field]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Requerido'
    if (!form.price || isNaN(parseInt(form.price, 10)) || parseInt(form.price, 10) < 0) errs.price = 'Precio válido requerido'
    return errs
  }

  const handleSave = () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSave({ ...form, price: parseInt(form.price, 10) })
    onClose()
  }

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? 'Editar producto' : 'Nuevo producto'}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn--primary" onClick={handleSave}>
            {initial ? 'Guardar cambios' : 'Agregar producto'}
          </button>
        </>
      }
    >
      <div className="form-group">
        <label className="form-label">Nombre del producto *</label>
        <input
          className={`form-input${errors.name ? ' form-input--error' : ''}`}
          value={form.name} onChange={set('name')} autoFocus
          placeholder="Ej: Amoxicilina 500mg x 20 comp"
        />
        {errors.name && <span className="form-error">{errors.name}</span>}
      </div>

      <div className="form-row form-row--2">
        <div className="form-group">
          <label className="form-label">Categoría</label>
          <select className="form-input" value={form.categoryId} onChange={set('categoryId')}>
            <option value="">Sin categoría</option>
            {productCategories.items.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Precio (ARS) *</label>
          <input
            className={`form-input${errors.price ? ' form-input--error' : ''}`}
            type="number" min="0" step="1"
            value={form.price} onChange={set('price')} placeholder="0"
          />
          {errors.price && <span className="form-error">{errors.price}</span>}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Código de barras</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="form-input"
            value={form.barcode} onChange={set('barcode')}
            placeholder="7790001234"
            style={{ flex: 1 }}
          />
          <button
            type="button"
            className="btn btn--subtle btn--icon"
            onClick={() => setScannerOpen(true)}
            title="Escanear con cámara"
            style={{ flexShrink: 0 }}
          >
            <ScanLine size={18} strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Disponibilidad</label>
        <div className="toggle-group">
          <button
            type="button"
            className={`toggle-btn${form.inStock ? ' on--ok' : ''}`}
            onClick={() => setForm(f => ({ ...f, inStock: true }))}
          >
            ✅ En stock
          </button>
          <button
            type="button"
            className={`toggle-btn${!form.inStock ? ' on--danger' : ''}`}
            onClick={() => setForm(f => ({ ...f, inStock: false }))}
          >
            ✗ Sin stock
          </button>
        </div>
      </div>
    </Modal>

    <BarcodeScanner
      isOpen={scannerOpen}
      onClose={() => setScannerOpen(false)}
      onScan={(code) => { setForm(f => ({ ...f, barcode: code })); setScannerOpen(false) }}
      title="Escanear código de barras"
    />
    </>
  )
}
