import { useState, useEffect, useMemo } from 'react'
import BarcodeScanner from '../../components/ui/BarcodeScanner'
import { useApp } from '../../context/AppContext'
import { todayStr, formatCurrency } from '../../utils/helpers'
import { Trash2, Search, ScanLine, Plus, Minus, Package, X, ShoppingCart, LayoutGrid, Banknote, CreditCard, Wallet, ArrowRightLeft } from 'lucide-react'

const EMPTY = { items: [], paymentMethod: 'efectivo' }

const PAYMENT_METHODS = [
  { value: 'efectivo',         label: 'Efectivo',           Icon: Banknote },
  { value: 'tarjeta_credito',  label: 'Tarjeta de crédito', Icon: CreditCard },
  { value: 'tarjeta_debito',   label: 'Tarjeta de débito',  Icon: Wallet },
  { value: 'transferencia',    label: 'Transferencia',      Icon: ArrowRightLeft },
]

export default function SaleForm({ isOpen, onClose, onSave, initial = null }) {
  const { products } = useApp()
  const [form, setForm]           = useState(EMPTY)
  const [errors, setErrors]       = useState({})
  const [mobileTab, setMobileTab] = useState('catalog')
  const [productSearch, setProductSearch] = useState('')
  const [scannerOpen, setScannerOpen]     = useState(false)
  const [scanFeedback, setScanFeedback]   = useState(null)

  useEffect(() => {
    if (isOpen) {
      setErrors({}); setProductSearch(''); setMobileTab('catalog')
      setForm(initial
        ? { items: initial.items, paymentMethod: initial.paymentMethod || 'efectivo' }
        : EMPTY
      )
    }
  }, [isOpen, initial])

  useEffect(() => {
    if (!isOpen) return
    const fn = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [isOpen, onClose])

  const subtotal = useMemo(() => form.items.reduce((s, i) => s + i.subtotal, 0), [form.items])
  const total    = subtotal

  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase()
    if (!q) return products.items.filter(p => p.inStock)
    return products.items.filter(p => p.inStock && (p.name.toLowerCase().includes(q) || (p.barcode || '').includes(q)))
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
    setErrors(er => ({ ...er, items: '' }))
  }

  const handleBarcodeScan = (code) => {
    const product = products.items.find(p => p.barcode === code && p.inStock)
    if (product) { addProduct(product); setScanFeedback({ found: true, name: product.name }) }
    else setScanFeedback({ found: false, name: code })
    setTimeout(() => setScanFeedback(null), 3000)
  }

  const removeItem = (idx) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))
  const updateQty  = (idx, qty) => {
    const q = Math.max(1, parseInt(qty) || 1)
    setForm(f => { const items = [...f.items]; items[idx] = { ...items[idx], quantity: q, subtotal: q * items[idx].unitPrice }; return { ...f, items } })
  }

  const handleSave = () => {
    if (form.items.length === 0) { setErrors({ items: 'Agregá al menos un producto' }); return }
    onSave({
      ...form,
      discount: 0, subtotal, total,
      paidAmount: total,
      paymentStatus: 'paid',
      date: todayStr(),
    })
  }

  if (!isOpen) return null

  const itemCount = form.items.length

  return (
    <>
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal modal--lg" style={{ maxWidth: 860, width: '95vw', maxHeight: '92dvh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div className="modal__header">
          <div className="modal__title">{initial ? 'Editar venta' : 'Registrar venta'}</div>
          <button className="btn btn--subtle btn--icon" onClick={onClose} style={{ width: 48, height: 48 }}>
            <X size={28} strokeWidth={2} />
          </button>
        </div>

        {/* Tabs móvil */}
        <div className="pos-tabs">
          <button className={`pos-tab${mobileTab === 'catalog' ? ' active' : ''}`} onClick={() => setMobileTab('catalog')}>
            <LayoutGrid size={16} strokeWidth={2} />
            Catálogo
          </button>
          <button className={`pos-tab${mobileTab === 'cart' ? ' active' : ''}`} onClick={() => setMobileTab('cart')}>
            <ShoppingCart size={16} strokeWidth={2} />
            Carrito
            {itemCount > 0 && (
              <span style={{ background: 'var(--accent)', color: 'white', borderRadius: 999, fontSize: 11, fontWeight: 700, padding: '1px 6px', lineHeight: 1.5 }}>
                {itemCount}
              </span>
            )}
          </button>
        </div>

        {/* Body */}
        <div className="pos-body">

          {/* ── Catálogo ── */}
          <div className={`pos-col pos-col--catalog${mobileTab !== 'catalog' ? ' pos-col--hidden' : ''}`}>
            <div style={{ padding: '16px 20px 12px' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <div className="search-wrap" style={{ flex: 1 }}>
                  <Search size={18} className="search-icon" />
                  <input
                    className="form-input" style={{ paddingLeft: 36 }}
                    placeholder="Buscar producto o código de barras..."
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && productSearch.trim()) {
                        handleBarcodeScan(productSearch.trim())
                        setProductSearch('')
                      }
                    }}
                    autoFocus
                  />
                </div>
                <button type="button" className="btn btn--subtle btn--icon" onClick={() => setScannerOpen(true)} title="Escanear código de barras" style={{ flexShrink: 0 }}>
                  <ScanLine size={18} strokeWidth={2} />
                </button>
              </div>
              {scanFeedback && (
                <div style={{
                  marginTop: 8, padding: '7px 12px', borderRadius: 6, fontSize: 13, fontWeight: 500,
                  background: scanFeedback.found ? 'var(--ok-3)' : 'var(--danger-3)',
                  color: scanFeedback.found ? 'var(--ok)' : 'var(--danger)',
                  border: `1px solid ${scanFeedback.found ? 'var(--ok)' : 'var(--danger)'}`,
                }}>
                  {scanFeedback.found ? `✓ Agregado: ${scanFeedback.name}` : `No encontrado: ${scanFeedback.name}`}
                </div>
              )}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px' }}>
              {filteredProducts.length === 0
                ? <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 14 }}>No hay productos disponibles</div>
                : filteredProducts.map(p => (
                  <button key={p.id} type="button" onClick={() => addProduct(p)} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '9px 10px', background: 'none', border: 'none',
                    borderRadius: 8, cursor: 'pointer', textAlign: 'left', color: 'var(--text-primary)',
                    transition: 'background var(--t-fast)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sub)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    {p.photoUrl
                      ? <img src={p.photoUrl} alt={p.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 7, border: '1px solid var(--border)', flexShrink: 0 }} />
                      : <div style={{ width: 40, height: 40, borderRadius: 7, background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', flexShrink: 0 }}><Package size={17} strokeWidth={1.5} /></div>
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                      {p.barcode && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{p.barcode}</div>}
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>{formatCurrency(p.price)}</div>
                  </button>
                ))
              }
            </div>
          </div>

          {/* ── Carrito + pago ── */}
          <div className={`pos-col pos-col--cart${mobileTab !== 'cart' ? ' pos-col--hidden' : ''}`}>

            {/* Items */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
              {form.items.length === 0
                ? <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 14 }}>
                    Seleccioná productos del catálogo
                  </div>
                : form.items.map((item, idx) => {
                  const photo = products.items.find(p => p.id === item.productId)?.photoUrl
                  return (
                    <div key={item.productId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderBottom: '1px solid var(--border-2)' }}>
                      {photo
                        ? <img src={photo} alt={item.productName} style={{ width: 34, height: 34, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)', flexShrink: 0 }} />
                        : <div style={{ width: 34, height: 34, borderRadius: 6, background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', flexShrink: 0 }}><Package size={15} strokeWidth={1.5} /></div>
                      }
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.productName}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{formatCurrency(item.unitPrice)} c/u</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <button type="button" className="btn btn--subtle btn--icon" onClick={() => updateQty(idx, item.quantity - 1)} style={{ width: 28, height: 28 }}><Minus size={13} /></button>
                        <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 700, fontSize: 14 }}>{item.quantity}</span>
                        <button type="button" className="btn btn--subtle btn--icon" onClick={() => updateQty(idx, item.quantity + 1)} style={{ width: 28, height: 28 }}><Plus size={13} /></button>
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--accent)', minWidth: 64, textAlign: 'right', fontSize: 13 }}>{formatCurrency(item.subtotal)}</div>
                      <button type="button" className="btn btn--subtle btn--icon" onClick={() => removeItem(idx)} style={{ width: 28, height: 28, color: 'var(--danger)', flexShrink: 0 }}><Trash2 size={14} /></button>
                    </div>
                  )
                })
              }
              {errors.items && <div style={{ padding: '8px 16px', color: 'var(--danger)', fontSize: 13 }}>{errors.items}</div>}
            </div>

            {/* Panel de pago */}
            <div style={{ borderTop: '1px solid var(--border-2)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Total */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 22, color: 'var(--accent)' }}>
                <span>Total</span><span>{formatCurrency(total)}</span>
              </div>

              {/* Medio de pago */}
              <div>
                <label className="form-label" style={{ marginBottom: 8 }}>Medio de pago</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {PAYMENT_METHODS.map(({ value, label, Icon }) => {
                    const active = form.paymentMethod === value
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, paymentMethod: value }))}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '10px 12px', borderRadius: 'var(--r-md)', cursor: 'pointer',
                          border: `2px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                          background: active ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'var(--bg-sub)',
                          color: active ? 'var(--accent)' : 'var(--text-secondary)',
                          fontWeight: active ? 700 : 500,
                          fontSize: 13, transition: 'all var(--t-fast)',
                        }}
                      >
                        <Icon size={16} strokeWidth={2} style={{ flexShrink: 0 }} />
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Acciones */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn" onClick={onClose}
                  style={{ flex: 1, background: 'var(--danger-3)', color: 'var(--danger)', border: '1px solid transparent' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger)'; e.currentTarget.style.color = 'white' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--danger-3)'; e.currentTarget.style.color = 'var(--danger)' }}
                >
                  Cancelar
                </button>
                <button className="btn btn--primary" onClick={handleSave} style={{ flex: 2 }}>
                  {initial ? 'Guardar cambios' : 'Registrar venta'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <BarcodeScanner isOpen={scannerOpen} onClose={() => setScannerOpen(false)} onScan={handleBarcodeScan} title="Escanear producto" />
    </>
  )
}
