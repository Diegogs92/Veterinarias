import { useState, useEffect, useMemo } from 'react'
import Modal from '../../components/ui/Modal'
import BarcodeScanner from '../../components/ui/BarcodeScanner'
import { useApp } from '../../context/AppContext'
import { todayStr, formatCurrency } from '../../utils/helpers'
import { Plus, Trash2, Search, ScanLine } from 'lucide-react'

const EMPTY = {
  ownerId: '', petId: '', items: [],
  discount: 0, subtotal: 0, total: 0,
  paymentStatus: 'paid', paidAmount: 0,
  date: todayStr(),
}

export default function SaleForm({ isOpen, onClose, onSave, initial = null }) {
  const { owners, pets, products } = useApp()
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [productSearch, setProductSearch] = useState('')
  const [showProductSearch, setShowProductSearch] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scanFeedback, setScanFeedback] = useState(null)  // { found: bool, name: string }

  useEffect(() => {
    if (isOpen) {
      setErrors({})
      setProductSearch('')
      setShowProductSearch(false)
      if (initial) {
        setForm({ ...initial, paidAmount: initial.paidAmount ?? 0 })
      } else {
        setForm(EMPTY)
      }
    }
  }, [isOpen, initial])

  // ── Derived calculations ───────────────────────────────────────────────────
  const subtotal = useMemo(
    () => form.items.reduce((sum, item) => sum + item.subtotal, 0),
    [form.items]
  )
  const discountAmount = useMemo(
    () => Math.round(subtotal * (parseFloat(form.discount) || 0) / 100),
    [subtotal, form.discount]
  )
  const total = subtotal - discountAmount

  // ── Owner change → auto-load discount ─────────────────────────────────────
  const handleOwnerChange = (e) => {
    const ownerId = e.target.value
    const owner = owners.items.find(o => o.id === ownerId)
    setForm(f => ({ ...f, ownerId, petId: '', discount: owner?.discount ?? 0 }))
    setErrors(er => ({ ...er, ownerId: '' }))
  }

  const filteredPets = form.ownerId
    ? pets.items.filter(p => p.ownerId === form.ownerId)
    : pets.items

  // ── Product search & add ───────────────────────────────────────────────────
  const searchedProducts = useMemo(() => {
    const q = productSearch.toLowerCase()
    if (!q) return products.items.filter(p => p.inStock).slice(0, 8)
    return products.items
      .filter(p => p.inStock && (p.name.toLowerCase().includes(q) || (p.barcode || '').includes(q)))
      .slice(0, 8)
  }, [products.items, productSearch])

  const addProduct = (product) => {
    setForm(f => {
      const existing = f.items.findIndex(i => i.productId === product.id)
      if (existing >= 0) {
        const items = [...f.items]
        items[existing] = {
          ...items[existing],
          quantity: items[existing].quantity + 1,
          subtotal: (items[existing].quantity + 1) * items[existing].unitPrice,
        }
        return { ...f, items }
      }
      return {
        ...f,
        items: [...f.items, {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitPrice: product.price,
          subtotal: product.price,
        }],
      }
    })
    setProductSearch('')
    setShowProductSearch(false)
  }

  const handleBarcodeScan = (code) => {
    const product = products.items.find(p => p.barcode === code && p.inStock)
    if (product) {
      addProduct(product)
      setScanFeedback({ found: true, name: product.name })
    } else {
      setScanFeedback({ found: false, name: code })
    }
    setTimeout(() => setScanFeedback(null), 3000)
  }

  const removeItem = (idx) => {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))
  }

  const updateQty = (idx, qty) => {
    const q = Math.max(1, parseInt(qty) || 1)
    setForm(f => {
      const items = [...f.items]
      items[idx] = { ...items[idx], quantity: q, subtotal: q * items[idx].unitPrice }
      return { ...f, items }
    })
  }

  // ── Validate & save ────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {}
    if (!form.ownerId) errs.ownerId = 'Requerido'
    if (form.items.length === 0) errs.items = 'Agregá al menos un producto'
    if (!form.date) errs.date = 'Requerido'
    if (form.paymentStatus === 'partial') {
      const paid = parseFloat(form.paidAmount)
      if (!paid || paid <= 0) errs.paidAmount = 'Ingresá el monto pagado'
      else if (paid >= total) errs.paidAmount = 'Si ya pagó todo, seleccioná "Pagado"'
    }
    return errs
  }

  const handleSave = () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    const paidAmount = form.paymentStatus === 'paid' ? total
      : form.paymentStatus === 'partial' ? parseFloat(form.paidAmount)
      : 0

    onSave({
      ...form,
      discount: parseFloat(form.discount) || 0,
      subtotal,
      total,
      paidAmount,
    })
  }

  const paymentLabel = { paid: 'Pagado', unpaid: 'No pagado', partial: 'Pago parcial' }

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? 'Editar venta' : 'Registrar venta'}
      size="lg"
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn--primary" onClick={handleSave}>
            {initial ? 'Guardar cambios' : 'Registrar venta'}
          </button>
        </>
      }
    >
      {/* Owner + Pet */}
      <div className="form-row form-row--2">
        <div className="form-group">
          <label className="form-label">Dueño *</label>
          <select
            className={`form-input${errors.ownerId ? ' form-input--error' : ''}`}
            value={form.ownerId}
            onChange={handleOwnerChange}
          >
            <option value="">Seleccionar dueño...</option>
            {owners.items.sort((a, b) => a.name.localeCompare(b.name)).map(o => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
          {errors.ownerId && <span style={{ color: 'var(--red)', fontSize: 12 }}>{errors.ownerId}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Mascota</label>
          <select
            className="form-input"
            value={form.petId}
            onChange={e => setForm(f => ({ ...f, petId: e.target.value }))}
            disabled={!form.ownerId}
          >
            <option value="">Sin mascota</option>
            {filteredPets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      {/* Product search */}
      <div className="form-group">
        <label className="form-label">Agregar productos</label>
        <div style={{ display: 'flex', gap: 6 }}>
          <div className="search-wrap" style={{ flex: 1 }}>
            <Search size={14} className="search-icon" />
            <input
              className="form-input"
              style={{ paddingLeft: 36 }}
              placeholder="Buscar por nombre o código de barras..."
              value={productSearch}
              onChange={e => { setProductSearch(e.target.value); setShowProductSearch(true) }}
              onFocus={() => setShowProductSearch(true)}
              onBlur={() => setTimeout(() => setShowProductSearch(false), 150)}
            />
          </div>
          <button
            type="button"
            className="btn btn--subtle btn--icon"
            onClick={() => setScannerOpen(true)}
            title="Escanear código de barras"
            style={{ flexShrink: 0 }}
          >
            <ScanLine size={16} strokeWidth={2} />
          </button>
        </div>
        {errors.items && <span style={{ color: 'var(--red)', fontSize: 12 }}>{errors.items}</span>}
        {scanFeedback && (
          <div style={{
            marginTop: 6, padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 500,
            background: scanFeedback.found ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)',
            color: scanFeedback.found ? 'var(--vet-emerald)' : 'var(--vet-rose)',
            border: `1px solid ${scanFeedback.found ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}`,
          }}>
            {scanFeedback.found
              ? `✓ Producto agregado: ${scanFeedback.name}`
              : `Código no encontrado: ${scanFeedback.name}`
            }
          </div>
        )}
        {showProductSearch && (
          <div style={{
            background: 'var(--bg-modal)', border: '1px solid var(--border)',
            borderRadius: 8, marginTop: 4, maxHeight: 220, overflowY: 'auto',
          }}>
            {searchedProducts.length === 0 ? (
              <div style={{ padding: '12px 16px', color: 'var(--text-tertiary)', fontSize: 13 }}>
                No hay productos disponibles
              </div>
            ) : searchedProducts.map(p => (
              <button
                key={p.id}
                type="button"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '10px 16px', background: 'none', border: 'none',
                  cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
                onMouseDown={() => addProduct(p)}
              >
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{p.name}</div>
                  {p.barcode && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{p.barcode}</div>}
                </div>
                <div style={{ fontWeight: 700, color: 'var(--vet-teal)', flexShrink: 0, marginLeft: 12 }}>
                  {formatCurrency(p.price)}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Items list */}
      {form.items.length > 0 && (
        <div className="card card--no-hover" style={{ marginBottom: 16, padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 600 }}>Producto</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 600, width: 80 }}>Cant.</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 600 }}>Precio unit.</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 600 }}>Subtotal</th>
                <th style={{ width: 36 }}></th>
              </tr>
            </thead>
            <tbody>
              {form.items.map((item, idx) => (
                <tr key={item.productId} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 12px', fontSize: 14, fontWeight: 500 }}>{item.productName}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    <input
                      type="number" min="1"
                      value={item.quantity}
                      onChange={e => updateQty(idx, e.target.value)}
                      style={{
                        width: 56, textAlign: 'center', padding: '4px 6px',
                        border: '1px solid var(--border)', borderRadius: 6,
                        background: 'var(--surface-2)', color: 'var(--text-primary)', fontSize: 14,
                      }}
                    />
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-secondary)', fontSize: 13 }}>
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--vet-teal)' }}>
                    {formatCurrency(item.subtotal)}
                  </td>
                  <td style={{ padding: '4px 8px' }}>
                    <button
                      type="button"
                      className="btn btn--subtle btn--sm btn--icon"
                      onClick={() => removeItem(idx)}
                      style={{ color: 'var(--vet-rose)' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Discount + date */}
      <div className="form-row form-row--2">
        <div className="form-group">
          <label className="form-label">Descuento (%)</label>
          <input
            className="form-input"
            type="number" min="0" max="100" step="1"
            value={form.discount}
            onChange={e => setForm(f => ({ ...f, discount: e.target.value }))}
            placeholder="0"
          />
          {form.ownerId && (
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4, display: 'block' }}>
              Descuento del cliente: {owners.items.find(o => o.id === form.ownerId)?.discount ?? 0}%
            </span>
          )}
        </div>
        <div className="form-group">
          <label className="form-label">Fecha *</label>
          <input
            className={`form-input${errors.date ? ' form-input--error' : ''}`}
            type="date"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
          />
        </div>
      </div>

      {/* Summary */}
      {form.items.length > 0 && (
        <div style={{
          background: 'var(--surface-2)', borderRadius: 10, padding: '14px 16px',
          marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)' }}>
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {discountAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--vet-rose)' }}>
              <span>Descuento ({form.discount}%)</span>
              <span>− {formatCurrency(discountAmount)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 17, borderTop: '1px solid var(--border)', paddingTop: 8, color: 'var(--vet-teal)' }}>
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      )}

      {/* Payment status */}
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
            {total > 0 && parseFloat(form.paidAmount) > 0 && (
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4, display: 'block' }}>
                Saldo pendiente: {formatCurrency(total - parseFloat(form.paidAmount))}
              </span>
            )}
          </div>
        )}
      </div>
    </Modal>

    <BarcodeScanner
      isOpen={scannerOpen}
      onClose={() => setScannerOpen(false)}
      onScan={handleBarcodeScan}
      title="Escanear producto"
    />
    </>
  )
}
