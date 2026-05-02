import { useState, useMemo } from 'react'
import { Search, Plus, Pencil, Trash2, Home, Check, CheckCircle2, Clock } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import Header from '../../components/layout/Header'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import InlinePanel from '../../components/ui/InlinePanel'
import BoardingForm from './BoardingForm'
import { formatDate, formatCurrency, todayStr } from '../../utils/helpers'

function calcDays(entryDate, exitDate) {
  const start = new Date(entryDate)
  const end = exitDate ? new Date(exitDate) : new Date()
  start.setHours(0, 0, 0, 0); end.setHours(0, 0, 0, 0)
  return Math.max(1, Math.round((end - start) / 86400000))
}

function PendingBtn({ onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button type="button" onClick={onClick}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color var(--t-fast)', color: hovered ? 'var(--ok)' : 'var(--warn)' }}
    >
      <Clock size={15} strokeWidth={2} />
      {hovered ? 'Cobrar' : 'Pendiente'}
    </button>
  )
}

const PAYMENT_METHODS = [
  { value: 'efectivo',        label: 'Efectivo',        surcharge: 0    },
  { value: 'transferencia',   label: 'Transferencia',   surcharge: 0    },
  { value: 'tarjeta_debito',  label: 'Tarjeta débito',  surcharge: 0.05 },
  { value: 'tarjeta_credito', label: 'Tarjeta crédito', surcharge: 0.20 },
]

const PM_LABEL = { efectivo: 'Efectivo', tarjeta_credito: 'Tarjeta crédito', tarjeta_debito: 'Tarjeta débito', transferencia: 'Transferencia' }

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>{children || <span style={{ color: 'var(--text-tertiary)' }}>—</span>}</div>
    </div>
  )
}

function Divider() {
  return <div style={{ borderTop: '1px solid var(--border-2)', margin: '12px 0' }} />
}

