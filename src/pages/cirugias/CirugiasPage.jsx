import { useState, useMemo } from 'react'
import { Search, Pencil, Trash2, Syringe, Plus, CheckCircle2, Clock } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import Header from '../../components/layout/Header'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import InlinePanel from '../../components/ui/InlinePanel'
import SpeciesIcon from '../../components/ui/SpeciesIcon'
import CirugiasForm from './CirugiasForm'
import { formatDate, formatCurrency } from '../../utils/helpers'

function PendingBtn({ onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button type="button" onClick={onClick}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      className={`chip ${hovered ? 'chip--ok' : 'chip--yellow'}`} style={{ border: 'none', cursor: 'pointer' }}
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

export default function CirugiasPage() {
  const { cirugias, pets, owners } = useApp()
  const [search, setSearch]         = useState('')
  const [filterPago, setFilterPago] = useState('')
  const [formOpen, setFormOpen]     = useState(false)
  const [editing, setEditing]       = useState(null)
  const [deleting, setDeleting]     = useState(null)
  const [paying, setPaying]         = useState(null)
  const [selected, setSelected]     = useState(null)

  const filtered = useMemo(() =>
    cirugias.items
      .filter(c => {
        const pet = pets.find(c.petId)
        const owner = owners.find(c.ownerId)
        const str = `${pet?.name || ''} ${owner?.name || ''} ${c.diagnostico || ''} ${c.observaciones || ''}`.toLowerCase()
        if (!str.includes(search.toLowerCase())) return false
        if (filterPago === 'pagado' && !c.paid) return false
        if (filterPago === 'pendiente' && c.paid) return false
        return true
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [cirugias.items, search, filterPago, pets, owners]
  )

  const handleSave = (data) => {
    if (editing) cirugias.update(editing.id, data)
    else cirugias.add(data)
    setEditing(null)
  }

  const handleDelete   = () => { if (deleting?.id === selected?.id) setSelected(null); cirugias.remove(deleting.id); setDeleting(null) }
  const handleMarkPaid = (method) => {
    const price        = paying.costos || 0
    const surchargeAmt = Math.round(price * method.surcharge)
    cirugias.update(paying.id, { paid: true, paymentMethod: method.value, paidAmount: price + surchargeAmt })
    setPaying(null)
  }

  const selectedLive  = selected ? cirugias.items.find(c => c.id === selected.id) : null
  const selectedPet   = selectedLive ? pets.find(selectedLive.petId) : null
  const selectedOwner = selectedLive ? owners.find(selectedLive.ownerId) : null

  return (
    <>
      <Header
        title="Cirugía"
        subtitle={`${cirugias.items.length} cirugía${cirugias.items.length !== 1 ? 's' : ''} registrada${cirugias.items.length !== 1 ? 's' : ''}`}
      />
      <div className="page">
        <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-wrap" style={{ flex: 1, minWidth: 200, maxWidth: 360 }}>
            <span className="search-icon"><Search size={18} strokeWidth={2} /></span>
            <input className="form-input" placeholder="Buscar mascota, dueño, diagnóstico..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn--primary" style={{ marginLeft: 'auto' }} onClick={() => { setEditing(null); setFormOpen(true) }}>
            <Plus size={18} /> Nueva cirugía
          </button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div className="tabs">
            <button className={`tab${filterPago === '' ? ' active' : ''}`} onClick={() => setFilterPago('')}>Todos</button>
            <button className={`tab${filterPago === 'pagado' ? ' active' : ''}`} onClick={() => setFilterPago('pagado')}>Pagado</button>
            <button className={`tab${filterPago === 'pendiente' ? ' active' : ''}`} onClick={() => setFilterPago('pendiente')}>No pagado</button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Syringe size={48} strokeWidth={1.25} />}
            title="Sin cirugías registradas"
            text="No hay registros con estos filtros."
            action={<button className="btn btn--primary" onClick={() => setFormOpen(true)}><Plus size={18} /> Nueva cirugía</button>}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
            <div className="card card--no-hover card--table">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Mascota</th>
                      <th>Fecha</th>
                      <th>Diagnóstico</th>
                      <th style={{ textAlign: 'right' }}>Costos</th>
                      <th>Estado</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(c => {
                      const pet   = pets.find(c.petId)
                      return (
                        <tr
                          key={c.id}
                          onClick={() => setSelected(c)}
                          style={{ cursor: 'pointer', background: selected?.id === c.id ? 'color-mix(in srgb, var(--accent) 6%, transparent)' : undefined }}
                        >
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 32, height: 32, borderRadius: 'var(--r-sm)', background: 'rgba(0,122,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue)', flexShrink: 0 }}>
                                <SpeciesIcon species={pet?.species} size={16} strokeWidth={1.5} />
                              </div>
                              <span style={{ fontWeight: 600, fontSize: 14 }}>{pet?.name || '—'}</span>
                            </div>
                          </td>
                          <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{formatDate(c.date)}</td>
                          <td style={{ maxWidth: 260 }}>
                            <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {c.diagnostico || '—'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--vet-teal)', whiteSpace: 'nowrap' }}>
                            {c.costos > 0 ? formatCurrency(c.costos) : '—'}
                          </td>
                          <td>
                            {c.paid
                              ? <span className="chip chip--ok"><CheckCircle2 size={13} strokeWidth={2.5} />Pagado</span>
                              : <PendingBtn onClick={(e) => { e.stopPropagation(); setPaying(c) }} />
                            }
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                              <button className="btn btn--subtle btn--icon" onClick={(e) => { e.stopPropagation(); setEditing(c); setFormOpen(true) }}>
                                <Pencil size={18} strokeWidth={2} />
                              </button>
                              <button className="btn btn--subtle btn--icon" onClick={(e) => { e.stopPropagation(); setDeleting(c) }} style={{ color: 'var(--vet-rose)' }}>
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
                  <Field label="Dueño">{selectedOwner?.name}</Field>
                  <Field label="Fecha">{selectedLive.date ? formatDate(selectedLive.date) : null}</Field>
                  <Divider />
                  <Field label="Diagnóstico">{selectedLive.diagnostico}</Field>
                  {selectedLive.observaciones && <Field label="Observaciones">{selectedLive.observaciones}</Field>}
                  <Divider />
                  <Field label="Costos">
                    {selectedLive.costos > 0 ? <span style={{ fontWeight: 700, color: 'var(--vet-teal)' }}>{formatCurrency(selectedLive.costos)}</span> : null}
                  </Field>
                  <Field label="Estado">
                    {selectedLive.paid
                      ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--ok)', fontWeight: 600 }}><CheckCircle2 size={14} strokeWidth={2} />Pagado{selectedLive.paymentMethod ? ` · ${PM_LABEL[selectedLive.paymentMethod] || selectedLive.paymentMethod}` : ''}</span>
                      : <span style={{ color: 'var(--warn)', fontWeight: 600 }}>No pagado</span>
                    }
                  </Field>
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

      <CirugiasForm
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null) }}
        onSave={handleSave}
        initial={editing}
      />

      <Modal isOpen={!!paying} onClose={() => setPaying(null)} title="Registrar pago" size="sm">
        <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: 14 }}>
          Seleccioná la forma de pago para la cirugía de <strong>{pets.find(paying?.petId)?.name}</strong>:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {PAYMENT_METHODS.map(m => {
            const price        = paying?.costos || 0
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
                  {price > 0 ? formatCurrency(total) : '—'}
                </span>
              </button>
            )
          })}
        </div>
      </Modal>

      <Modal isOpen={!!deleting} onClose={() => setDeleting(null)} title="Eliminar cirugía" size="sm"
        footer={<><button className="btn btn--ghost" onClick={() => setDeleting(null)}>Cancelar</button><button className="btn btn--danger" onClick={handleDelete}>Eliminar</button></>}
      >
        <p style={{ color: 'var(--text-secondary)' }}>
          ¿Eliminar la cirugía de <strong>{pets.find(deleting?.petId)?.name}</strong>?
        </p>
      </Modal>
    </>
  )
}
