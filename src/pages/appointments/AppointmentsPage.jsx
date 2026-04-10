import { useState, useMemo } from 'react'
import { Search, Pencil, Trash2, CalendarDays, Check } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import Header from '../../components/layout/Header'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import SpeciesIcon from '../../components/ui/SpeciesIcon'
import AppointmentForm from './AppointmentForm'
import { formatDate, todayStr, appointmentStatusLabel, appointmentStatusColor } from '../../utils/helpers'

const STATUS_TABS = [
  { value: '',          label: 'Todos' },
  { value: 'pending',   label: 'Pendientes' },
  { value: 'confirmed', label: 'Confirmados' },
  { value: 'attended',  label: 'Atendidos' },
  { value: 'cancelled', label: 'Cancelados' },
]

export default function AppointmentsPage() {
  const { appointments, pets, owners } = useApp()
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter] = useState(todayStr())
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const filtered = useMemo(() =>
    appointments.items
      .filter(a => {
        const pet = pets.find(a.petId)
        const owner = owners.find(a.ownerId)
        const str = `${pet?.name || ''} ${owner?.name || ''} ${a.reason}`.toLowerCase()
        return (
          (!statusFilter || a.status === statusFilter) &&
          (!dateFilter   || a.date === dateFilter) &&
          (!search       || str.includes(search.toLowerCase()))
        )
      })
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)),
    [appointments.items, statusFilter, dateFilter, search, pets, owners]
  )

  const handleSave = (data) => {
    if (editing) appointments.update(editing.id, data)
    else appointments.add(data)
    setEditing(null)
  }

  const handleDelete = () => { appointments.remove(deleting.id); setDeleting(null) }

  const todayCount = appointments.items.filter(a => a.date === todayStr() && a.status !== 'cancelled').length

  return (
    <>
      <Header
        title="Turnos"
        subtitle={`${todayCount} para hoy`}
        actions={
          <button className="btn btn--primary" onClick={() => { setEditing(null); setFormOpen(true) }}>
            + Nuevo turno
          </button>
        }
      />
      <div className="page">
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-wrap" style={{ flex: 1, minWidth: 200, maxWidth: 300 }}>
            <span className="search-icon"><Search size={14} strokeWidth={2} /></span>
            <input className="form-input" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <input className="form-input" type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} style={{ width: 160 }} />
          {dateFilter && (
            <button className="btn btn--subtle btn--sm" onClick={() => setDateFilter('')}>Todas las fechas</button>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <div className="tabs" style={{ display: 'inline-flex', width: 'auto' }}>
            {STATUS_TABS.map(s => (
              <button key={s.value} className={`tab${statusFilter === s.value ? ' active' : ''}`} onClick={() => setStatusFilter(s.value)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<CalendarDays size={48} strokeWidth={1.25} />}
            title="Sin turnos"
            text="No hay turnos con los filtros seleccionados."
            action={<button className="btn btn--primary" onClick={() => setFormOpen(true)}>+ Nuevo turno</button>}
          />
        ) : (
          <div className="card card--no-hover">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Fecha / Hora</th>
                    <th>Mascota</th>
                    <th>Dueño</th>
                    <th>Motivo</th>
                    <th>Estado</th>
                    <th>Acción rápida</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(appt => {
                    const pet = pets.find(appt.petId)
                    const owner = owners.find(appt.ownerId)
                    return (
                      <tr key={appt.id}>
                        <td>
                          <div style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatDate(appt.date)}</div>
                          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{appt.time}</div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ color: 'var(--text-secondary)' }}><SpeciesIcon species={pet?.species} size={16} /></span>
                            <span style={{ fontWeight: 600 }}>{pet?.name || '—'}</span>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{owner?.name || '—'}</td>
                        <td style={{ maxWidth: 200 }} className="truncate">{appt.reason}</td>
                        <td>
                          <Badge color={appointmentStatusColor(appt.status)} dot>
                            {appointmentStatusLabel(appt.status)}
                          </Badge>
                        </td>
                        <td>
                          {appt.status === 'pending' && (
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button className="btn btn--success btn--sm" onClick={() => appointments.update(appt.id, { status: 'attended' })}>
                                <Check size={13} strokeWidth={2.5} /> Atendido
                              </button>
                              <button className="btn btn--subtle btn--sm" onClick={() => appointments.update(appt.id, { status: 'confirmed' })}>
                                Confirmar
                              </button>
                            </div>
                          )}
                          {appt.status === 'confirmed' && (
                            <button className="btn btn--success btn--sm" onClick={() => appointments.update(appt.id, { status: 'attended' })}>
                              <Check size={13} strokeWidth={2.5} /> Atendido
                            </button>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn--subtle btn--sm btn--icon" onClick={() => { setEditing(appt); setFormOpen(true) }}>
                              <Pencil size={14} strokeWidth={2} />
                            </button>
                            <button className="btn btn--subtle btn--sm btn--icon" onClick={() => setDeleting(appt)}>
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

      <AppointmentForm
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null) }}
        onSave={handleSave}
        initial={editing}
      />

      <Modal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title="Eliminar turno"
        size="sm"
        footer={
          <>
            <button className="btn btn--ghost" onClick={() => setDeleting(null)}>Cancelar</button>
            <button className="btn btn--danger" onClick={handleDelete}>Eliminar</button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)' }}>
          ¿Eliminar el turno del {formatDate(deleting?.date)} a las {deleting?.time}?
        </p>
      </Modal>
    </>
  )
}
