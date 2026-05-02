import { useState, useMemo } from 'react'
import { Search, Plus, Pencil, Trash2, Home, Check } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import Header from '../../components/layout/Header'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import BoardingForm from './BoardingForm'
import { formatDate, formatCurrency, todayStr } from '../../utils/helpers'

function calcDays(entryDate, exitDate) {
  const start = new Date(entryDate)
  const end = exitDate ? new Date(exitDate) : new Date()
  start.setHours(0, 0, 0, 0); end.setHours(0, 0, 0, 0)
  return Math.max(1, Math.round((end - start) / 86400000))
}

export default function BoardingPage() {
  const { boarding, pets, owners } = useApp()
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [formOpen, setFormOpen]       = useState(false)
  const [editing, setEditing]         = useState(null)
  const [deleting, setDeleting]       = useState(null)
  const [checkoutTarget, setCheckoutTarget] = useState(null)

  const activeCount = useMemo(() =>
    boarding.items.filter(b => b.status === 'active').length,
    [boarding.items]
  )

  const filtered = useMemo(() =>
    boarding.items
      .filter(b => {
        const pet   = pets.find(b.petId)
        const owner = owners.find(b.ownerId)
        const str   = `${pet?.name || ''} ${owner?.name || ''} ${b.feeding || ''} ${b.observations || ''}`.toLowerCase()
        return str.includes(search.toLowerCase()) &&
          (statusFilter === 'all' || b.status === statusFilter)
      })
      .sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate)),
    [boarding.items, search, statusFilter, pets, owners]
  )

  const handleSave     = (data) => { if (editing) boarding.update(editing.id, data); else boarding.add(data); setEditing(null) }
  const handleCheckout = () => { boarding.update(checkoutTarget.id, { status: 'completed', exitDate: todayStr() }); setCheckoutTarget(null) }
  const handleDelete   = () => { boarding.remove(deleting.id); setDeleting(null) }

  return (
    <>
      <Header
        title="Pensionados"
        subtitle={activeCount > 0
          ? `${activeCount} mascota${activeCount !== 1 ? 's' : ''} en pensión`
          : 'Sin mascotas en pensión actualmente'
        }
      />
      <div className="page">
        <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-wrap" style={{ flex: 1, minWidth: 200 }}>
            <Search size={18} className="search-icon" />
            <input
              className="form-input"
              style={{ paddingLeft: 36 }}
              placeholder="Buscar mascota o dueño..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn--primary" style={{ marginLeft: 'auto' }} onClick={() => { setEditing(null); setFormOpen(true) }}>
            <Plus size={18} /> Nuevo pensionado
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <div className="tabs">
            {[
              { value: 'active',    label: 'En pensión' },
              { value: 'completed', label: 'Retirados' },
              { value: 'all',       label: 'Todos' },
            ].map(t => (
              <button key={t.value} className={`tab${statusFilter === t.value ? ' active' : ''}`} onClick={() => setStatusFilter(t.value)}>
                {t.label}
                {t.value === 'active' && activeCount > 0 && (
                  <span style={{ background: 'var(--blue)', color: 'white', borderRadius: 'var(--r-full)', padding: '0 5px', fontSize: 11, marginLeft: 4 }}>
                    {activeCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Home size={40} strokeWidth={1.5} />}
            title="Sin pensionados"
            text={statusFilter === 'active' ? 'No hay mascotas en pensión actualmente.' : 'No hay registros con estos filtros.'}
            action={statusFilter === 'active' && (
              <button className="btn btn--primary" onClick={() => setFormOpen(true)}><Plus size={18} /> Nuevo pensionado</button>
            )}
          />
        ) : (
          <div className="card card--no-hover">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Mascota</th>
                    <th>Dueño</th>
                    <th>Ingreso</th>
                    <th>Egreso</th>
                    <th style={{ textAlign: 'right' }}>Días</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                    <th>Estado</th>
                    <th style={{ width: 120 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(b => {
                    const pet   = pets.find(b.petId)
                    const owner = owners.find(b.ownerId)
                    const isActive = b.status === 'active'
                    const days  = calcDays(b.entryDate, b.exitDate)
                    const total = b.dailyPrice > 0 ? b.dailyPrice * days : null
                    return (
                      <tr key={b.id}>
                        <td style={{ fontWeight: 600 }}>{pet?.name || '—'}</td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{owner?.name || '—'}</td>
                        <td style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{formatDate(b.entryDate)}</td>
                        <td style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{b.exitDate ? formatDate(b.exitDate) : '—'}</td>
                        <td style={{ textAlign: 'right', fontSize: 13 }}>{days}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--vet-teal)', whiteSpace: 'nowrap' }}>
                          {total ? formatCurrency(total) : '—'}
                        </td>
                        <td>
                          <span style={{ fontSize: 13, fontWeight: 600, color: isActive ? 'var(--blue)' : 'var(--ok)' }}>
                            {isActive ? 'En pensión' : 'Retirado'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                            {isActive && (
                              <button className="btn btn--subtle btn--sm" onClick={() => setCheckoutTarget(b)} title="Registrar retiro">
                                <Check size={14} strokeWidth={2.5} /> Retirar
                              </button>
                            )}
                            <button className="btn btn--subtle btn--icon" onClick={() => { setEditing(b); setFormOpen(true) }} title="Editar">
                              <Pencil size={18} />
                            </button>
                            <button className="btn btn--subtle btn--icon" onClick={() => setDeleting(b)} title="Eliminar" style={{ color: 'var(--vet-rose)' }}>
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

      <BoardingForm
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null) }}
        onSave={handleSave}
        initial={editing}
      />

      <Modal
        isOpen={!!checkoutTarget}
        onClose={() => setCheckoutTarget(null)}
        title="Registrar retiro"
        size="sm"
        footer={
          <>
            <button className="btn btn--ghost" onClick={() => setCheckoutTarget(null)}>Cancelar</button>
            <button className="btn btn--success" onClick={handleCheckout}>
              <Check size={14} strokeWidth={2.5} /> Confirmar retiro
            </button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)' }}>
          ¿Confirmás el retiro de <strong>{pets.find(checkoutTarget?.petId)?.name}</strong> con fecha de hoy?
        </p>
      </Modal>

      <Modal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title="Eliminar pensionado"
        size="sm"
        footer={
          <>
            <button className="btn btn--ghost" onClick={() => setDeleting(null)}>Cancelar</button>
            <button className="btn btn--danger" onClick={handleDelete}>Eliminar</button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)' }}>
          ¿Eliminar el registro de pensión de <strong>{pets.find(deleting?.petId)?.name}</strong>?
        </p>
      </Modal>
    </>
  )
}
