import { useState, useEffect, useMemo } from 'react'
import StepWizard from '../../components/ui/StepWizard'
import BarcodeScanner from '../../components/ui/BarcodeScanner'
import OwnerSelect from '../../components/ui/OwnerSelect'
import PetSelect from '../../components/ui/PetSelect'
import { useApp } from '../../context/AppContext'
import { todayStr, formatCurrency } from '../../utils/helpers'
import { Trash2, Search, ScanLine, Plus, Minus, CircleCheck, CircleX, Clock, AlertTriangle, Package } from 'lucide-react'

const EMPTY = { ownerId: '', petId: '', items: [], discount: 0, paidAmount: 0, date: todayStr() }
const STEPS  = ['Cliente', 'Productos', 'Pago']

const deriveStatus = (paid, total) => {
  const p = parseFloat(paid) || 0
  if (p <= 0)       return 'unpaid'
  if (p >= total)   return 'paid'
  return 'partial'
}
const STATUS_CFG = {
  paid:    { label: 'Pagado total',  Icon: CircleCheck, bg: 'var(--ok-3)',     color: 'var(--ok)',     border: 'var(--ok)' },
  unpaid:  { label: 'No pagado',     Icon: CircleX,     bg: 'var(--danger-3)', color: 'var(--danger)', border: 'var(--danger)' },
  partial: { label: 'Pago parcial',  Icon: Clock,       bg: 'var(--warn-3)',   color: 'var(--warn)',   border: 'var(--warn)' },
}

