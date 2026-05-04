import { useState, useMemo } from 'react'
import { Search, Plus, Pencil, Trash2, Stethoscope, Clock, CheckCircle2 } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import Header from '../../components/layout/Header'

const WhatsAppIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

const whatsappUrl = (phone) => phone ? `https://wa.me/${phone.replace(/\D/g, '')}` : '#'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import InlinePanel from '../../components/ui/InlinePanel'
import ConsultaForm from './ConsultaForm'
import { formatDate, formatCurrency } from '../../utils/helpers'

const PAYMENT_METHODS = [
  { value: 'efectivo',        label: 'Efectivo',        surcharge: 0    },
  { value: 'transferencia',   label: 'Transferencia',   surcharge: 0    },
  { value: 'tarjeta_debito',  label: 'Tarjeta débito',  surcharge: 0.05 },
  { value: 'tarjeta_credito', label: 'Tarjeta crédito', surcharge: 0.20 },
]

const PM_LABEL = { efectivo: 'Efectivo', tarjeta_credito: 'Tarjeta crédito', tarjeta_debito: 'Tarjeta débito', transferencia: 'Transferencia' }

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
      <Clock size={15} strokeWidth={2} style={{ flexShrink: 0 }} />
      {hovered ? 'Cobrar' : 'No pagado'}
    </button>
  )
}

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

