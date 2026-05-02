import { useState, useMemo } from 'react'
import { Search, Plus, Pencil, Trash2, Home, Check, CheckCircle2, Clock } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import Header from '../../components/layout/Header'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import InlinePanel from '../../components/ui/InlinePanel'
import BoardingForm from './BoardingForm'
import { formatDate, formatCurrency, todayStr } from '../../utils/helpers'

const WhatsAppIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

const whatsappUrl = (phone) => phone ? `https://wa.me/${phone.replace(/\D/g, '')}` : '#'

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
      {hovered ? 'Cobrar' : 'No pagado'}
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
            <button className={`tab${filterPago === 'pendiente' ? ' active' : ''}`} onClick={() => setFilterPago('pendiente')}>No pagado</button>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
            <div className="card card--no-hover card--table">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Mascota</th>
                      <th>Dueño</th>
                      <th>Ingreso</th>
                      <th style={{ textAlign: 'right' }}>Días</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
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
              headerColor={selectedLive?.paid ? 'var(--ok-3)' : 'var(--warn-3)'}
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
                    <Field label="Estado">
                      {selectedLive.paid
                        ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--ok)', fontWeight: 600 }}><CheckCircle2 size={14} strokeWidth={2} />Pagado{selectedLive.paymentMethod ? ` · ${PM_LABEL[selectedLive.paymentMethod] || selectedLive.paymentMethod}` : ''}</span>
                        : <span style={{ color: 'var(--warn)', fontWeight: 600 }}>No pagado</span>
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
