import { useState, useMemo } from 'react'
import { Search, Pencil, Trash2, ShoppingCart, Stethoscope, Package, Banknote } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import Header from '../../components/layout/Header'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import SaleForm from './SaleForm'
import { formatDate, formatCurrency } from '../../utils/helpers'

export default function SalesPage() {
  const { sales, pets, owners } = useApp()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const filtered = useMemo(() =>
    sales.items
      .filter(s => {
        const owner = owners.find(s.ownerId)
        const pet = pets.find(s.petId)
        const str = `${s.description} ${owner?.name || ''} ${pet?.name || ''}`.toLowerCase()
        return str.includes(search.toLowerCase()) && (!typeFilter || s.type === typeFilter)
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [sales.items, search, typeFilter, owners, pets]
  )

  const totalFiltered = filtered.reduce((sum, s) => sum + (s.price || 0), 0)
  const totalAll = sales.items.reduce((sum, s) => sum + (s.price || 0), 0)

  const handleSave = (data) => {
    if (editing) sales.update(editing.id, data)
    else sales.add(data)
    setEditing(null)
  }

  const handleDelete = () => { sales.remove(deleting.id); setDeleting(null) }

  return (
    <>
      <Header
        title="Ventas y Servicios"
        subtitle={`Total: ${formatCurrency(totalAll)}`}
        actions={
          <button className="btn btn--primary" onClick={() => { setEditing(null); setFormOpen(true) }}>
            + Registrar venta
          </button>
        }
      />
      <div className="page">
        <div className="stats-grid" style={{ marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-card__icon" style={{ background: 'rgba(0,122,255,0.12)', color: 'var(--blue)' }}>
              <Stethoscope size={22} strokeWidth={1.75} />
            </div>
            <div className="stat-card__label">Consultas</div>
            <div className="stat-card__value" style={{ color: 'var(--blue)', fontSize: 20 }}>
              {formatCurrency(sales.items.filter(s => s.type === 'consultation').reduce((a, s) => a + s.price, 0))}
            </div>
            <div className="stat-card__sub">{sales.items.filter(s => s.type === 'consultation').length} registros</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__icon" style={{ background: 'rgba(52,199,89,0.12)', color: 'var(--green)' }}>
              <Package size={22} strokeWidth={1.75} />
            </div>
            <div className="stat-card__label">Productos</div>
            <div className="stat-card__value" style={{ color: 'var(--green)', fontSize: 20 }}>
              {formatCurrency(sales.items.filter(s => s.type === 'product').reduce((a, s) => a + s.price, 0))}
            </div>
            <div className="stat-card__sub">{sales.items.filter(s => s.type === 'product').length} registros</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__icon" style={{ background: 'rgba(175,82,222,0.12)', color: 'var(--purple)' }}>
              <Banknote size={22} strokeWidth={1.75} />
            </div>
            <div className="stat-card__label">Total general</div>
            <div className="stat-card__value" style={{ color: 'var(--purple)', fontSize: 18 }}>{formatCurrency(totalAll)}</div>
            <div className="stat-card__sub">{sales.items.length} transacciones</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-wrap" style={{ flex: 1, minWidth: 200, maxWidth: 360 }}>
            <span className="search-icon"><Search size={14} strokeWidth={2} /></span>
            <input className="form-input" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="tabs" style={{ flexShrink: 0 }}>
            <button className={`tab${typeFilter === '' ? ' active' : ''}`} onClick={() => setTypeFilter('')}>Todos</button>
            <button className={`tab${typeFilter === 'consultation' ? ' active' : ''}`} onClick={() => setTypeFilter('consultation')}>Consultas</button>
            <button className={`tab${typeFilter === 'product' ? ' active' : ''}`} onClick={() => setTypeFilter('product')}>Productos</button>
          </div>
        </div>

        {(search || typeFilter) && (
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} · Total: <strong>{formatCurrency(totalFiltered)}</strong>
          </div>
        )}

        {filtered.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart size={48} strokeWidth={1.25} />}
            title="Sin ventas"
            text="No hay ventas registradas."
            action={<button className="btn btn--primary" onClick={() => setFormOpen(true)}>+ Registrar venta</button>}
          />
        ) : (
          <div className="card card--no-hover">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Descripción</th>
                    <th>Cliente / Mascota</th>
                    <th style={{ textAlign: 'right' }}>Precio</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(sale => {
                    const owner = owners.find(sale.ownerId)
                    const pet = pets.find(sale.petId)
                    return (
                      <tr key={sale.id}>
                        <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{formatDate(sale.date)}</td>
                        <td>
                          <Badge color={sale.type === 'consultation' ? 'blue' : 'green'}>
                            {sale.type === 'consultation' ? 'Consulta' : 'Producto'}
                          </Badge>
                        </td>
                        <td style={{ maxWidth: 220 }} className="truncate">{sale.description}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>
                          {owner?.name || '—'}{pet ? ` · ${pet.name}` : ''}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                          {formatCurrency(sale.price)}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn--subtle btn--sm btn--icon" onClick={() => { setEditing(sale); setFormOpen(true) }}>
                              <Pencil size={14} strokeWidth={2} />
                            </button>
                            <button className="btn btn--subtle btn--sm btn--icon" onClick={() => setDeleting(sale)}>
                              <Trash2 size={14} strokeWidth={2} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} style={{ padding: '12px 16px', fontWeight: 600, fontSize: 13, color: 'var(--text-secondary)' }}>
                      Total ({filtered.length} registros)
                    </td>
                    <td style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 800, fontSize: 16 }}>
                      {formatCurrency(totalFiltered)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
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

      <Modal
        isOpen={!!deleting}
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
        <p style={{ color: 'var(--text-secondary)' }}>¿Eliminar <strong>{deleting?.description}</strong>?</p>
      </Modal>
    </>
  )
}