export default function BoardingPage() {
  const { boarding, pets, owners } = useApp()
  const [search, setSearch]               = useState('')
  const [statusFilter, setStatusFilter]   = useState('active')
  const [filterPago, setFilterPago]       = useState('')
  const [formOpen, setFormOpen]           = useState(false)
  const [editing, setEditing]             = useState(null)
  const [deleting, setDeleting]           = useState(null)
  const [checkoutTarget, setCheckoutTarget] = useState(null)
  const [paying, setPaying]               = useState(null)
  const [selected, setSelected]           = useState(null)

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
        if (!str.includes(search.toLowerCase())) return false
        if (statusFilter !== 'all' && b.status !== statusFilter) return false
        if (filterPago === 'pagado' && !b.paid) return false
        if (filterPago === 'pendiente' && b.paid) return false
        return true
      })
      .sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate)),
    [boarding.items, search, statusFilter, filterPago, pets, owners]
  )

  const handleSave     = (data) => { if (editing) boarding.update(editing.id, data); else boarding.add(data); setEditing(null) }
  const handleCheckout = () => { boarding.update(checkoutTarget.id, { status: 'completed', exitDate: todayStr() }); setCheckoutTarget(null) }
  const handleDelete   = () => { if (deleting?.id === selected?.id) setSelected(null); boarding.remove(deleting.id); setDeleting(null) }
  const handleMarkPaid = (method) => {
    const days         = calcDays(paying.entryDate, paying.exitDate)
    const price        = paying.dailyPrice > 0 ? paying.dailyPrice * days : 0
    const surchargeAmt = Math.round(price * method.surcharge)
    boarding.update(paying.id, { paid: true, paymentMethod: method.value, paidAmount: price + surchargeAmt })
    setPaying(null)
  }

  const selectedLive  = selected ? boarding.items.find(b => b.id === selected.id) : null
  const selectedPet   = selectedLive ? pets.find(selectedLive.petId) : null
  const selectedOwner = selectedLive ? owners.find(selectedLive.ownerId) : null

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
            <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Buscar mascota o dueño..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn--primary" style={{ marginLeft: 'auto' }} onClick={() => { setEditing(null); setFormOpen(true) }}>
            <Plus size={18} /> Nuevo pensionado
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
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
          <div className="tabs">
            <button className={`tab${filterPago === '' ? ' active' : ''}`} onClick={() => setFilterPago('')}>Todos</button>
            <button className={`tab${filterPago === 'pagado' ? ' active' : ''}`} onClick={() => setFilterPago('pagado')}>Pagado</button>
            <button className={`tab${filterPago === 'pendiente' ? ' active' : ''}`} onClick={() => setFilterPago('pendiente')}>Pendiente</button>
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
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div className="card card--no-hover card--table" style={{ flex: 1, minWidth: 0 }}>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Mascota</th>
                      <th>Ingreso</th>
                      <th style={{ textAlign: 'right' }}>Días</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                      <th>Pago</th>
                      <th>Estado</th>
                      <th style={{ width: 120 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(b => {
                      const pet      = pets.find(b.petId)
                      const isActive = b.status === 'active'
                      const days     = calcDays(b.entryDate, b.exitDate)
                      const total    = b.dailyPrice > 0 ? b.dailyPrice * days : null
                      return (
                        <tr
                          key={b.id}
                          onClick={() => setSelected(b)}
                          style={{ cursor: 'pointer', background: selected?.id === b.id ? 'color-mix(in srgb, var(--accent) 6%, transparent)' : undefined }}
                        >
                          <td>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{pet?.name || '—'}</div>
                          </td>
                          <td style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{formatDate(b.entryDate)}</td>
                          <td style={{ textAlign: 'right', fontSize: 13 }}>{days}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--vet-teal)', whiteSpace: 'nowrap', fontSize: 14 }}>
                            {total ? formatCurrency(total) : '—'}
                          </td>
                          <td>
                            {b.paid
                              ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--ok)', fontSize: 13, fontWeight: 600 }}><CheckCircle2 size={15} strokeWidth={2} />Pagado</span>
                              : <PendingBtn onClick={(e) => { e.stopPropagation(); setPaying(b) }} />
                            }
                          </td>
                          <td>
                            <span style={{ fontSize: 13, fontWeight: 600, color: isActive ? 'var(--blue)' : 'var(--ok)' }}>
                              {isActive ? 'En pensión' : 'Retirado'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                              {isActive && (
                                <button className="btn btn--subtle btn--sm" onClick={(e) => { e.stopPropagation(); setCheckoutTarget(b) }} title="Registrar retiro">
                                  <Check size={14} strokeWidth={2.5} /> Retirar
                                </button>
                              )}
                              <button className="btn btn--subtle btn--icon" onClick={(e) => { e.stopPropagation(); setEditing(b); setFormOpen(true) }} title="Editar">
                                <Pencil size={18} />
                              </button>
                              <button className="btn btn--subtle btn--icon" onClick={(e) => { e.stopPropagation(); setDeleting(b) }} title="Eliminar" style={{ color: 'var(--vet-rose)' }}>
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

            <InlinePanel
              isOpen={!!selectedLive}
              onClose={() => setSelected(null)}
              title={selectedPet?.name || 'Detalle'}
            >
              {selectedLive && (() => {
                const days  = calcDays(selectedLive.entryDate, selectedLive.exitDate)
                const total = selectedLive.dailyPrice > 0 ? selectedLive.dailyPrice * days : null
                const isActive = selectedLive.status === 'active'
                return (
                  <>
                    <Field label="Mascota">
                      <span style={{ fontWeight: 600 }}>{selectedPet?.name || '—'}</span>
                      {selectedPet?.species && <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}> ({selectedPet.species})</span>}
                    </Field>
                    <Field label="Dueño">{selectedOwner?.name}</Field>
                    <Divider />
                    <Field label="Ingreso">{selectedLive.entryDate ? formatDate(selectedLive.entryDate) : null}</Field>
                    <Field label="Egreso">{selectedLive.exitDate ? formatDate(selectedLive.exitDate) : <span style={{ color: 'var(--text-tertiary)' }}>En curso</span>}</Field>
                    <Field label="Días">{days}</Field>
                    {selectedLive.dailyPrice > 0 && <Field label="Precio diario">{formatCurrency(selectedLive.dailyPrice)}</Field>}
                    <Field label="Total">
                      {total ? <span style={{ fontWeight: 700, color: 'var(--vet-teal)' }}>{formatCurrency(total)}</span> : null}
                    </Field>
                    {selectedLive.feeding && <Field label="Alimentación">{selectedLive.feeding}</Field>}
                    {selectedLive.observations && <Field label="Observaciones">{selectedLive.observations}</Field>}
                    <Divider />
                    <Field label="Estado">
                      <span style={{ fontWeight: 600, color: isActive ? 'var(--blue)' : 'var(--ok)' }}>
                        {isActive ? 'En pensión' : 'Retirado'}
                      </span>
                    </Field>
                    <Field label="Pago">
                      {selectedLive.paid
                        ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--ok)', fontWeight: 600 }}><CheckCircle2 size={14} strokeWidth={2} />Pagado{selectedLive.paymentMethod ? ` · ${PM_LABEL[selectedLive.paymentMethod] || selectedLive.paymentMethod}` : ''}</span>
                        : <span style={{ color: 'var(--warn)', fontWeight: 600 }}>Pendiente</span>
                      }
                    </Field>
                    <Divider />
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {isActive && (
                        <button className="btn btn--ghost btn--sm" onClick={() => setCheckoutTarget(selectedLive)}>
                          <Check size={14} strokeWidth={2.5} /> Retirar
                        </button>
                      )}
                      <button className="btn btn--ghost btn--sm" onClick={() => { setEditing(selectedLive); setFormOpen(true) }}>
                        <Pencil size={14} /> Editar
                      </button>
                      <button className="btn btn--ghost btn--sm" style={{ color: 'var(--danger)' }} onClick={() => setDeleting(selectedLive)}>
                        <Trash2 size={14} /> Eliminar
                      </button>
                      {!selectedLive.paid && (
                        <button className="btn btn--primary btn--sm" style={{ marginLeft: 'auto' }} onClick={() => setPaying(selectedLive)}>
                          Cobrar
                        </button>
                      )}
                    </div>
                  </>
                )
              })()}
            </InlinePanel>
          </div>
        )}
      </div>

      <BoardingForm
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null) }}
        onSave={handleSave}
        initial={editing}
      />

      <Modal isOpen={!!paying} onClose={() => setPaying(null)} title="Registrar pago" size="sm">
        <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: 14 }}>
          Seleccioná la forma de pago para <strong>{pets.find(paying?.petId)?.name}</strong>:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {PAYMENT_METHODS.map(m => {
            const days         = paying ? calcDays(paying.entryDate, paying.exitDate) : 0
            const price        = paying?.dailyPrice > 0 ? paying.dailyPrice * days : 0
            const surchargeAmt = Math.round(price * m.surcharge)
            const total        = price + surchargeAmt
            return (
              <button key={m.value} type="button" onClick={() => handleMarkPaid(m)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--bg-sub)', cursor: 'pointer', fontSize: 14, transition: 'all var(--t-fast)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-3)'; e.currentTarget.style.borderColor = 'var(--accent)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-sub)'; e.currentTarget.style.borderColor = 'var(--border)' }}
              >
                <span style={{ fontWeight: 600 }}>{m.label}</span>
                <span style={{ fontWeight: 700, color: m.surcharge > 0 ? 'var(--orange)' : 'var(--accent)' }}>
                  {m.surcharge > 0 && <span style={{ fontWeight: 400, fontSize: 12, marginRight: 6, color: 'var(--orange)' }}>+{m.surcharge * 100}%</span>}
                  {formatCurrency(total)}
                </span>
              </button>
            )
          })}
        </div>
      </Modal>

      <Modal isOpen={!!checkoutTarget} onClose={() => setCheckoutTarget(null)} title="Registrar retiro" size="sm"
        footer={<><button className="btn btn--ghost" onClick={() => setCheckoutTarget(null)}>Cancelar</button><button className="btn btn--success" onClick={handleCheckout}><Check size={14} strokeWidth={2.5} /> Confirmar retiro</button></>}
      >
        <p style={{ color: 'var(--text-secondary)' }}>¿Confirmás el retiro de <strong>{pets.find(checkoutTarget?.petId)?.name}</strong> con fecha de hoy?</p>
      </Modal>

      <Modal isOpen={!!deleting} onClose={() => setDeleting(null)} title="Eliminar pensionado" size="sm"
        footer={<><button className="btn btn--ghost" onClick={() => setDeleting(null)}>Cancelar</button><button className="btn btn--danger" onClick={handleDelete}>Eliminar</button></>}
      >
        <p style={{ color: 'var(--text-secondary)' }}>¿Eliminar el registro de pensión de <strong>{pets.find(deleting?.petId)?.name}</strong>?</p>
      </Modal>
    </>
  )
}
