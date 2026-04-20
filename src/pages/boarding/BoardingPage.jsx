import { useState, useMemo } from 'react'
import { Search, Pencil, Trash2, Home, Check, UtensilsCrossed, StickyNote } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import Header from '../../components/layout/Header'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import SpeciesIcon from '../../components/ui/SpeciesIcon'
import BoardingForm from './BoardingForm'
import { formatDate, formatCurrency, todayStr } from '../../utils/helpers'

function calcDays(entryDate, exitDate) {
  const start = new Date(entryDate)
  const end = exitDate ? new Date(exitDate) : new Date()
  start.setHours(0, 0, 0, 0); end.setHours(0, 0, 0, 0)
  const days = Math.max(1, Math.round((end - start) / 86400000))
  return days
}

export default function BoardingPage() {
  const { boarding, pets, owners } = useApp()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [checkoutTarget, setCheckoutTarget] = useState(null)

  const activeCount = useMemo(() =>
    boarding.items.filter(b => b.status === 'active').length,
    [boarding.items]
  )

  const filtered = useMemo(() =>
    boarding.items
      .filter(b => {
        const pet = pets.find(b.petId)
        const owner = owners.find(b.ownerId)
        const str = `${pet?.name || ''} ${owner?.name || ''} ${b.feeding || ''} ${b.observations || ''}`.toLowerCase()
        return str.includes(search.toLowerCase()) &&
          (statusFilter === 'all' || b.status === statusFilter)
      })
      .sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate)),
    [boarding.items, search, statusFilter, pets, owners]
  )

  const handleSave = (data) => {
    if (editing) boarding.update(editing.id, data)
    else boarding.add(data)
    setEditing(null)
  }

  const handleCheckout = () => {
    boarding.update(checkoutTarget.id, { status: 'completed', exitDate: todayStr() })
    setCheckoutTarget(null)
    if (expanded === checkoutTarget.id) setExpanded(null)
  }

  const handleDelete = () => {
    boarding.remove(deleting.id)
    setDeleting(null)
    if (expanded === deleting.id) setExpanded(null)
  }

  return (
    <>
      <Header
        title="Pensionados"
        subtitle={activeCount > 0
          ? `${activeCount} mascota${activeCount !== 1 ? 's' : ''} en pensión`
          : 'Sin mascotas en pensión actualmente'
        }
        actions={
          <button className="btn btn--primary" onClick={() => { setEditing(null); setFormOpen(true) }}>
            + Nuevo pensionado
          </button>
        }
      />
      <div className="page">
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-wrap" style={{ flex: 1, minWidth: 200, maxWidth: 360 }}>
            <span className="search-icon"><Search size={14} strokeWidth={2} /></span>
            <input
              className="form-input"
              placeholder="Buscar mascota o dueño..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="tabs" style={{ flexShrink: 0 }}>
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
            icon={<Home size={48} strokeWidth={1.25} />}
            title="Sin pensionados"
            text={statusFilter === 'active' ? 'No hay mascotas en pensión actualmente.' : 'No hay registros con estos filtros.'}
            action={statusFilter === 'active' && (
              <button className="btn btn--primary" onClick={() => setFormOpen(true)}>+ Nuevo pensionado</button>
            )}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(b => {
              const pet = pets.find(b.petId)
              const owner = owners.find(b.ownerId)
              const isActive = b.status === 'active'
              const isExpanded = expanded === b.id
              const days = calcDays(b.entryDate, b.exitDate)
              const total = b.dailyPrice > 0 ? b.dailyPrice * days : null

              return (
                <div key={b.id} className="card card--no-hover">
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', cursor: 'pointer',
                      borderLeft: `3px solid ${isActive ? 'var(--blue)' : 'var(--green)'}`,
                    }}
                    onClick={() => setExpanded(isExpanded ? null : b.id)}
                  >
                    <div style={{
                      width: 48, height: 48, borderRadius: 'var(--r-md)', flexShrink: 0,
                      background: isActive ? 'rgba(0,122,255,0.10)' : 'rgba(52,199,89,0.10)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isActive ? 'var(--blue)' : 'var(--green)',
                    }}>
                      <SpeciesIcon species={pet?.species} size={24} strokeWidth={1.5} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>{pet?.name || '—'}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>·</span>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{owner?.name || '—'}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 3 }}>
                        Ingreso: {formatDate(b.entryDate)}
                        {b.exitDate ? ` · Egreso: ${formatDate(b.exitDate)}` : ` · ${days} día${days !== 1 ? 's' : ''} en pensión`}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
                      <Badge color={isActive ? 'blue' : 'green'} dot>
                        {isActive ? 'En pensión' : 'Retirado'}
                      </Badge>
                      {b.dailyPrice > 0 && (
                        <div style={{ fontSize: 13 }}>
                          <span style={{ color: 'var(--text-tertiary)' }}>{formatCurrency(b.dailyPrice)}/día</span>
                          {total && <span style={{ fontWeight: 700, color: 'var(--vet-teal)', marginLeft: 6 }}>= {formatCurrency(total)}</span>}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                      {isActive && (
                        <button className="btn btn--success btn--sm" onClick={() => setCheckoutTarget(b)}>
                          <Check size={13} strokeWidth={2.5} /> Retirar
                        </button>
                      )}
                      <button className="btn btn--subtle btn--sm btn--icon" onClick={() => { setEditing(b); setFormOpen(true) }}>
                        <Pencil size={16} strokeWidth={2} />
                      </button>
                      <button className="btn btn--subtle btn--sm btn--icon" onClick={() => setDeleting(b)}>
                        <Trash2 size={16} strokeWidth={2} />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px' }}>
                      <div className="detail-grid">
                        {b.dailyPrice > 0 && (
                          <div className="detail-item">
                            <div className="detail-item__label">Precio por día</div>
                            <div className="detail-item__value">{formatCurrency(b.dailyPrice)}</div>
                          </div>
                        )}
                        {total && (
                          <div className="detail-item">
                            <div className="detail-item__label">Total estimado</div>
                            <div className="detail-item__value" style={{ fontWeight: 700, color: 'var(--vet-teal)' }}>{formatCurrency(total)}</div>
                          </div>
                        )}
                        {b.feeding && (
                          <div className="detail-item" style={{ gridColumn: '1/-1' }}>
                            <div className="detail-item__label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <UtensilsCrossed size={12} strokeWidth={2} /> Alimentación
                            </div>
                            <div className="detail-item__value" style={{ fontSize: 14 }}>{b.feeding}</div>
                          </div>
                        )}
                        {b.observations && (
                          <div className="detail-item" style={{ gridColumn: '1/-1' }}>
                            <div className="detail-item__label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <StickyNote size={12} strokeWidth={2} /> Observaciones
                            </div>
                            <div className="detail-item__value" style={{ fontSize: 14 }}>{b.observations}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
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
