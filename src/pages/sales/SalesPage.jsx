import { useState, useMemo, useCallback } from 'react'
import { Search, Plus, Pencil, Trash2, ShoppingCart, TrendingUp, CircleCheck } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import Header from '../../components/layout/Header'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import SaleForm from './SaleForm'
import { formatDate, formatCurrency } from '../../utils/helpers'

export default function SalesPage() {
  const { sales } = useApp()
  const [search, setSearch]           = useState('')
  const [filterPayMethod, setFilterPayMethod] = useState('')
  const [filterFecha, setFilterFecha] = useState('')
  const [formOpen, setFormOpen]       = useState(false)
  const [editing, setEditing]         = useState(null)
  const [deleting, setDeleting]       = useState(null)
  const [toast, setToast]             = useState(false)

  const showToast = useCallback(() => {
    setToast(true)
    setTimeout(() => setToast(false), 3000)
  }, [])

  const today = new Date().toISOString().slice(0, 10)
  const startOfWeek = (() => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d.toISOString().slice(0, 10) })()
  const startOfMonth = new Date().toISOString().slice(0, 8) + '01'

  const filtered = useMemo(() => {
    return sales.items
      .filter(s => {
        const str = (s.items?.map(i => i.productName).join(' ') || '').toLowerCase()
        if (search && !str.includes(search.toLowerCase())) return false
        if (filterPayMethod && s.paymentMethod !== filterPayMethod) return false
        if (filterFecha === 'hoy'  && s.date !== today) return false
        if (filterFecha === 'semana' && s.date < startOfWeek) return false
        if (filterFecha === 'mes'  && s.date < startOfMonth) return false
        return true
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [sales.items, search, filterPayMethod, filterFecha])

  const totalSold     = sales.items.reduce((s, v) => s + (v.total || 0), 0)
  const filteredTotal = filtered.reduce((s, v) => s + (v.total || 0), 0)

  const handleSave = (data) => {
    if (editing) sales.update(editing.id, data)
    else sales.add(data)
    setEditing(null)
    setFormOpen(false)
    if (!editing) showToast()
  }

  const handleDelete = () => { if (!deleting) return; sales.remove(deleting.id); setDeleting(null) }

  return (
    <>
      <Header
        title="Ventas"
        subtitle={`${sales.items.length} ventas · vendido ${formatCurrency(totalSold)}`}
      />

      <div className="page">
        {/* Stats */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-card__icon" style={{ color: 'var(--vet-emerald)' }}>
              <TrendingUp size={32} strokeWidth={1.75} />
            </div>
            <div className="stat-card__label">{(search || filterPayMethod || filterFecha) ? 'Total filtrado' : 'Total vendido'}</div>
            <div className="stat-card__value" style={{ color: 'var(--vet-emerald)', fontSize: 24 }}>
              {formatCurrency((search || filterPayMethod || filterFecha) ? filteredTotal : totalSold)}
            </div>
            {(search || filterPayMethod || filterFecha) && (
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                Total general: {formatCurrency(totalSold)}
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-wrap" style={{ flex: 1, minWidth: 200 }}>
            <Search size={18} className="search-icon" />
            <input
              className="form-input"
              style={{ paddingLeft: 36 }}
              placeholder="Buscar por producto..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn--primary" style={{ marginLeft: 'auto' }} onClick={() => { setEditing(null); setFormOpen(true) }}>
            <Plus size={18} /> Registrar venta
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="tabs">
            <button className={`tab${filterFecha === '' ? ' active' : ''}`} onClick={() => setFilterFecha('')}>Todas las fechas</button>
            <button className={`tab${filterFecha === 'hoy' ? ' active' : ''}`} onClick={() => setFilterFecha('hoy')}>Hoy</button>
            <button className={`tab${filterFecha === 'semana' ? ' active' : ''}`} onClick={() => setFilterFecha('semana')}>Esta semana</button>
            <button className={`tab${filterFecha === 'mes' ? ' active' : ''}`} onClick={() => setFilterFecha('mes')}>Este mes</button>
          </div>
          <div className="tabs">
            <button className={`tab${filterPayMethod === '' ? ' active' : ''}`} onClick={() => setFilterPayMethod('')}>Todos</button>
            <button className={`tab${filterPayMethod === 'efectivo' ? ' active' : ''}`} onClick={() => setFilterPayMethod('efectivo')}>Efectivo</button>
            <button className={`tab${filterPayMethod === 'tarjeta_credito' ? ' active' : ''}`} onClick={() => setFilterPayMethod('tarjeta_credito')}>Tarjeta crédito</button>
            <button className={`tab${filterPayMethod === 'tarjeta_debito' ? ' active' : ''}`} onClick={() => setFilterPayMethod('tarjeta_debito')}>Tarjeta débito</button>
            <button className={`tab${filterPayMethod === 'transferencia' ? ' active' : ''}`} onClick={() => setFilterPayMethod('transferencia')}>Transferencia</button>
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart size={40} strokeWidth={1.5} />}
            title="Sin ventas"
            text={search ? 'No hay ventas que coincidan' : 'Registrá la primera venta'}
            action={!search
              ? <button className="btn btn--primary" onClick={() => { setEditing(null); setFormOpen(true) }}>
                  <Plus size={18} /> Registrar venta
                </button>
              : null
            }
          />
        ) : (
          <div className="card card--no-hover">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Productos</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                    <th style={{ width: 80 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(sale => {
                    const itemCount = sale.items?.length || 0
                    const firstItem = sale.items?.[0]?.productName || '—'
                    return (
                      <tr key={sale.id}>
                        <td style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {formatDate(sale.date)}
                        </td>
                        <td style={{ maxWidth: 260 }}>
                          <div style={{ fontSize: 13 }} className="truncate">{firstItem}</div>
                          {itemCount > 1 && (
                            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>+{itemCount - 1} más</div>
                          )}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--vet-teal)', whiteSpace: 'nowrap' }}>
                          {formatCurrency(sale.total)}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                            <button className="btn btn--subtle btn--icon" onClick={() => { setEditing(sale); setFormOpen(true) }} title="Editar">
                              <Pencil size={18} />
                            </button>
                            <button className="btn btn--subtle btn--icon" onClick={() => setDeleting(sale)} title="Eliminar" style={{ color: 'var(--vet-rose)' }}>
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <SaleForm
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null) }}
        onSave={handleSave}
        initial={editing}
      />

      {toast && (
        <div className="toast-wrap">
          <div className="toast toast--ok" style={{ background: 'var(--ok)', borderLeft: 'none' }}>
            <CircleCheck size={20} strokeWidth={2.5} style={{ color: 'white', flexShrink: 0 }} />
            <span style={{ fontWeight: 600, fontSize: 14, color: 'white' }}>Venta realizada con éxito</span>
          </div>
        </div>
      )}

      {deleting && (
        <Modal
          isOpen
          onClose={() => setDeleting(null)}
          title="Eliminar venta"
          size="sm"
          footer={
            <>
              <button className="btn btn--ghost" onClick={() => setDeleting(null)}>Cancelar</button>
              <button className="btn btn--danger" onClick={handleDelete}>Eliminar</button>
            </>
          }
        >
          <p style={{ fontSize: 15 }}>¿Eliminar esta venta?</p>
        </Modal>
      )}
    </>
  )
}
