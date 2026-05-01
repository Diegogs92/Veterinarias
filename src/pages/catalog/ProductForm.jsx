import { useState, useEffect, useRef } from 'react'
import Modal from '../../components/ui/Modal'
import BarcodeScanner from '../../components/ui/BarcodeScanner'
import { ScanLine, ImagePlus, X } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { supabase } from '../../lib/supabase'

const EMPTY = { name: '', categoryId: '', price: '', inStock: true, barcode: '', photoUrl: '', stock: '' }
const BUCKET = 'product-photos'

export default function ProductForm({ isOpen, onClose, onSave, initial = null }) {
  const { productCategories } = useApp()
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [scannerOpen, setScannerOpen] = useState(false)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef()

  useEffect(() => {
    if (isOpen) {
      setForm(initial
        ? {
            ...EMPTY, ...initial,
            price: String(Math.round(initial.price)),
            barcode: initial.barcode ?? '',
            photoUrl: initial.photoUrl ?? '',
            stock: initial.stock != null ? String(initial.stock) : '',
          }
        : EMPTY
      )
      setErrors({})
      setPhotoFile(null)
      setPhotoPreview(null)
    }
  }, [isOpen, initial])

  const set = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(f => ({ ...f, [field]: value }))
    setErrors(er => ({ ...er, [field]: '' }))
  }

  const handleStockChange = (e) => {
    const raw = e.target.value
    if (raw === '') {
      setForm(f => ({ ...f, stock: '' }))
    } else {
      const val = Math.max(0, parseInt(raw, 10) || 0)
      setForm(f => ({ ...f, stock: String(val), inStock: val > 0 }))
    }
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const clearPhoto = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
    setForm(f => ({ ...f, photoUrl: '' }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Requerido'
    if (!form.price || isNaN(parseInt(form.price, 10)) || parseInt(form.price, 10) < 0) errs.price = 'Precio válido requerido'
    return errs
  }

  const handleSave = async () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    let photoUrl = form.photoUrl

    if (photoFile) {
      setUploading(true)
      const ext = photoFile.name.split('.').pop()
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`
      const { error } = await supabase.storage.from(BUCKET).upload(path, photoFile, { upsert: false })
      setUploading(false)
      if (error) {
        alert(`Error al subir la foto: ${error.message}`)
        return
      }
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
      photoUrl = data.publicUrl
    }

    const stockVal = form.stock === '' ? null : parseInt(form.stock, 10)
    const inStock  = stockVal != null ? stockVal > 0 : form.inStock

    onSave({ ...form, price: parseInt(form.price, 10), photoUrl, stock: stockVal, inStock })
    onClose()
  }

  const displayPhoto = photoPreview || form.photoUrl
  const tracksStock  = form.stock !== ''

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? 'Editar producto' : 'Nuevo producto'}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose} disabled={uploading}>Cancelar</button>
          <button className="btn btn--primary" onClick={handleSave} disabled={uploading}>
            {uploading ? 'Subiendo foto...' : initial ? 'Guardar cambios' : 'Agregar producto'}
          </button>
        </>
      }
    >
      <div className="form-group">
        <label className="form-label">Foto del producto</label>
        {displayPhoto ? (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img
              src={displayPhoto}
              alt="preview"
              style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 10, border: '1.5px solid var(--border)', display: 'block' }}
            />
            <button
              type="button"
              onClick={clearPhoto}
              style={{
                position: 'absolute', top: -8, right: -8,
                width: 22, height: 22, borderRadius: '50%',
                background: 'var(--danger)', color: '#fff',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: 96, height: 96, borderRadius: 10,
              border: '2px dashed var(--border)',
              background: 'var(--bg-secondary)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 6, cursor: 'pointer', color: 'var(--text-tertiary)',
              fontSize: 12,
            }}
          >
            <ImagePlus size={22} strokeWidth={1.5} />
            Agregar foto
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handlePhotoChange}
        />
      </div>

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
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontWeight: 600, pointerEvents: 'none' }}>$</span>
            <input
              className={`form-input${errors.price ? ' form-input--error' : ''}`}
              type="number" min="0" step="1"
              value={form.price} onFocus={e => e.target.select()} onChange={set('price')} placeholder="0"
              style={{ paddingLeft: 26 }}
            />
          </div>
          {errors.price && <span className="form-error">{errors.price}</span>}
        </div>
      </div>

      <div className="form-row form-row--2">
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
        <div className="form-group">
          <label className="form-label">Stock (unidades)</label>
          <input
            className="form-input"
            type="number" min="0" step="1"
            value={form.stock}
            onFocus={e => e.target.select()}
            onChange={handleStockChange}
            placeholder="Sin control"
          />
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, display: 'block' }}>
            Dejá vacío si no llevás control de unidades
          </span>
        </div>
      </div>

      {!tracksStock && (
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
      )}
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
