import { useState, useMemo } from 'react'
import { Search, Pencil, Trash2, Syringe, AlertTriangle } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import Header from '../../components/layout/Header'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import SpeciesIcon from '../../components/ui/SpeciesIcon'
import VaccineForm from './VaccineForm'
import { formatDate, daysUntil } from '../../utils/helpers'

export default function VaccinesPage() {
  const { vaccines, pets, owners } = useApp()
  const [search, setSearch] = useState('')
  const [view, setView] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const urgentCount = useMemo(() =>
    vaccines.items.filter(v => { const d = daysUntil(v.nextDose); return d !== null && d >= 0 && d <= 30 }).length,
    [vaccines.items]
  )

  const filtered = useMemo(() =>
    vaccines.items
      .filter(v => {
        const pet = pets.find(v.petId)
        const owner = owners.find(pet?.ownerId)
        const str = `${pet?.name || ''} ${owner?.name || ''} ${v.name}`.toLowerCase()
        const matchSearch = str.includes(search.toLowerCase())
        if (view === 'upcoming') {
          const d = daysUntil(v.nextDose)
          return matchSearch && d !== null && d >= 0 && d <= 30
        }
        return matchSearch
      })
      .sort((a, b) =>
        view === 'upcoming'
          ? (daysUntil(a.nextDose) || 9999) - (daysUntil(b.nextDose) || 9999)
          : new Date(b.appliedDate) - new Date(a.appliedDate)
      ),
    [vaccines.items, search, view, pets, owners]
  )

  const handleSave = (data) => {
    if (editing) vaccines.update(editing.id, data)
    else vaccines.add(data)
    setEditing(null)
  }

  const handleDelete = () => { vaccines.remove(deleting.id); setDeleting(null) }

  const getDaysColor = (days) => days <= 7 ? 'red' : days <= 14 ? 'orange' : 'blue'

  return (
    <>
      <Header
        title="Vacunas"
        subtitle={urgentCount > 0 ? `${urgentCount} próximas en 30 días` : 'Todo al día'}
        actions={
          <button className="btn btn--primary" onClick={() => { setEditing(null); setFormOpen(true) }}>
            + Registrar vacuna
          </button>
        }
      />
      <div className="page">

        {urgentCount > 0 && (
          <div className="alert alert--warning" style={{ marginBottom: 16 }}>
            <AlertTriangle size={16} strokeWidth={2} style={{ flexShrink: 0 }} />
            <span>
              Hay <strong>{urgentCount}</strong> vacunas que vencen en los próximos 30 días.
            </span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-wrap" style={{ flex: 1, minWidth: 200, maxWidth: 360 }}>
            <span className="search-icon"><Search size={14} strokeWidth={2} /></span>
            <input className="form-input" placeholder="Buscar mascota o vacuna..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="tabs" style={{ flexShrink: 0 }}>
            <button className={`tab${view === 'all' ? ' active' : ''}`} onClick={() => setView('all')}>Todas</button>
            <button className={`tab${view === 'upcoming' ? ' active' : ''}`} onClick={() => setView('upcoming')}>
              Próximas
              {urgentCount > 0 && (
                <span style={{ background: 'var(--red)', color: 'white', borderRadius: 'var(--r-full)', padding: '0px 5px', fontSize: 11, marginLeft: 4 }}>
                  {urgentCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Syringe size={48} strokeWidth={1.25} />}
            title={view === 'upcoming' ? 'Sin vacunas próximas' : 'Sin vacunas registradas'}
            text={view === 'upcoming' ? 'No hay vacunas venciendo en los próximos 30 días.' : ''}
            action={view === 'all' && <button className="btn btn--primary" onClick={() => setFormOpen(true)}>+ Registrar vacuna</button>}
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
                    <th>Próxima dosis</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(vac => {
                    const pet = pets.find(vac.petId)
                    const owner = owners.find(pet?.ownerId)
                    const days = daysUntil(vac.nextDose)
                    return (
                      <tr key={vac.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ color: 'var(--text-secondary)' }}><SpeciesIcon species={pet?.species} size={16} /></span>
                            <span style={{ fontWeight: 600 }}>{pet?.name || '—'}</span>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{owner?.name || '—'}</td>
                        <td style={{ maxWidth: 240 }} className="truncate">{vac.name}</td>
                        <td>{formatDate(vac.appliedDate)}</td>
                        <td>{vac.nextDose ? formatDate(vac.nextDose) : '—'}</td>
                        <td>
                          {days === null
                            ? <Badge color="gray">Sin fecha</Badge>
                            : days < 0  ? <Badge color="red"    dot>Vencida</Badge>
                            : days === 0 ? <Badge color="red"   dot>Hoy</Badge>
                            : <Badge color={getDaysColor(days)} dot>
                                {days <= 30 ? `En ${days} día${days !== 1 ? 's' : ''}` : 'Al día'}
                              </Badge>
                          }
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn--subtle btn--sm btn--icon" onClick={() => { setEditing(vac); setFormOpen(true) }}>
                              <Pencil size={14} strokeWidth={2} />
                            </button>
                            <button className="btn btn--subtle btn--sm btn--icon" onClick={() => setDeleting(vac)}>
                              <Trash2 size={14} strokeWidth={2} />
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
      </div>

      <VaccineForm
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null) }}
        onSave={handleSave}
        initial={editing}
      />

      <Modal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title="Eliminar vacuna"
        size="sm"
        footer={
          <>
            <button className="btn btn--ghost" onClick={() => setDeleting(null)}>Cancelar</button>
            <button className="btn btn--danger" onClick={handleDelete}>Eliminar</button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)' }}>¿Eliminar el registro de <strong>{deleting?.name}</strong>?</p>
      </Modal>
    </>
  )
}
