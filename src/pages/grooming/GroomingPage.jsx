import { useState, useMemo } from 'react'
import { Search, Pencil, Trash2, Scissors, CheckCircle2, Clock } from 'lucide-react'

const WhatsAppIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

import { useApp } from '../../context/AppContext'
import EmptyState from '../../components/ui/EmptyState'
import Header from '../../components/layout/Header'
import Modal from '../../components/ui/Modal'
import InlinePanel from '../../components/ui/InlinePanel'
import SpeciesIcon from '../../components/ui/SpeciesIcon'
import GroomingForm from './GroomingForm'
import { formatDate, formatCurrency } from '../../utils/helpers'

function PendingBtn({ onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`chip ${hovered ? 'chip--ok' : 'chip--yellow'}`} style={{ border: 'none', cursor: 'pointer' }}
    >
      <Clock size={15} strokeWidth={2} />
      {hovered ? 'Cobrar' : 'No pagado'}
    </button>
  )
}

const PAYMENT_METHODS = [
  { value: 'efectivo',        label: 'Efectivo',         surcharge: 0    },
  { value: 'transferencia',   label: 'Transferencia',    surcharge: 0    },
  { value: 'tarjeta_debito',  label: 'Tarjeta débito',   surcharge: 0.05 },
  { value: 'tarjeta_credito', label: 'Tarjeta crédito',  surcharge: 0.20 },
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

export default function GroomingPage() {
  const { grooming, pets, owners } = useApp()
  const [search, setSearch]         = useState('')
  const [filterService, setFilterService] = useState('')
  const [filterPago, setFilterPago]   = useState('')
  const [filterFecha, setFilterFecha] = useState('')
  const [formOpen, setFormOpen]     = useState(false)
  const [editing, setEditing]       = useState(null)
  const [deleting, setDeleting]     = useState(null)
  const [paying, setPaying]         = useState(null)
  const [selected, setSelected]     = useState(null)

  const filtered = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return grooming.items
      .filter(g => {
        const pet   = pets.find(g.petId)
        const owner = owners.find(g.ownerId)
        const str   = `${pet?.name || ''} ${owner?.name || ''}`.toLowerCase()
        if (search && !str.includes(search.toLowerCase())) return false
        if (filterService && !(g.services || []).includes(filterService)) return false
        if (filterPago === 'pagado' && !g.paid) return false
        if (filterPago === 'pendiente' && g.paid) return false
        if (filterFecha === 'hoy' && g.date !== today) return false
        return true
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [grooming.items, search, filterService, filterPago, filterFecha, pets, owners])

  const handleSave     = (data) => { if (editing) grooming.update(editing.id, data); else grooming.add(data); setEditing(null) }
  const handleDelete   = () => { if (deleting?.id === selected?.id) setSelected(null); grooming.remove(deleting.id); setDeleting(null) }
  const handleMarkPaid = (method) => {
    const surchargeAmt = Math.round((paying.price || 0) * method.surcharge)
    grooming.update(paying.id, { paid: true, paymentMethod: method.value, price: (paying.price || 0) + surchargeAmt })
    setPaying(null)
  }

  const whatsappUrl = (phone) => `https://wa.me/${phone.replace(/\D/g, '')}`

  const selectedLive = selected ? grooming.items.find(g => g.id === selected.id) : null
  const selectedPet  = selectedLive ? pets.find(selectedLive.petId) : null
  const selectedOwner = selectedLive ? owners.find(selectedLive.ownerId) : null

  return (
    <>
      <Header
        title="Peluquería"
        subtitle={`${grooming.items.length} servicio${grooming.items.length !== 1 ? 's' : ''} registrado${grooming.items.length !== 1 ? 's' : ''}`}
      />
      <div className="page">
        <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-wrap" style={{ flex: 1, minWidth: 200, maxWidth: 360 }}>
            <span className="search-icon"><Search size={18} strokeWidth={2} /></span>
            <input
              className="form-input"
              placeholder="Buscar mascota o dueño..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn--primary" style={{ marginLeft: 'auto' }} onClick={() => { setEditing(null); setFormOpen(true) }}>
            + Nuevo turno
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="tabs">
            <button className={`tab${filterFecha === '' ? ' active' : ''}`} onClick={() => setFilterFecha('')}>Todas las fechas</button>
            <button className={`tab${filterFecha === 'hoy' ? ' active' : ''}`} onClick={() => setFilterFecha('hoy')}>Hoy</button>
          </div>
          <div className="tabs">
            <button className={`tab${filterService === '' ? ' active' : ''}`} onClick={() => setFilterService('')}>Todos los servicios</button>
            <button className={`tab${filterService === 'Baño' ? ' active' : ''}`} onClick={() => setFilterService('Baño')}>Baño</button>
            <button className={`tab${filterService === 'Baño + corte completo' ? ' active' : ''}`} onClick={() => setFilterService('Baño + corte completo')}>Baño + corte completo</button>
          </div>
          <div className="tabs">
            <button className={`tab${filterPago === '' ? ' active' : ''}`} onClick={() => setFilterPago('')}>Todos</button>
            <button className={`tab${filterPago === 'pagado' ? ' active' : ''}`} onClick={() => setFilterPago('pagado')}>Pagado</button>
            <button className={`tab${filterPago === 'pendiente' ? ' active' : ''}`} onClick={() => setFilterPago('pendiente')}>No pagado</button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Scissors size={48} strokeWidth={1.25} />}
            title="Sin servicios de peluquería"
            text="No hay registros con estos filtros."
            action={<button className="btn btn--primary" onClick={() => setFormOpen(true)}>+ Nuevo turno</button>}
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
                      <th>Precio</th>
                      <th>Estado</th>
                      <th style={{ width: 80 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(g => {
                      const pet   = pets.find(g.petId)
                      const owner = pet?.ownerId ? owners.find(pet.ownerId) : null
                      return (
                        <tr
                          key={g.id}
                          onClick={() => setSelected(g)}
                          style={{ cursor: 'pointer', background: selected?.id === g.id ? 'color-mix(in srgb, var(--accent) 6%, transparent)' : undefined }}
                        >
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{
                                width: 32, height: 32, borderRadius: 'var(--r-sm)',
                                background: 'rgba(0,122,255,0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'var(--blue)', flexShrink: 0 }}>
                                <SpeciesIcon species={pet?.species} size={16} strokeWidth={1.5} />
                              </div>
                              <span style={{ fontWeight: 600, fontSize: 14 }}>{pet?.name || '—'}</span>
                            </div>
                          </td>
                          <td>
                            {owner ? (
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 14 }}>{owner.name}</div>
                                {owner.phone && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{owner.phone}</span>
                                    <a href={whatsappUrl(owner.phone)} target="_blank" rel="noopener noreferrer" style={{ color: '#25D366' }} onClick={e => e.stopPropagation()}>
                                      <WhatsAppIcon size={13} />
                                    </a>
                                  </div>
                                )}
                              </div>
                            ) : <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                          </td>
                          <td style={{ fontWeight: 700, color: 'var(--vet-teal)' }}>
                            {g.price > 0 ? formatCurrency(g.price) : '—'}
                          </td>
                          <td>
                            {g.paid
                              ? <span className="chip chip--ok"><CheckCircle2 size={13} strokeWidth={2.5} />Pagado</span>
                              : <PendingBtn onClick={(e) => { e.stopPropagation(); setPaying(g) }} />
                            }
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button className="btn btn--subtle btn--icon" onClick={(e) => { e.stopPropagation(); setEditing(g); setFormOpen(true) }}>
                                <Pencil size={18} strokeWidth={2} />
                              </button>
                              <button className="btn btn--subtle btn--icon" onClick={(e) => { e.stopPropagation(); setDeleting(g) }}>
                                <Trash2 size={18} strokeWidth={2} />
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
              {selectedLive && (
                <>
                  <Field label="Mascota">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 'var(--r-sm)', background: 'rgba(0,122,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue)', flexShrink: 0 }}>
                        <SpeciesIcon species={selectedPet?.species} size={14} strokeWidth={1.5} />
                      </div>
                      <span style={{ fontWeight: 600 }}>{selectedPet?.name || '—'}</span>
                      {selectedPet?.species && <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>({selectedPet.species})</span>}
                    </div>
                  </Field>
                  <Field label="Dueño">
                    {selectedOwner ? (
                      <div>
                        <div>{selectedOwner.name}</div>
                        {selectedOwner.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{selectedOwner.phone}</span>
                            <a
                              href={whatsappUrl(selectedOwner.phone)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn--subtle btn--icon"
                              style={{ color: '#25D366', padding: '2px 4px', lineHeight: 1 }}
                              title="Enviar WhatsApp"
                              onClick={e => e.stopPropagation()}
                            >
                              <WhatsAppIcon size={15} />
                            </a>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </Field>
                  <Divider />
                  <Field label="Fecha">{selectedLive.date ? formatDate(selectedLive.date) : null}</Field>
                  <Field label="Servicios">
                    {(selectedLive.services || []).length > 0 ? (selectedLive.services.join(', ')) : null}
                  </Field>
                  <Field label="Precio">
                    {selectedLive.price > 0 ? <span style={{ fontWeight: 700, color: 'var(--vet-teal)' }}>{formatCurrency(selectedLive.price)}</span> : null}
                  </Field>
                  <Field label="Estado de pago">
                    {selectedLive.paid
                      ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--ok)', fontWeight: 600 }}><CheckCircle2 size={14} strokeWidth={2} />Pagado{selectedLive.paymentMethod ? ` · ${PM_LABEL[selectedLive.paymentMethod] || selectedLive.paymentMethod}` : ''}</span>
                      : <span style={{ color: 'var(--warn)', fontWeight: 600 }}>No pagado</span>
                    }
                  </Field>
                  {selectedLive.observations && (
                    <Field label="Observaciones">{selectedLive.observations}</Field>
                  )}
                  <Divider />
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
              )}
            </InlinePanel>
          </div>
        )}
      </div>

      <GroomingForm
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null) }}
        onSave={handleSave}
        initial={editing}
      />

      <Modal
        isOpen={!!paying}
        onClose={() => setPaying(null)}
        title="Registrar pago"
        size="sm"
      >
        <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: 14 }}>
          Seleccioná la forma de pago para <strong>{pets.find(paying?.petId)?.name}</strong>:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {PAYMENT_METHODS.map(m => {
            const surchargeAmt = Math.round((paying?.price || 0) * m.surcharge)
            const total = (paying?.price || 0) + surchargeAmt
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => handleMarkPaid(m)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 14px', borderRadius: 'var(--r-md)',
                  border: '1px solid var(--border)', background: 'var(--bg-sub)',
                  cursor: 'pointer', fontSize: 14, transition: 'all var(--t-fast)' }}
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

      <Modal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title="Eliminar servicio"
        size="sm"
        footer={
          <>
            <button className="btn btn--ghost" onClick={() => setDeleting(null)}>Cancelar</button>
            <button className="btn btn--danger" onClick={handleDelete}>Eliminar</button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)' }}>
          ¿Eliminar el servicio de peluquería de <strong>{pets.find(deleting?.petId)?.name}</strong>?
        </p>
      </Modal>
    </>
  )
}
