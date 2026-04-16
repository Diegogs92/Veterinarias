import { useState, useMemo } from 'react'
import { Search, Plus, Pencil, Trash2, ShoppingCart, Banknote, TrendingUp, Clock } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import Header from '../../components/layout/Header'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import SaleForm from './SaleForm'
import { formatDate, formatCurrency } from '../../utils/helpers'

const PAYMENT_BADGE = {
  paid:    { color: 'green', label: 'Pagado' },
  unpaid:  { color: 'red',   label: 'Pendiente' },
  partial: { color: 'orange', label: 'Parcial' },
}

export default function SalesPage() {
  const { sales, owners, pets, syncDebt, debts } = useApp()
  const [search, setSearch]           = useState('')
  const [payFilter, setPayFilter]     = useState('')
  const [formOpen, setFormOpen]       = useState(false)
  const [editing, setEditing]         = useState(null)
  const [deleting, setDeleting]       = useState(null)

  // ── Filtered ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() =>
    sales.items
      .filter(s => {
        const owner = owners.find(s.ownerId)
        const pet   = pets.find(s.petId)
        const str   = `${owner?.name || ''} ${pet?.name || ''} ${s.items?.map(i => i.productName).join(' ') || ''}`.toLowerCase()
        const matchSearch = !search || str.includes(search.toLowerCase())
        const matchPay    = !payFilter || s.paymentStatus === payFilter
        return matchSearch && matchPay
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [sales.items, search, payFilter, owners, pets]
  )

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalSold    = sales.items.reduce((s, v) => s + (v.total || 0), 0)
  const totalCobrado = sales.items.reduce((s, v) => s + (v.paidAmount || 0), 0)
  const totalPending = totalSold - totalCobrado

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSave = (data) => {
    let savedId
    if (editing) {
      sales.update(editing.id, data)
      savedId = editing.id
    } else {
      const created = sales.add(data)
      savedId = created.id
    }
    // Sync debt
    if (data.paymentStatus !== 'paid') {
      syncDebt('sale', savedId, data.ownerId, data.total, data.paidAmount)
    } else {
      syncDebt('sale', savedId, data.ownerId, data.total, data.total)
    }
    setEditing(null)
    setFormOpen(false)
  }

  const handleDelete = () => {
    if (!deleting) return
    // Mark debt as paid/removed
    syncDebt('sale', deleting.id, deleting.ownerId, deleting.total || 0, deleting.total || 0)
    sales.remove(deleting.id)
    setDeleting(null)
  }

  return (
    <>
      <Header
        title="Ventas"
        subtitle={`${sales.items.length} ventas registradas`}
        actions={
          <button className="btn btn--primary" onClick={() => { setEditing(null); setFormOpen(true) }}>
            <Plus size={16} /> Registrar venta
          </button>
        }
      />

      <div className="page">
        {/* Stats */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', marginBottom: 32 }}>
          <div className="stat-card">
            <div className="stat-card__icon" style={{ color: 'var(--vet-teal)' }}>
              <ShoppingCart size={32} strokeWidth={1.75} />
            </div>
            <div className="stat-card__label">Total vendido</div>
            <div className="stat-card__value" style={{ color: 'var(--vet-teal)', fontSize: 22 }}>{formatCurrency(totalSold)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__icon" style={{ color: 'var(--vet-emerald)' }}>
              <TrendingUp size={32} strokeWidth={1.75} />
            </div>
            <div className="stat-card__label">Cobrado</div>
            <div className="stat-card__value" style={{ color: 'var(--vet-emerald)', fontSize: 22 }}>{formatCurrency(totalCobrado)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__icon" style={{ color: 'var(--vet-rose)' }}>
              <Clock size={32} strokeWidth={1.75} />
            </div>
            <div className="stat-card__label">Pendiente de cobro</div>
            <div className="stat-card__value" style={{ color: 'var(--vet-rose)', fontSize: 22 }}>{formatCurrency(totalPending)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__icon" style={{ color: 'var(--vet-amber)' }}>
              <Banknote size={32} strokeWidth={1.75} />
            </div>
            <div className="stat-card__label">Transacciones</div>
            <div className="stat-card__value" style={{ color: 'var(--vet-amber)' }}>{sales.items.length}</div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-wrap" style={{ flex: 1, minWidth: 200 }}>
            <Search size={14} className="search-icon" />
            <input
              className="form-input"
              style={{ paddingLeft: 36 }}
              placeholder="Buscar por dueño, mascota o producto..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="tabs" style={{ flexShrink: 0 }}>
            <button className={`tab${payFilter === '' ? ' active' : ''}`} onClick={() => setPayFilter('')}>Todos</button>
            <button className={`tab${payFilter === 'paid' ? ' active' : ''}`} onClick={() => setPayFilter('paid')}>Pagado</button>
            <button className={`tab${payFilter === 'partial' ? ' active' : ''}`} onClick={() => setPayFilter('partial')}>Parcial</button>
            <button className={`tab${payFilter === 'unpaid' ? ' active' : ''}`} onClick={() => setPayFilter('unpaid')}>Pendiente</button>
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart size={40} strokeWidth={1.5} />}
            title="Sin ventas"
            text={search || payFilter ? 'No hay ventas que coincidan' : 'Registrá la primera venta'}
            action={!search && !payFilter
              ? <button className="btn btn--primary" onClick={() => { setEditing(null); setFormOpen(true) }}>
                  <Plus size={16} /> Registrar venta
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
                    <th>Cliente / Mascota</th>
                    <th>Productos</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                    <th>Estado</th>
                    <th style={{ width: 80 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(sale => {
                    const owner = owners.find(sale.ownerId)
                    const pet   = pets.find(sale.petId)
                    const badge = PAYMENT_BADGE[sale.paymentStatus] || PAYMENT_BADGE.unpaid
                    const itemCount = sale.items?.length || 0
                    const firstItem = sale.items?.[0]?.productName || '—'
                    return (
                      <tr key={sale.id}>
                        <td style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {formatDate(sale.date)}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{owner?.name || '—'}</div>
                          {pet && <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{pet.name}</div>}
                        </td>
                        <td style={{ maxWidth: 200 }}>
                          <div style={{ fontSize: 13 }} className="truncate">{firstItem}</div>
                          {itemCount > 1 && (
                            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                              +{itemCount - 1} más
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--vet-teal)', whiteSpace: 'nowrap' }}>
                          {formatCurrency(sale.total)}
                          {sale.paymentStatus === 'partial' && (
                            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 400 }}>
                              Pagó {formatCurrency(sale.paidAmount)}
                            </div>
                          )}
                        </td>
                        <td>
                          <Badge color={badge.color} dot>{badge.label}</Badge>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                            <button
                              className="btn btn--subtle btn--sm btn--icon"
                              onClick={() => { setEditing(sale); setFormOpen(true) }}
                              title="Editar"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              className="btn btn--subtle btn--sm btn--icon"
                              onClick={() => setDeleting(sale)}
                              title="Eliminar"
                              style={{ color: 'var(--vet-rose)' }}
                            >
                              <Trash2 size={14} />
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
          <p style={{ fontSize: 15 }}>
            ¿Eliminar la venta de <strong>{owners.find(deleting.ownerId)?.name || 'este cliente'}</strong>?
            {deleting.paymentStatus !== 'paid' && (
              <span style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
                La deuda asociada también será marcada como saldada.
              </span>
            )}
          </p>
        </Modal>
      )}
    </>
  )
}