export default function ConsultasPage() {
  const { consultas, pets, owners, syncDebt } = useApp()
  const [search, setSearch]         = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [formOpen, setFormOpen]     = useState(false)
  const [editing, setEditing]       = useState(null)
  const [deleting, setDeleting]     = useState(null)
  const [paying, setPaying]         = useState(null)
  const [selected, setSelected]     = useState(null)

  const filtered = useMemo(() =>
    consultas.items
      .filter(c => {
        const pet   = pets.find(c.petId)
        const owner = owners.find(c.ownerId)
        const str   = `${pet?.name || ''} ${owner?.name || ''} ${c.reason} ${c.diagnosis || ''}`.toLowerCase()
        return str.includes(search.toLowerCase()) && (typeFilter === 'all' || c.type === typeFilter)
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [consultas.items, search, typeFilter, pets, owners]
  )

  const handleSave = (data) => {
    let savedId
    if (editing) { consultas.update(editing.id, data); savedId = editing.id }
    else { const created = consultas.add(data); savedId = created.id }
    if (data.price > 0) {
      const pet = pets.find(data.petId)
      if (pet?.ownerId) syncDebt('consulta', savedId, pet.ownerId, data.price, data.paymentStatus === 'paid' ? data.price : 0)
    }
    setEditing(null)
  }

  const handleMarkPaid = (method) => {
    const surchargeAmt = Math.round((paying.price || 0) * method.surcharge)
    consultas.update(paying.id, { paymentStatus: 'paid', paymentMethod: method.value, price: (paying.price || 0) + surchargeAmt })
    setPaying(null)
  }

  const handleDelete = () => {
    if (deleting.price > 0) {
      const pet = pets.find(deleting.petId)
      if (pet?.ownerId) syncDebt('consulta', deleting.id, pet.ownerId, deleting.price, deleting.price)
    }
    consultas.remove(deleting.id)
    setDeleting(null)
  }

  const selectedLive = selected ? consultas.items.find(c => c.id === selected.id) : null
  const selectedPet  = selectedLive ? pets.find(selectedLive.petId) : null
  const selectedOwner = selectedLive ? owners.find(selectedLive.ownerId) : null

  return (
    <>
      <Header
        title="Consultas"
        subtitle={`${consultas.items.length} consulta${consultas.items.length !== 1 ? 's' : ''} registrada${consultas.items.length !== 1 ? 's' : ''}`}
      />
      <div className="page">
        <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-wrap" style={{ flex: 1, minWidth: 200 }}>
            <Search size={18} className="search-icon" />
            <input
              className="form-input"
              style={{ paddingLeft: 36 }}
              placeholder="Buscar mascota, dueño, motivo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn--primary" style={{ marginLeft: 'auto' }} onClick={() => { setEditing(null); setFormOpen(true) }}>
            <Plus size={18} /> Nueva consulta
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <div className="tabs">
            {[
              { value: 'all',         label: 'Todas' },
              { value: 'consultorio', label: 'Consultorio' },
              { value: 'domicilio',   label: 'Domicilio' },
            ].map(t => (
              <button key={t.value} className={`tab${typeFilter === t.value ? ' active' : ''}`} onClick={() => setTypeFilter(t.value)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Stethoscope size={40} strokeWidth={1.5} />}
            title="Sin consultas"
            text={search ? 'No hay consultas que coincidan' : 'Registrá la primera consulta'}
            action={!search
              ? <button className="btn btn--primary" onClick={() => { setEditing(null); setFormOpen(true) }}><Plus size={18} /> Nueva consulta</button>
              : null
            }
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
            <div className="card card--no-hover card--table">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Mascota</th>
                      <th>Dueño</th>
                      <th>Motivo</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                      <th>Estado</th>
                      <th style={{ width: 80 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(c => {
                      const pet   = pets.find(c.petId)
                      const owner = pet?.ownerId ? owners.find(pet.ownerId) : null
                      const paid  = c.paymentStatus === 'paid'
                      return (
                        <tr
                          key={c.id}
                          onClick={() => setSelected(c)}
                          style={{ cursor: 'pointer', background: selected?.id === c.id ? 'color-mix(in srgb, var(--accent) 6%, transparent)' : undefined }}
                        >
                          <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                            {formatDate(c.date)}
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{pet?.name || '—'}</div>
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
                          <td style={{ maxWidth: 220 }}>
                            <div style={{ fontSize: 14 }} className="truncate">{c.reason || '—'}</div>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--vet-teal)', whiteSpace: 'nowrap' }}>
                            {c.price > 0 ? formatCurrency(c.price) : '—'}
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            {c.price > 0
                              ? paid
                                ? <span className="chip chip--ok"><CheckCircle2 size={13} strokeWidth={2.5} />Pagado</span>
                                : <PendingBtn onClick={(e) => { e.stopPropagation(); setPaying(c) }} />
                              : <span style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>—</span>
                            }
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                              <button className="btn btn--subtle btn--icon" onClick={(e) => { e.stopPropagation(); setEditing(c); setFormOpen(true) }} title="Editar">
                                <Pencil size={18} />
                              </button>
                              <button className="btn btn--subtle btn--icon" onClick={(e) => { e.stopPropagation(); setDeleting(c) }} title="Eliminar" style={{ color: 'var(--vet-rose)' }}>
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
              headerColor={selectedLive?.paymentStatus === 'paid' ? 'var(--ok-3)' : 'var(--warn-3)'}
            >
              {selectedLive && (
                <>
                  <Field label="Mascota">
                    <div style={{ fontWeight: 600 }}>{selectedPet?.name || '—'}</div>
                    {selectedPet?.species && <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{selectedPet.species}</div>}
                  </Field>
                  <Field label="Dueño">
                    {selectedOwner ? (
                      <div>
                        <div>{selectedOwner.name}</div>
                        {selectedOwner.phone && <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{selectedOwner.phone}</div>}
                      </div>
                    ) : null}
                  </Field>
                  <Divider />
                  <Field label="Fecha">{selectedLive.date ? formatDate(selectedLive.date) : null}</Field>
                  <Field label="Tipo">{selectedLive.type === 'consultorio' ? 'Consultorio' : selectedLive.type === 'domicilio' ? 'Domicilio' : null}</Field>
                  <Field label="Motivo">{selectedLive.reason || null}</Field>
                  <Field label="Diagnóstico">{selectedLive.diagnosis || null}</Field>
                  <Field label="Tratamiento">{selectedLive.treatment || null}</Field>
                  <Field label="Total">
                    {selectedLive.price > 0 ? <span style={{ fontWeight: 700, color: 'var(--vet-teal)' }}>{formatCurrency(selectedLive.price)}</span> : null}
                  </Field>
                  <Field label="Estado de pago">
                    {selectedLive.price > 0 ? (
                      selectedLive.paymentStatus === 'paid'
                        ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--ok)', fontWeight: 600 }}><CheckCircle2 size={14} strokeWidth={2} />Pagado{selectedLive.paymentMethod ? ` · ${PM_LABEL[selectedLive.paymentMethod] || selectedLive.paymentMethod}` : ''}</span>
                        : <span style={{ color: 'var(--warn)', fontWeight: 600 }}>No pagado</span>
                    ) : <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                  </Field>
                  {selectedLive.observations && <Field label="Observaciones">{selectedLive.observations}</Field>}
                  <Divider />
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="btn btn--ghost btn--sm" onClick={() => { setEditing(selectedLive); setFormOpen(true) }}>
                      <Pencil size={14} /> Editar
                    </button>
                    <button className="btn btn--ghost btn--sm" style={{ color: 'var(--danger)' }} onClick={() => setDeleting(selectedLive)}>
                      <Trash2 size={14} /> Eliminar
                    </button>
                    {selectedLive.price > 0 && selectedLive.paymentStatus !== 'paid' && (
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

      <ConsultaForm
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

      <Modal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title="Eliminar consulta"
        size="sm"
        footer={
          <>
            <button className="btn btn--ghost" onClick={() => setDeleting(null)}>Cancelar</button>
            <button className="btn btn--danger" onClick={handleDelete}>Eliminar</button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)' }}>
          ¿Eliminar la consulta del {formatDate(deleting?.date)} de <strong>{pets.find(deleting?.petId)?.name}</strong>?
        </p>
      </Modal>
    </>
  )
}
