import { useState, useMemo } from 'react'
import {
  Syringe, Dog, Cat, ShieldCheck, RotateCw, AlertTriangle,
  Pencil, Trash2, Plus, Search, CalendarCheck, BookOpen,
} from 'lucide-react'
import Header from '../../components/layout/Header'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import VaccineCatalogForm from './VaccineCatalogForm'
import VaccineForm from './VaccineForm'
import { useApp } from '../../context/AppContext'
import { formatDate } from '../../utils/helpers'

const TONE_CFG = {
  first:    { color: 'var(--accent)',       bg: 'var(--accent-3)',  Icon: ShieldCheck,   label: 'Inicial'  },
  annual:   { color: 'var(--vet-emerald)',  bg: 'var(--ok-3)',      Icon: RotateCw,      label: 'Anual'    },
  optional: { color: 'var(--warn)',         bg: 'var(--warn-3)',    Icon: AlertTriangle, label: 'Opcional' },
}

export default function VaccinesPage() {
  const { vaccineCatalog, petVaccines, pets, owners } = useApp()

  const [tab, setTab]       = useState('catalog')
  const [species, setSpecies] = useState('dog')
  const [search, setSearch]  = useState('')

  const [catalogForm, setCatalogForm]   = useState({ open: false, editing: null })
  const [vaccineForm, setVaccineForm]   = useState({ open: false, editing: null, prefill: null })
  const [deletingCat, setDeletingCat]   = useState(null)
  const [deletingVacc, setDeletingVacc] = useState(null)

  const filteredCatalog = useMemo(() =>
    vaccineCatalog.items.filter(v => v.species === species || v.species === 'both'),
    [vaccineCatalog.items, species]
  )

  const filteredRecords = useMemo(() => {
    const q = search.toLowerCase()
    return petVaccines.items.filter(v => {
      if (!q) return true
      const pet = pets.find(v.petId)
      return (
        v.vaccineName?.toLowerCase().includes(q) ||
        pet?.name?.toLowerCase().includes(q)
      )
    })
  }, [petVaccines.items, pets, search])

  const openRegisterFromCard = (catalogItem) => {
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

  return (
    <>
      <Header
        title="Vacunas"
        subtitle={tab === 'catalog'
          ? `${vaccineCatalog.items.filter(v => v.species === species || v.species === 'both').length} vacunas en catálogo`
          : `${petVaccines.items.length} registros`
        }
      />

      <div className="page">
        {/* ── Main tabs + action button ── */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="tabs">
            <button className={`tab${tab === 'catalog' ? ' active' : ''}`} onClick={() => setTab('catalog')}>
              <BookOpen size={16} strokeWidth={2} style={{ marginRight: 6 }} />
              Catálogo
            </button>
            <button className={`tab${tab === 'records' ? ' active' : ''}`} onClick={() => setTab('records')}>
              <CalendarCheck size={16} strokeWidth={2} style={{ marginRight: 6 }} />
              Registros
              {petVaccines.items.length > 0 && (
                <span style={{
                  background: 'var(--accent)', color: 'white',
                  borderRadius: 'var(--r-full)', padding: '0 6px',
                  fontSize: 11, marginLeft: 6,
                }}>
                  {petVaccines.items.length}
                </span>
              )}
            </button>
          </div>

          {tab === 'catalog' ? (
            <button
              className="btn btn--primary"
              style={{ marginLeft: 'auto' }}
              onClick={() => setCatalogForm({ open: true, editing: null })}
            >
              <Plus size={18} /> Nueva vacuna
            </button>
          ) : (
            <button
              className="btn btn--primary"
              style={{ marginLeft: 'auto' }}
              onClick={() => setVaccineForm({ open: true, editing: null, prefill: null })}
            >
              <Syringe size={18} /> Registrar vacuna
            </button>
          )}
        </div>

        {/* ── CATÁLOGO TAB ── */}
        {tab === 'catalog' && (
          <>
            <div className="tabs" style={{ marginBottom: 20, width: 'fit-content' }}>
              <button className={`tab${species === 'dog' ? ' active' : ''}`} onClick={() => setSpecies('dog')}>
                <Dog size={17} strokeWidth={2} style={{ marginRight: 6 }} />
                Perros
              </button>
              <button className={`tab${species === 'cat' ? ' active' : ''}`} onClick={() => setSpecies('cat')}>
                <Cat size={17} strokeWidth={2} style={{ marginRight: 6 }} />
                Gatos
              </button>
            </div>

            {filteredCatalog.length === 0 ? (
              <EmptyState
                icon={<Syringe size={48} strokeWidth={1.25} />}
                title="Sin vacunas en el catálogo"
                text="Agregá la primera vacuna para esta especie."
                action={<button className="btn btn--primary" onClick={() => setCatalogForm({ open: true, editing: null })}>+ Nueva vacuna</button>}
              />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
                {filteredCatalog.map(v => {
                  const cfg = TONE_CFG[v.tone] || TONE_CFG.first
                  return (
                    <div key={v.id} className="card card--no-hover" style={{ padding: 18 }}>
                      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                        <div style={{
                          width: 50, height: 50, borderRadius: 12, flexShrink: 0,
                          background: cfg.bg, color: cfg.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <cfg.Icon size={24} strokeWidth={1.85} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                            <span style={{
                              fontSize: 11.5, fontWeight: 700, color: cfg.color,
                              background: cfg.bg, padding: '2px 9px', borderRadius: 999,
                              textTransform: 'uppercase', letterSpacing: 0.04,
                            }}>
                              {v.ageLabel}
                            </span>
                          </div>
                          <div style={{ fontSize: 15.5, fontWeight: 700, marginBottom: 3 }}>{v.name}</div>
                          {v.description && (
                            <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                              {v.description}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 6, marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border-2)', justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn--primary btn--sm"
                          onClick={() => openRegisterFromCard(v)}
                        >
                          <Syringe size={13} /> Registrar
                        </button>
                        <button
                          className="btn btn--ghost btn--sm"
                          onClick={() => setCatalogForm({ open: true, editing: v })}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          className="btn btn--ghost btn--sm"
                          style={{ color: 'var(--danger)' }}
                          onClick={() => setDeletingCat(v)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ── REGISTROS TAB ── */}
        {tab === 'records' && (
          <>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
              <div className="search-wrap" style={{ flex: 1, maxWidth: 400 }}>
                <span className="search-icon"><Search size={18} strokeWidth={2} /></span>
                <input
                  className="form-input"
                  placeholder="Buscar por mascota o vacuna..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            {filteredRecords.length === 0 ? (
              <EmptyState
                icon={<CalendarCheck size={48} strokeWidth={1.25} />}
                title="Sin registros"
                text={search ? 'No hay resultados para la búsqueda.' : 'Registrá la primera vacuna aplicada a una mascota.'}
                action={!search && (
                  <button className="btn btn--primary" onClick={() => setVaccineForm({ open: true, editing: null, prefill: null })}>
                    <Syringe size={16} /> Registrar vacuna
                  </button>
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
                        <th>Vacuna</th>
                        <th>Fecha aplicada</th>
                        <th>Próximo venc.</th>
                        <th>Notas</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map(r => {
                        const pet   = pets.find(r.petId)
                        const owner = pet?.ownerId ? owners.find(pet.ownerId) : null
                        const isOverdue = r.nextDue && new Date(r.nextDue) < new Date()
                        return (
                          <tr key={r.id}>
                            <td style={{ fontWeight: 600 }}>{pet?.name || '—'}</td>
                            <td style={{ color: 'var(--text-secondary)' }}>
                              {owner ? `${owner.name}${owner.apellido ? ` ${owner.apellido}` : ''}` : '—'}
                            </td>
                            <td>{r.vaccineName}</td>
                            <td>{r.date ? formatDate(r.date) : '—'}</td>
                            <td>
                              {r.nextDue ? (
                                <span style={{ color: isOverdue ? 'var(--danger)' : 'inherit', fontWeight: isOverdue ? 600 : 400 }}>
                                  {isOverdue && '⚠ '}{formatDate(r.nextDue)}
                                </span>
                              ) : '—'}
                            </td>
                            <td style={{ color: 'var(--text-secondary)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {r.notes || '—'}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: 4 }}>
                                <button
                                  className="btn btn--ghost btn--sm"
                                  onClick={() => setVaccineForm({ open: true, editing: r, prefill: null })}
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  className="btn btn--ghost btn--sm"
                                  style={{ color: 'var(--danger)' }}
                                  onClick={() => setDeletingVacc(r)}
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
          </>
        )}
      </div>

      {/* ── Catalog form modal ── */}
      <VaccineCatalogForm
        isOpen={catalogForm.open}
        onClose={() => setCatalogForm({ open: false, editing: null })}
        initial={catalogForm.editing}
        onSave={handleSaveCatalog}
      />

      {/* ── Pet vaccine registration modal ── */}
      <VaccineForm
        isOpen={vaccineForm.open}
        onClose={() => setVaccineForm({ open: false, editing: null, prefill: null })}
        initial={vaccineForm.editing ?? (vaccineForm.prefill ? vaccineForm.prefill : null)}
        onSave={handleSaveVaccine}
      />

      {/* ── Delete catalog entry ── */}
      <Modal
        isOpen={!!deletingCat}
        onClose={() => setDeletingCat(null)}
        title="Eliminar vacuna del catálogo"
        footer={
          <>
            <button className="btn btn--ghost" onClick={() => setDeletingCat(null)}>Cancelar</button>
            <button className="btn btn--danger" onClick={() => { vaccineCatalog.remove(deletingCat.id); setDeletingCat(null) }}>
              Eliminar
            </button>
          </>
        }
      >
        <p>¿Eliminar <strong>{deletingCat?.name}</strong> del catálogo? Los registros existentes no se verán afectados.</p>
      </Modal>

      {/* ── Delete vaccine record ── */}
      <Modal
        isOpen={!!deletingVacc}
        onClose={() => setDeletingVacc(null)}
        title="Eliminar registro de vacuna"
        footer={
          <>
            <button className="btn btn--ghost" onClick={() => setDeletingVacc(null)}>Cancelar</button>
            <button className="btn btn--danger" onClick={() => { petVaccines.remove(deletingVacc.id); setDeletingVacc(null) }}>
              Eliminar
            </button>
          </>
        }
      >
        <p>¿Eliminar el registro de <strong>{deletingVacc?.vaccineName}</strong>? Esta acción no se puede deshacer.</p>
      </Modal>
    </>
  )
}
