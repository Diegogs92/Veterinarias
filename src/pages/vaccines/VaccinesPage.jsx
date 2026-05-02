import { useState, useMemo } from 'react'
import {
  Syringe, Dog, Cat, ShieldCheck, RotateCw, AlertTriangle,
  Pencil, Trash2, Plus, Search, CalendarCheck, BookOpen,
  CheckCircle2, Clock,
} from 'lucide-react'
import Header from '../../components/layout/Header'
import Modal from '../../components/ui/Modal'
import InlinePanel from '../../components/ui/InlinePanel'
import EmptyState from '../../components/ui/EmptyState'
import VaccineCatalogForm from './VaccineCatalogForm'
import VaccineForm from './VaccineForm'
import { useApp } from '../../context/AppContext'
import { formatDate, formatCurrency } from '../../utils/helpers'

const TONE_CFG = {
  first:    { color: 'var(--accent)',       bg: 'var(--accent-3)',  Icon: ShieldCheck,   label: 'Inicial'  },
  annual:   { color: 'var(--vet-emerald)',  bg: 'var(--ok-3)',      Icon: RotateCw,      label: 'Anual'    },
  optional: { color: 'var(--warn)',         bg: 'var(--warn-3)',    Icon: AlertTriangle, label: 'Opcional' },
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

export default function VaccinesPage() {
  const { vaccineCatalog, petVaccines, pets, owners } = useApp()

  const [species, setSpecies]       = useState('dog')
  const [search, setSearch]         = useState('')
  const [filterPago, setFilterPago] = useState('')
  const [catalogOpen, setCatalogOpen] = useState(false)

  const [catalogForm, setCatalogForm]   = useState({ open: false, editing: null })
  const [vaccineForm, setVaccineForm]   = useState({ open: false, editing: null, prefill: null })
  const [deletingCat, setDeletingCat]   = useState(null)
  const [deletingVacc, setDeletingVacc] = useState(null)
  const [paying, setPaying]             = useState(null)
  const [selected, setSelected]         = useState(null)

  const filteredCatalog = useMemo(() =>
    vaccineCatalog.items.filter(v => v.species === species || v.species === 'both'),
    [vaccineCatalog.items, species]
  )

  const filteredRecords = useMemo(() => {
    const q = search.toLowerCase()
    return petVaccines.items
      .filter(v => {
        const pet = pets.find(v.petId)
        if (q && !v.vaccineName?.toLowerCase().includes(q) && !pet?.name?.toLowerCase().includes(q)) return false
        if (filterPago === 'pagado' && !v.paid) return false
        if (filterPago === 'pendiente' && v.paid) return false
        return true
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [petVaccines.items, pets, search, filterPago])

  const openRegisterFromCard = (catalogItem) => {
    setCatalogOpen(false)
    setVaccineForm({ open: true, editing: null, prefill: { vaccineName: catalogItem.name, catalogId: catalogItem.id } })
  }

  const handleSaveCatalog = (data) => {
    if (catalogForm.editing) vaccineCatalog.update(catalogForm.editing.id, data)
    else vaccineCatalog.add(data)
  }

  const handleSaveVaccine = (data) => {
    if (vaccineForm.editing) petVaccines.update(vaccineForm.editing.id, data)
    else petVaccines.add(data)
  }

  const handleMarkPaid = (method) => {
    petVaccines.update(paying.id, { paid: true, paymentMethod: method.value })
    setPaying(null)
  }

  const selectedLive = selected ? petVaccines.items.find(v => v.id === selected.id) : null
  const selectedPet  = selectedLive ? pets.find(selectedLive.petId) : null
  const selectedOwner = selectedLive && selectedPet ? owners.find(selectedPet.ownerId) : null
  const isOverdue = selectedLive?.nextDue && new Date(selectedLive.nextDue) < new Date()

  return (
    <>
      <Header
        title="Vacunas"
        subtitle={`${petVaccines.items.length} registro${petVaccines.items.length !== 1 ? 's' : ''}`}
      />

      <div className="page">
        <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-wrap" style={{ flex: 1, minWidth: 200 }}>
            <Search size={18} className="search-icon" />
            <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Buscar mascota o vacuna..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn--ghost" onClick={() => setCatalogOpen(true)} style={{ gap: 6 }}>
            <BookOpen size={16} strokeWidth={2} /> Catálogo
          </button>
          <button className="btn btn--primary" onClick={() => setVaccineForm({ open: true, editing: null, prefill: null })}>
            <Syringe size={17} /> Registrar vacuna
          </button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div className="tabs">
            <button className={`tab${filterPago === '' ? ' active' : ''}`} onClick={() => setFilterPago('')}>Todos</button>
            <button className={`tab${filterPago === 'pagado' ? ' active' : ''}`} onClick={() => setFilterPago('pagado')}>Pagado</button>
            <button className={`tab${filterPago === 'pendiente' ? ' active' : ''}`} onClick={() => setFilterPago('pendiente')}>No pagado</button>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <EmptyState
            icon={<CalendarCheck size={40} strokeWidth={1.5} />}
            title="Sin registros"
            text={search || filterPago ? 'No hay resultados para los filtros aplicados.' : 'Registrá la primera vacuna aplicada a una mascota.'}
            action={!search && !filterPago && (
              <button className="btn btn--primary" onClick={() => setVaccineForm({ open: true, editing: null, prefill: null })}>
                <Syringe size={16} /> Registrar vacuna
              </button>
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
                      <th>Vacuna</th>
                      <th>Fecha</th>
                      <th style={{ textAlign: 'right' }}>Monto</th>
                      <th>Estado</th>
                      <th style={{ width: 80 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map(r => {
                      const pet = pets.find(r.petId)
                      return (
                        <tr
                          key={r.id}
                          onClick={() => setSelected(r)}
                          style={{ cursor: 'pointer', background: selected?.id === r.id ? 'color-mix(in srgb, var(--accent) 6%, transparent)' : undefined }}
                        >
                          <td>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 14 }}>{pet?.name || '—'}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{pet?.species || ''}</div>
                            </div>
                          </td>
                          <td style={{ fontSize: 14 }}>{r.vaccineName}</td>
                          <td style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{r.date ? formatDate(r.date) : '—'}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--vet-teal)', whiteSpace: 'nowrap', fontSize: 14 }}>
                            {r.price > 0 ? formatCurrency(r.price) : '—'}
                          </td>
                          <td>
                            {r.paid
                              ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--ok)', fontSize: 13, fontWeight: 600 }}><CheckCircle2 size={15} strokeWidth={2} />Pagado</span>
                              : <PendingBtn onClick={(e) => { e.stopPropagation(); setPaying(r) }} />
                            }
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                              <button className="btn btn--subtle btn--icon" onClick={(e) => { e.stopPropagation(); setVaccineForm({ open: true, editing: r, prefill: null }) }} title="Editar">
                                <Pencil size={18} />
                              </button>
                              <button className="btn btn--subtle btn--icon" onClick={(e) => { e.stopPropagation(); setDeletingVacc(r) }} title="Eliminar" style={{ color: 'var(--vet-rose)' }}>
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
                  <Field label="Vacuna">{selectedLive.vaccineName}</Field>
                  <Field label="Fecha aplicada">{selectedLive.date ? formatDate(selectedLive.date) : null}</Field>
                  <Field label="Próximo vencimiento">
                    {selectedLive.nextDue ? (
                      <span style={{ color: isOverdue ? 'var(--danger)' : 'inherit', fontWeight: isOverdue ? 600 : 400 }}>
                        {isOverdue && '⚠ '}{formatDate(selectedLive.nextDue)}
                      </span>
                    ) : null}
                  </Field>
                  <Field label="Monto">
                    {selectedLive.price > 0 ? <span style={{ fontWeight: 700, color: 'var(--vet-teal)' }}>{formatCurrency(selectedLive.price)}</span> : null}
                  </Field>
                  <Field label="Estado de pago">
                    {selectedLive.paid
                      ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--ok)', fontWeight: 600 }}><CheckCircle2 size={14} strokeWidth={2} />Pagado{selectedLive.paymentMethod ? ` · ${PM_LABEL[selectedLive.paymentMethod] || selectedLive.paymentMethod}` : ''}</span>
                      : <span style={{ color: 'var(--warn)', fontWeight: 600 }}>No pagado</span>
                    }
                  </Field>
                  {selectedLive.notes && <Field label="Observaciones">{selectedLive.notes}</Field>}
                  <Divider />
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="btn btn--ghost btn--sm" onClick={() => { setEditing(selectedLive); setVaccineForm({ open: true, editing: selectedLive, prefill: null }) }}>
                      <Pencil size={14} /> Editar
                    </button>
                    <button className="btn btn--ghost btn--sm" style={{ color: 'var(--danger)' }} onClick={() => setDeletingVacc(selectedLive)}>
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

      {/* Catalog modal */}
      <Modal
        isOpen={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        title="Catálogo de vacunas"
        size="lg"
        style={{ maxWidth: 800 }}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <button className="btn btn--ghost" onClick={() => setCatalogOpen(false)}>Cerrar</button>
            <button className="btn btn--primary" onClick={() => { setCatalogOpen(false); setCatalogForm({ open: true, editing: null }) }}>
              <Plus size={16} /> Nueva vacuna
            </button>
          </div>
        }
      >
        <div className="tabs" style={{ marginBottom: 16, width: 'fit-content' }}>
          <button className={`tab${species === 'dog' ? ' active' : ''}`} onClick={() => setSpecies('dog')}>
            <Dog size={17} strokeWidth={2} style={{ marginRight: 6 }} /> Perros
          </button>
          <button className={`tab${species === 'cat' ? ' active' : ''}`} onClick={() => setSpecies('cat')}>
            <Cat size={17} strokeWidth={2} style={{ marginRight: 6 }} /> Gatos
          </button>
        </div>

        {filteredCatalog.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary)' }}>
            <Syringe size={36} strokeWidth={1.25} style={{ marginBottom: 10, opacity: 0.4 }} />
            <p style={{ margin: 0 }}>Sin vacunas en el catálogo para esta especie.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
            {filteredCatalog.map(v => {
              const cfg = TONE_CFG[v.tone] || TONE_CFG.first
              return (
                <div key={v.id} className="card card--no-hover" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0, background: cfg.bg, color: cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <cfg.Icon size={22} strokeWidth={1.85} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: '2px 8px', borderRadius: 999, textTransform: 'uppercase' }}>
                          {v.ageLabel}
                        </span>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{v.name}</div>
                      {v.description && (
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{v.description}</div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-2)', justifyContent: 'flex-end' }}>
                    <button className="btn btn--primary btn--sm" onClick={() => openRegisterFromCard(v)}>
                      <Syringe size={13} /> Registrar
                    </button>
                    <button className="btn btn--ghost btn--sm" onClick={() => { setCatalogOpen(false); setCatalogForm({ open: true, editing: v }) }}>
                      <Pencil size={13} />
                    </button>
                    <button className="btn btn--ghost btn--sm" style={{ color: 'var(--danger)' }} onClick={() => { setCatalogOpen(false); setDeletingCat(v) }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Modal>

      {/* Cobrar modal */}
      <Modal isOpen={!!paying} onClose={() => setPaying(null)} title="Registrar pago" size="sm">
        <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: 14 }}>
          Seleccioná la forma de pago para <strong>{pets.find(paying?.petId)?.name}</strong>:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {PAYMENT_METHODS.map(m => (
            <button key={m.value} type="button" onClick={() => handleMarkPaid(m)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--bg-sub)', cursor: 'pointer', fontSize: 14, transition: 'all var(--t-fast)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-3)'; e.currentTarget.style.borderColor = 'var(--accent)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-sub)'; e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              <span style={{ fontWeight: 600 }}>{m.label}</span>
              <span style={{ fontWeight: 700, color: 'var(--accent)' }}>
                {paying?.price > 0 ? formatCurrency(paying.price) : '—'}
              </span>
            </button>
          ))}
        </div>
      </Modal>

      {/* Catalog form modal */}
      <VaccineCatalogForm
        isOpen={catalogForm.open}
        onClose={() => setCatalogForm({ open: false, editing: null })}
        initial={catalogForm.editing}
        onSave={handleSaveCatalog}
      />

      {/* Pet vaccine registration modal */}
      <VaccineForm
        isOpen={vaccineForm.open}
        onClose={() => setVaccineForm({ open: false, editing: null, prefill: null })}
        initial={vaccineForm.editing ?? (vaccineForm.prefill ? vaccineForm.prefill : null)}
        onSave={handleSaveVaccine}
      />

      {/* Delete catalog entry */}
      <Modal isOpen={!!deletingCat} onClose={() => setDeletingCat(null)} title="Eliminar vacuna del catálogo" size="sm"
        footer={<><button className="btn btn--ghost" onClick={() => setDeletingCat(null)}>Cancelar</button><button className="btn btn--danger" onClick={() => { vaccineCatalog.remove(deletingCat.id); setDeletingCat(null) }}>Eliminar</button></>}
      >
        <p>¿Eliminar <strong>{deletingCat?.name}</strong> del catálogo? Los registros existentes no se verán afectados.</p>
      </Modal>

      {/* Delete vaccine record */}
      <Modal isOpen={!!deletingVacc} onClose={() => setDeletingVacc(null)} title="Eliminar registro de vacuna" size="sm"
        footer={<><button className="btn btn--ghost" onClick={() => setDeletingVacc(null)}>Cancelar</button><button className="btn btn--danger" onClick={() => { petVaccines.remove(deletingVacc.id); setDeletingVacc(null) }}>Eliminar</button></>}
      >
        <p>¿Eliminar el registro de <strong>{deletingVacc?.vaccineName}</strong>? Esta acción no se puede deshacer.</p>
      </Modal>
    </>
  )
}
