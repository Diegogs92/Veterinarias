import { useState, useMemo } from 'react'
import { Search, Plus, Pencil, Trash2, Hospital, AlertCircle, ClipboardList, Check, X } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import Header from '../../components/layout/Header'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import InlinePanel from '../../components/ui/InlinePanel'
import InternmentForm from './InternmentForm'
import { formatDate, formatDateTime, todayStr } from '../../utils/helpers'

const STATUS = {
  active:     { label: 'Internado',  color: 'var(--warn)'   },
  critical:   { label: 'Crítico',    color: 'var(--danger)' },
  improving:  { label: 'Mejorando',  color: 'var(--blue)'   },
  discharged: { label: 'Alta',       color: 'var(--ok)'     },
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

function daysInterned(admissionDate, dischargeDate) {
  const start = new Date(admissionDate)
  const end = dischargeDate ? new Date(dischargeDate) : new Date()
  start.setHours(0,0,0,0); end.setHours(0,0,0,0)
  const days = Math.round((end - start) / 86400000)
  return days === 0 ? 'Hoy' : `${days} día${days !== 1 ? 's' : ''}`
}

export default function InternmentsPage() {
  const { internments, pets, owners, addDailyNote, removeDailyNote } = useApp()
  const [statusFilter, setStatusFilter] = useState('active')
  const [search, setSearch]             = useState('')
  const [formOpen, setFormOpen]         = useState(false)
  const [editing, setEditing]           = useState(null)
  const [deleting, setDeleting]         = useState(null)
  const [dischargeTarget, setDischargeTarget] = useState(null)
  const [notesTarget, setNotesTarget]   = useState(null)
  const [newNote, setNewNote]           = useState('')
  const [selected, setSelected]         = useState(null)

  const activeCount = useMemo(() =>
    internments.items.filter(i => i.status !== 'discharged').length,
    [internments.items]
  )

  const filtered = useMemo(() =>
    internments.items
      .filter(i => {
        const pet   = pets.find(i.petId)
        const owner = owners.find(i.ownerId)
        const str   = `${pet?.name || ''} ${owner?.name || ''} ${i.reason} ${i.diagnosis || ''}`.toLowerCase()
        return (
          str.includes(search.toLowerCase()) &&
          (statusFilter === 'all' || (statusFilter === 'active' ? i.status !== 'discharged' : i.status === statusFilter))
        )
      })
      .sort((a, b) => {
        const order = { critical: 0, active: 1, improving: 2, discharged: 3 }
        const diff = (order[a.status] ?? 9) - (order[b.status] ?? 9)
        return diff !== 0 ? diff : new Date(b.admissionDate) - new Date(a.admissionDate)
      }),
    [internments.items, statusFilter, search, pets, owners]
  )

  const handleSave      = (data) => { if (editing) internments.update(editing.id, data); else internments.add(data); setEditing(null) }
  const handleDischarge = () => { internments.update(dischargeTarget.id, { status: 'discharged', dischargeDate: todayStr() }); setDischargeTarget(null) }
  const handleDelete    = () => { if (deleting?.id === selected?.id) setSelected(null); internments.remove(deleting.id); setDeleting(null) }
  const handleAddNote   = (id) => {
    if (!newNote.trim()) return
    addDailyNote(id, newNote.trim())
    setNewNote('')
  }

  const notesIntern = notesTarget ? internments.items.find(i => i.id === notesTarget.id) : null
  const notes = (notesIntern?.dailyNotes || []).slice().sort((a, b) => new Date(b.date) - new Date(a.date))

  const selectedLive  = selected ? internments.items.find(i => i.id === selected.id) : null
  const selectedPet   = selectedLive ? pets.find(selectedLive.petId) : null
  const selectedOwner = selectedLive ? owners.find(selectedLive.ownerId) : null

  return (
    <>
      <Header
        title="Internación"
        subtitle={activeCount > 0 ? `${activeCount} paciente${activeCount !== 1 ? 's' : ''} internado${activeCount !== 1 ? 's' : ''}` : 'Sin pacientes activos'}
      />
      <div className="page">
        {internments.items.some(i => i.status === 'critical') && (
          <div className="alert alert--danger" style={{ marginBottom: 16 }}>
            <AlertCircle size={16} strokeWidth={2} style={{ flexShrink: 0 }} />
            <span>
              Hay <strong>{internments.items.filter(i => i.status === 'critical').length}</strong> paciente(s) en estado crítico.
            </span>
          </div>
        )}

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
            <Plus size={18} /> Nueva internación
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <div className="tabs">
            {[
              { value: 'active',     label: 'Activos' },
              { value: 'discharged', label: 'Con alta' },
              { value: 'all',        label: 'Todos' },
            ].map(t => (
              <button key={t.value} className={`tab${statusFilter === t.value ? ' active' : ''}`} onClick={() => setStatusFilter(t.value)}>
                {t.label}
                {t.value === 'active' && activeCount > 0 && (
                  <span style={{ background: 'var(--orange)', color: 'white', borderRadius: 'var(--r-full)', padding: '0 5px', fontSize: 11, marginLeft: 4 }}>
                    {activeCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Hospital size={40} strokeWidth={1.5} />}
            title="Sin internaciones"
            text={statusFilter === 'active' ? 'No hay pacientes internados actualmente.' : 'No hay registros con estos filtros.'}
            action={statusFilter === 'active' && (
              <button className="btn btn--primary" onClick={() => setFormOpen(true)}><Plus size={18} /> Nueva internación</button>
            )}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: selectedLive ? '1.5fr 1fr' : '1fr', gap: 16 }}>
            <div className="card card--no-hover card--table">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Mascota</th>
                      <th>Motivo</th>
                      <th>Ingreso</th>
                      <th>Tiempo</th>
                      <th>Estado</th>
                      <th style={{ width: 140 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(intern => {
                      const pet   = pets.find(intern.petId)
                      const st    = STATUS[intern.status] || STATUS.active
                      const noteCount = (intern.dailyNotes || []).length
                      return (
                        <tr
                          key={intern.id}
                          onClick={() => setSelected(intern)}
                          style={{ cursor: 'pointer', background: selected?.id === intern.id ? 'color-mix(in srgb, var(--accent) 6%, transparent)' : undefined }}
                        >
                          <td>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{pet?.name || '—'}</div>
                          </td>
                          <td style={{ maxWidth: 200 }}>
                            <div style={{ fontSize: 14 }} className="truncate">{intern.reason || '—'}</div>
                          </td>
                          <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                            {formatDate(intern.admissionDate)}
                          </td>
                          <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                            {daysInterned(intern.admissionDate, intern.dischargeDate)}
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: st.color }}>{st.label}</span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                              <button
                                className="btn btn--subtle btn--icon"
                                onClick={(e) => { e.stopPropagation(); setNotesTarget(intern); setNewNote('') }}
                                title="Notas de evolución"
                                style={{ position: 'relative' }}
                              >
                                <ClipboardList size={18} />
                                {noteCount > 0 && (
                                  <span style={{ position: 'absolute', top: 2, right: 2, background: 'var(--blue)', color: 'white', borderRadius: '50%', width: 14, height: 14, fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                                    {noteCount}
                                  </span>
                                )}
                              </button>
                              {intern.status !== 'discharged' && (
                                <button className="btn btn--subtle btn--sm" onClick={(e) => { e.stopPropagation(); setDischargeTarget(intern) }} title="Dar de alta">
                                  <Check size={14} strokeWidth={2.5} /> Alta
                                </button>
                              )}
                              <button className="btn btn--subtle btn--icon" onClick={(e) => { e.stopPropagation(); setEditing(intern); setFormOpen(true) }} title="Editar">
                                <Pencil size={18} />
                              </button>
                              <button className="btn btn--subtle btn--icon" onClick={(e) => { e.stopPropagation(); setDeleting(intern) }} title="Eliminar" style={{ color: 'var(--vet-rose)' }}>
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
                  <Field label="Motivo">{selectedLive.reason || null}</Field>
                  <Field label="Diagnóstico">{selectedLive.diagnosis || null}</Field>
                  <Field label="Ingreso">{selectedLive.admissionDate ? formatDate(selectedLive.admissionDate) : null}</Field>
                  <Field label="Egreso">{selectedLive.dischargeDate ? formatDate(selectedLive.dischargeDate) : <span style={{ color: 'var(--text-tertiary)' }}>En curso</span>}</Field>
                  <Field label="Tiempo internado">{daysInterned(selectedLive.admissionDate, selectedLive.dischargeDate)}</Field>
                  <Field label="Estado">
                    {(() => {
                      const st = STATUS[selectedLive.status] || STATUS.active
                      return <span style={{ fontWeight: 600, color: st.color }}>{st.label}</span>
                    })()}
                  </Field>
                  {selectedLive.observations && <Field label="Observaciones">{selectedLive.observations}</Field>}
                  <Divider />
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="btn btn--ghost btn--sm" onClick={() => { setNotesTarget(selectedLive); setNewNote('') }}>
                      <ClipboardList size={14} /> Notas
                    </button>
                    {selectedLive.status !== 'discharged' && (
                      <button className="btn btn--ghost btn--sm" onClick={() => setDischargeTarget(selectedLive)}>
                        <Check size={14} strokeWidth={2.5} /> Dar de alta
                      </button>
                    )}
                    <button className="btn btn--ghost btn--sm" onClick={() => { setEditing(selectedLive); setFormOpen(true) }}>
                      <Pencil size={14} /> Editar
                    </button>
                    <button className="btn btn--ghost btn--sm" style={{ color: 'var(--danger)' }} onClick={() => setDeleting(selectedLive)}>
                      <Trash2 size={14} /> Eliminar
                    </button>
                  </div>
                </>
              )}
            </InlinePanel>
          </div>
        )}
      </div>

      <InternmentForm
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null) }}
        onSave={handleSave}
        initial={editing}
      />

      {/* Notas de evolución */}
      <Modal
        isOpen={!!notesTarget}
        onClose={() => setNotesTarget(null)}
        title={`Evolución — ${pets.find(notesTarget?.petId)?.name || ''}`}
      >
        {notesTarget?.status !== 'discharged' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input
              className="form-input"
              style={{ flex: 1 }}
              placeholder="Agregar nota de evolución..."
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddNote(notesTarget.id) }}
            />
            <button className="btn btn--primary btn--sm" onClick={() => handleAddNote(notesTarget.id)} disabled={!newNote.trim()}>
              Agregar
            </button>
          </div>
        )}
        {notes.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: '12px 0' }}>
            Sin notas de evolución todavía.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {notes.map(note => (
              <div key={note.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 14px', background: 'var(--bg-input)', borderRadius: 'var(--r-sm)', borderLeft: '3px solid var(--blue)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>{formatDateTime(note.date)}</div>
                  <div style={{ fontSize: 14 }}>{note.note}</div>
                </div>
                {notesTarget?.status !== 'discharged' && (
                  <button className="btn btn--subtle btn--icon" style={{ flexShrink: 0 }} onClick={() => removeDailyNote(notesTarget.id, note.id)}>
                    <X size={13} strokeWidth={2} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!dischargeTarget}
        onClose={() => setDischargeTarget(null)}
        title="Dar de alta"
        size="sm"
        footer={
          <>
            <button className="btn btn--ghost" onClick={() => setDischargeTarget(null)}>Cancelar</button>
            <button className="btn btn--success" onClick={handleDischarge}>
              <Check size={14} strokeWidth={2.5} /> Confirmar alta
            </button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)' }}>
          ¿Confirmás el alta de <strong>{pets.find(dischargeTarget?.petId)?.name}</strong> con fecha de hoy?
        </p>
      </Modal>

      <Modal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title="Eliminar internación"
        size="sm"
        footer={
          <>
            <button className="btn btn--ghost" onClick={() => setDeleting(null)}>Cancelar</button>
            <button className="btn btn--danger" onClick={handleDelete}>Eliminar</button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)' }}>
          ¿Eliminar el registro de internación de <strong>{pets.find(deleting?.petId)?.name}</strong>? Esto incluye todas las notas de evolución.
        </p>
      </Modal>
    </>
  )
}