export default function SaleForm({ isOpen, onClose, onSave, initial = null }) {
  const { owners, pets, products, debts } = useApp()
  const [form, setForm]         = useState(EMPTY)
  const [errors, setErrors]     = useState({})
  const [step, setStep]         = useState(0)
  const [productSearch, setProductSearch] = useState('')
  const [showDropdown, setShowDropdown]   = useState(false)
  const [scannerOpen, setScannerOpen]     = useState(false)
  const [scanFeedback, setScanFeedback]   = useState(null)

  useEffect(() => {
    if (isOpen) {
      setStep(0); setErrors({}); setProductSearch(''); setShowDropdown(false)
      setForm(initial ? { ...initial, paidAmount: initial.paidAmount ?? 0 } : EMPTY)
    }
  }, [isOpen, initial])

  const subtotal       = useMemo(() => form.items.reduce((s, i) => s + i.subtotal, 0), [form.items])
  const discountAmount = useMemo(() => Math.round(subtotal * (parseFloat(form.discount) || 0) / 100), [subtotal, form.discount])
  const total          = subtotal - discountAmount
  const ownerDebt      = useMemo(() => debts.items
    .filter(d => d.ownerId === form.ownerId && d.status !== 'paid')
    .reduce((sum, d) => sum + ((d.totalAmount || 0) - (d.paidAmount || 0)), 0),
    [debts.items, form.ownerId]
  )

  const handleOwnerChange = (ownerId) => {
    const owner = owners.items.find(o => o.id === ownerId)
    setForm(f => ({ ...f, ownerId, petId: '', discount: owner?.discount ?? 0 }))
    setErrors(er => ({ ...er, ownerId: '' }))
  }

  const searchedProducts = useMemo(() => {
    const q = productSearch.toLowerCase()
    if (!q) return products.items.filter(p => p.inStock).slice(0, 8)
    return products.items.filter(p => p.inStock && (p.name.toLowerCase().includes(q) || (p.barcode || '').includes(q))).slice(0, 8)
  }, [products.items, productSearch])

  const addProduct = (product) => {
    setForm(f => {
      const idx = f.items.findIndex(i => i.productId === product.id)
      if (idx >= 0) {
        const items = [...f.items]
        items[idx] = { ...items[idx], quantity: items[idx].quantity + 1, subtotal: (items[idx].quantity + 1) * items[idx].unitPrice }
        return { ...f, items }
      }
      return { ...f, items: [...f.items, { productId: product.id, productName: product.name, quantity: 1, unitPrice: product.price, subtotal: product.price }] }
    })
    setProductSearch(''); setShowDropdown(false)
    setErrors(er => ({ ...er, items: '' }))
  }

  const handleBarcodeScan = (code) => {
    const product = products.items.find(p => p.barcode === code && p.inStock)
    if (product) { addProduct(product); setScanFeedback({ found: true, name: product.name }) }
    else setScanFeedback({ found: false, name: code })
    setTimeout(() => setScanFeedback(null), 3000)
  }

  const removeItem  = (idx) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))
  const updateQty   = (idx, qty) => {
    const q = Math.max(1, parseInt(qty) || 1)
    setForm(f => { const items = [...f.items]; items[idx] = { ...items[idx], quantity: q, subtotal: q * items[idx].unitPrice }; return { ...f, items } })
  }

  const validateStep = (s) => {
    const errs = {}
    if (s === 0 && !form.ownerId)          errs.ownerId = 'Requerido'
    if (s === 1 && form.items.length === 0) errs.items   = 'Agregá al menos un producto'
    if (s === 2 && !form.date)             errs.date    = 'Requerido'
    return errs
  }

  const handleNext = () => { const e = validateStep(step); if (Object.keys(e).length) { setErrors(e); return }; setStep(s => s + 1) }
  const handleSave = () => {
    const e = validateStep(step); if (Object.keys(e).length) { setErrors(e); return }
    const paidAmount = parseFloat(form.paidAmount) || 0
    const paymentStatus = deriveStatus(paidAmount, total)
    onSave({ ...form, discount: parseFloat(form.discount) || 0, subtotal, total, paidAmount, paymentStatus })
  }

  return (
    <>
    <StepWizard
      isOpen={isOpen} onClose={onClose}
      title={initial ? 'Editar venta' : 'Registrar venta'}
      steps={STEPS} currentStep={step}
      onNext={handleNext} onPrev={() => setStep(s => s - 1)} onSave={handleSave}
      saveLabel={initial ? 'Guardar cambios' : 'Registrar venta'}
    >
      {/* ── Paso 1: Cliente ── */}
      {step === 0 && (
        <>
          <OwnerSelect value={form.ownerId} onChange={handleOwnerChange} error={errors.ownerId} required />
          <PetSelect
            value={form.petId} onChange={id => setForm(f => ({ ...f, petId: id }))}
            ownerId={form.ownerId} disabled={!form.ownerId} label="Mascota" placeholder="Sin mascota"
          />
        </>
      )}

      {/* ── Paso 2: Productos ── */}
      {step === 1 && (
        <>
          <div className="form-group">
            <label className="form-label">Agregar productos</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="search-wrap" style={{ flex: 1 }}>
                <Search size={14} className="search-icon" />
                <input
                  className="form-input" style={{ paddingLeft: 36 }}
                  placeholder="Buscar por nombre o código de barras..."
                  value={productSearch}
                  onChange={e => { setProductSearch(e.target.value); setShowDropdown(true) }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                />
              </div>
              <button type="button" className="btn btn--subtle btn--icon" onClick={() => setScannerOpen(true)} title="Escanear código de barras" style={{ flexShrink: 0 }}>
                <ScanLine size={18} strokeWidth={2} />
              </button>
            </div>
            {errors.items && <span className="form-error">{errors.items}</span>}
            {scanFeedback && (
              <div style={{
                marginTop: 6, padding: '8px 12px', borderRadius: 6, fontSize: 13, fontWeight: 500,
                background: scanFeedback.found ? 'var(--ok-3)' : 'var(--danger-3)',
                color: scanFeedback.found ? 'var(--ok)' : 'var(--danger)',
                border: `1px solid ${scanFeedback.found ? 'var(--ok)' : 'var(--danger)'}`,
              }}>
                {scanFeedback.found ? `✓ Agregado: ${scanFeedback.name}` : `No encontrado: ${scanFeedback.name}`}
              </div>
            )}
            {showDropdown && (
              <div style={{ background: 'var(--bg-modal)', border: '1px solid var(--border)', borderRadius: 8, marginTop: 4, maxHeight: 220, overflowY: 'auto' }}>
                {searchedProducts.length === 0
                  ? <div style={{ padding: '12px 16px', color: 'var(--text-tertiary)', fontSize: 13 }}>No hay productos disponibles</div>
                  : searchedProducts.map(p => (
                    <button key={p.id} type="button" onMouseDown={() => addProduct(p)} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      width: '100%', padding: '8px 12px', background: 'none', border: 'none',
                      cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-primary)',
                    }}>
                      {p.photoUrl
                        ? <img src={p.photoUrl} alt={p.name} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)', flexShrink: 0 }} />
                        : <div style={{ width: 36, height: 36, borderRadius: 6, background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', flexShrink: 0 }}><Package size={16} strokeWidth={1.5} /></div>
                      }
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>{p.name}</div>
                        {p.barcode && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{p.barcode}</div>}
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--accent)', flexShrink: 0, marginLeft: 4 }}>{formatCurrency(p.price)}</div>
                    </button>
                  ))
                }
              </div>
            )}
          </div>

          {form.items.length > 0 && (
            <div className="card card--no-hover" style={{ padding: 0 }}>
              {form.items.map((item, idx) => {
                const productPhoto = products.items.find(p => p.id === item.productId)?.photoUrl
                return (
                <div key={item.productId} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderBottom: '1px solid var(--border-2)',
                }}>
                  {productPhoto
                    ? <img src={productPhoto} alt={item.productName} style={{ width: 38, height: 38, objectFit: 'cover', borderRadius: 7, border: '1px solid var(--border)', flexShrink: 0 }} />
                    : <div style={{ width: 38, height: 38, borderRadius: 7, background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', flexShrink: 0 }}><Package size={17} strokeWidth={1.5} /></div>
                  }
                  <div style={{ flex: 1, fontWeight: 500, fontSize: 14 }}>{item.productName}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button type="button" className="btn btn--subtle btn--icon" onClick={() => updateQty(idx, item.quantity - 1)} style={{ width: 34, height: 34 }}>
                      <Minus size={15} />
                    </button>
                    <span style={{ minWidth: 28, textAlign: 'center', fontWeight: 700, fontSize: 15 }}>{item.quantity}</span>
                    <button type="button" className="btn btn--subtle btn--icon" onClick={() => updateQty(idx, item.quantity + 1)} style={{ width: 34, height: 34 }}>
                      <Plus size={15} />
                    </button>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--accent)', minWidth: 80, textAlign: 'right', fontSize: 15 }}>{formatCurrency(item.subtotal)}</div>
                  <button type="button" className="btn btn--subtle btn--icon" onClick={() => removeItem(idx)} style={{ width: 34, height: 34, color: 'var(--danger)' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
                )
              })}
              <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'flex-end' }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>Total: {formatCurrency(subtotal)}</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Paso 3: Pago ── */}
      {step === 2 && (
        <>
          <div className="form-row form-row--2">
            <div className="form-group">
              <label className="form-label">Descuento (%)</label>
              <input className="form-input" type="number" min="0" max="100" step="1"
                value={form.discount} onFocus={e => e.target.select()} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} placeholder="0" />
              {form.ownerId && (
                <span className="form-hint">Descuento del cliente: {owners.items.find(o => o.id === form.ownerId)?.discount ?? 0}%</span>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Fecha *</label>
              <input className={`form-input${errors.date ? ' form-input--error' : ''}`} type="date" value={form.date}
                onChange={e => { setForm(f => ({ ...f, date: e.target.value })); setErrors(er => ({ ...er, date: '' })) }} />
              {errors.date && <span className="form-error">{errors.date}</span>}
            </div>
          </div>

          {/* Deuda pendiente del cliente */}
          {ownerDebt > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 'var(--r-md)', marginBottom: 12,
              background: 'var(--warn-3)', border: '1.5px solid var(--warn)', color: 'var(--warn)',
            }}>
              <AlertTriangle size={18} strokeWidth={2.5} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>
                Este cliente tiene una deuda pendiente de <strong>{formatCurrency(ownerDebt)}</strong>
              </span>
            </div>
          )}

          {/* Resumen */}
          <div style={{ background: 'var(--bg-sub)', borderRadius: 'var(--r-md)', padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
              <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--danger)', marginBottom: 4 }}>
                <span>Descuento ({form.discount}%)</span><span>− {formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 18, borderTop: '1px solid var(--border)', paddingTop: 8, color: 'var(--accent)' }}>
              <span>Total</span><span>{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Monto pagado</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontWeight: 600, pointerEvents: 'none' }}>$</span>
              <input className="form-input" type="number" min="0" step="100"
                value={form.paidAmount}
                onFocus={e => e.target.select()}
                onChange={e => setForm(f => ({ ...f, paidAmount: e.target.value }))}
                placeholder="0" style={{ paddingLeft: 26, fontSize: 17 }} />
            </div>
            {(() => {
              const status = deriveStatus(form.paidAmount, total)
              const cfg = STATUS_CFG[status]
              const paid = parseFloat(form.paidAmount) || 0
              return (
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    padding: '6px 14px', borderRadius: 999, fontWeight: 700, fontSize: 13.5,
                    background: cfg.bg, color: cfg.color, border: `1.5px solid ${cfg.border}`,
                    transition: 'all 0.2s',
                  }}>
                    <cfg.Icon size={16} strokeWidth={2.5} />
                    {cfg.label}
                  </div>
                  {status === 'partial' && total > 0 && (
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      Saldo: <strong style={{ color: 'var(--danger)' }}>{formatCurrency(total - paid)}</strong>
                    </span>
                  )}
                </div>
              )
            })()}
            {(() => {
              const paid = parseFloat(form.paidAmount) || 0
              return paid > total && total > 0 ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginTop: 8,
                  padding: '8px 12px', borderRadius: 'var(--r-md)',
                  background: 'var(--warn-3)', border: '1px solid var(--warn)', color: 'var(--warn)',
                  fontSize: 13, fontWeight: 600,
                }}>
                  <AlertTriangle size={15} strokeWidth={2.5} />
                  El monto supera el total en {formatCurrency(paid - total)}
                </div>
              ) : null
            })()}
          </div>
        </>
      )}
    </StepWizard>

    <BarcodeScanner isOpen={scannerOpen} onClose={() => setScannerOpen(false)} onScan={handleBarcodeScan} title="Escanear producto" />
    </>
  )
}
