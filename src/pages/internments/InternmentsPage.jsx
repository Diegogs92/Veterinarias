import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Pencil, Trash2, Hospital, AlertCircle, ClipboardList, Check, X } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import Header from '../../components/layout/Header'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import SpeciesIcon from '../../components/ui/SpeciesIcon'
import InternmentForm from './InternmentForm'
import { formatDate, formatDateTime, todayStr } from '../../utils/helpers'

const STATUS = {
  active:     { label: 'Internado',  color: 'orange' },
  critical:   { label: 'Crítico',    color: 'red' },
  improving:  { label: 'Mejorando',  color: 'blue' },
  discharged: { label: 'Alta',       color: 'green' },
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
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('active')
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [newNote, setNewNote] = useState('')
  const [dischargeTarget, setDischargeTarget] = useState(null)

  const activeCount = useMemo(() =>
    internments.items.filter(i => i.status !== 'discharged').length,
    [internments.items]
  )

  const filtered = useMemo(() =>
    internments.items
      .filter(i => {
        const pet = pets.find(i.petId)
        const owner = owners.find(i.ownerId)
        const str = `${pet?.name || ''} ${owner?.name || ''} ${i.reason} ${i.diagnosis || ''}`.toLowerCase()
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

  const handleSave = (data) => {
    if (editing) internments.update(editing.id, data)
    else internments.add(data)
    setEditing(null)
  }

  const handleDischarge = () => {
    internments.update(dischargeTarget.id, { status: 'discharged', dischargeDate: todayStr() })
    setDischargeTarget(null)
    if (expanded === dischargeTarget.id) setExpanded(null)
  }

  const handleAddNote = (internmentId) => {
    if (!newNote.trim()) return
    addDailyNote(internmentId, newNote.trim())
    setNewNote('')
  }

  const handleDelete = () => {
    internments.remove(deleting.id)
    setDeleting(null)
    if (expanded === deleting.id) setExpanded(null)
  }

  return (
    <>
      <Header
        title="Internación"
        subtitle={activeCount > 0 ? `${activeCount} paciente${activeCount !== 1 ? 's' : ''} internado${activeCount !== 1 ? 's' : ''}` : 'Sin pacientes activos'}
        actions={
          <button className="btn btn--primary" onClick={() => { setEditing(null); setFormOpen(true) }}>
            + Nueva internación
          </button>
        }
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

        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-wrap" style={{ flex: 1, minWidth: 200, maxWidth: 360 }}>
            <span className="search-icon"><Search size={14} strokeWidth={2} /></span>
            <input className="form-input" placeholder="Buscar mascota, dueño, motivo..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="tabs" style={{ flexShrink: 0 }}>
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
            icon={<Hospital size={48} strokeWidth={1.25} />}
            title="Sin internaciones"
            text={statusFilter === 'active' ? 'No hay pacientes internados actualmente.' : 'No hay registros con estos filtros.'}
            action={statusFilter === 'active' && (
              <button className="btn btn--primary" onClick={() => setFormOpen(true)}>+ Nueva internación</button>
            )}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(intern => {
              const pet = pets.find(intern.petId)
              const owner = owners.find(intern.ownerId)
              const st = STATUS[intern.status] || STATUS.active
              const isCritical = intern.status === 'critical'
              const isExpanded = expanded === intern.id
              const notes = (intern.dailyNotes || []).slice().sort((a, b) => new Date(b.date) - new Date(a.date))

              return (
                <div key={intern.id} className="card card--no-hover">
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', cursor: 'pointer',
                      borderLeft: `3px solid ${isCritical ? 'var(--red)' : intern.status === 'discharged' ? 'var(--green)' : 'var(--orange)'}`,
                    }}
                    onClick={() => setExpanded(isExpanded ? null : intern.id)}
                  >
                    <div style={{
                      width: 48, height: 48, borderRadius: 'var(--r-md)', flexShrink: 0,
                      background: isCritical ? 'rgba(255,59,48,0.12)' : intern.status === 'discharged' ? 'rgba(52,199,89,0.12)' : 'rgba(255,159,10,0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isCritical ? 'var(--red)' : intern.status === 'discharged' ? 'var(--green)' : 'var(--orange)',
                    }}>
                      <SpeciesIcon species={pet?.species} size={24} strokeWidth={1.5} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>{pet?.name || '—'}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>·</span>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{owner?.name || '—'}</span>
                        {intern.cage && (
                          <>
                            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>·</span>
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{intern.cage}</span>
                          </>
                        )}
                      </div>
                      <div style={{ fontSize: 14, marginTop: 3 }} className="truncate">{intern.reason}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                        Ingreso: {formatDate(intern.admissionDate)} {intern.admissionTime && `· ${intern.admissionTime}`}
                        {' · '}{daysInterned(intern.admissionDate, intern.dischargeDate)}
                        {intern.dischargeDate && ` · Alta: ${formatDate(intern.dischargeDate)}`}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                      <Badge color={st.color} dot>{st.label}</Badge>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <ClipboardList size={12} strokeWidth={2} /> {notes.length} nota{notes.length !== 1 ? 's' : ''}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                      {intern.status !== 'discharged' && (
                        <button className="btn btn--success btn--sm" onClick={() => setDischargeTarget(intern)}>
                          <Check size={13} strokeWidth={2.5} /> Alta
                        </button>
                      )}
                      <button className="btn btn--subtle btn--sm btn--icon" onClick={() => { setEditing(intern); setFormOpen(true) }}>
                        <Pencil size={14} strokeWidth={2} />
                      </button>
                      <button className="btn btn--subtle btn--sm btn--icon" onClick={() => setDeleting(intern)}>
                        <Trash2 size={14} strokeWidth={2} />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px' }}>
                      <div className="detail-grid" style={{ marginBottom: 20 }}>
                        {intern.diagnosis  && <div className="detail-item"><div className="detail-item__label">Diagnóstico</div><div className="detail-item__value" style={{ fontSize: 14 }}>{intern.diagnosis}</div></div>}
                        {intern.treatment  && <div className="detail-item"><div className="detail-item__label">Tratamiento</div><div className="detail-item__value" style={{ fontSize: 14 }}>{intern.treatment}</div></div>}
                        {intern.medication && <div className="detail-item" style={{ gridColumn: '1/-1' }}><div className="detail-item__label">Medicación</div><div className="detail-item__value" style={{ fontSize: 14 }}>{intern.medication}</div></div>}
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <ClipboardList size={15} strokeWidth={2} style={{ color: 'var(--blue)' }} />
                            Evolución diaria
                          </div>
                          <button className="btn btn--subtle btn--sm" onClick={() => navigate(`/pets/${intern.petId}`)}>
                            Ver ficha de {pet?.name}
                          </button>
                        </div>

                        {intern.status !== 'discharged' && (
                          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                            <input
                              className="form-input"
                              style={{ flex: 1 }}
                              placeholder="Agregar nota de evolución..."
                              value={newNote}
                              onChange={e => setNewNote(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') handleAddNote(intern.id) }}
                            />
                            <button className="btn btn--primary btn--sm" onClick={() => handleAddNote(intern.id)} disabled={!newNote.trim()}>
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
                              <div
                                key={note.id}
                                style={{
                                  display: 'flex', gap: 12, alignItems: 'flex-start',
                                  padding: '10px 14px',
                                  background: 'var(--bg-input)',
                                  borderRadius: 'var(--r-sm)',
                                  borderLeft: '3px solid var(--blue)',
                                }}
                              >
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>
                                    {formatDateTime(note.date)}
                                  </div>
                                  <div style={{ fontSize: 14 }}>{note.note}</div>
                                </div>
                                {intern.status !== 'discharged' && (
                                  <button
                                    className="btn btn--subtle btn--sm btn--icon"
                                    style={{ flexShrink: 0 }}
                                    onClick={() => removeDailyNote(intern.id, note.id)}
                                  >
                                    <X size={13} strokeWidth={2} />
                                  </button>
                                )}
                              </div>
                            ))}
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

      <InternmentForm
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null) }}
        onSave={handleSave}
        initial={editing}
      />

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
