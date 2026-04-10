import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays, PawPrint, Syringe, Hospital, Banknote,
  Clock, Stethoscope, CheckCircle,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import Header from '../components/layout/Header'
import Badge from '../components/ui/Badge'
import SpeciesIcon from '../components/ui/SpeciesIcon'
import {
  formatDate, formatCurrency, todayStr, daysUntil,
  appointmentStatusLabel, appointmentStatusColor,
} from '../utils/helpers'

export default function Dashboard() {
  const { appointments, pets, owners, consultations, vaccines, sales, internments } = useApp()
  const { currentUser, isVet } = useAuth()
  const navigate = useNavigate()
  const today = todayStr()

  const todayAppointments = useMemo(() =>
    appointments.items
      .filter(a => a.date === today && a.status !== 'cancelled')
      .sort((a, b) => a.time.localeCompare(b.time)),
    [appointments.items, today]
  )

  const upcomingVaccines = useMemo(() =>
    vaccines.items
      .filter(v => { const d = daysUntil(v.nextDose); return d !== null && d >= 0 && d <= 30 })
      .sort((a, b) => new Date(a.nextDose) - new Date(b.nextDose))
      .slice(0, 5),
    [vaccines.items]
  )

  const totalIncome = useMemo(() =>
    sales.items.reduce((s, i) => s + (i.price || 0), 0),
    [sales.items]
  )

  const activeInternments = useMemo(() =>
    internments.items
      .filter(i => i.status !== 'discharged')
      .sort((a, b) => {
        const order = { critical: 0, active: 1, improving: 2 }
        return (order[a.status] ?? 9) - (order[b.status] ?? 9)
      }),
    [internments.items]
  )

  const attendedToday = appointments.items.filter(a => a.date === today && a.status === 'attended').length

  const recentActivity = useMemo(() =>
    [
      ...consultations.items.map(c => ({ ...c, _type: 'consultation', _date: new Date(c.date) })),
      ...appointments.items.filter(a => a.status === 'attended').map(a => ({ ...a, _type: 'appointment', _date: new Date(a.date) })),
    ]
    .sort((a, b) => b._date - a._date)
    .slice(0, 6),
    [consultations.items, appointments.items]
  )

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Buenos días'
    if (h < 19) return 'Buenas tardes'
    return 'Buenas noches'
  }

  return (
    <>
      <Header title="Dashboard" subtitle={`${greeting()}, ${currentUser?.name?.split(' ')[0]}`} />
      <div className="page">

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/appointments')}>
            <div className="stat-card__icon" style={{ background: 'rgba(0,122,255,0.12)', color: 'var(--blue)' }}>
              <CalendarDays size={22} strokeWidth={1.75} />
            </div>
            <div className="stat-card__label">Turnos hoy</div>
            <div className="stat-card__value" style={{ color: 'var(--blue)' }}>{todayAppointments.length}</div>
            <div className="stat-card__sub">{attendedToday} atendidos</div>
          </div>

          <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/pets')}>
            <div className="stat-card__icon" style={{ background: 'rgba(52,199,89,0.12)', color: 'var(--green)' }}>
              <PawPrint size={22} strokeWidth={1.75} />
            </div>
            <div className="stat-card__label">Mascotas registradas</div>
            <div className="stat-card__value" style={{ color: 'var(--green)' }}>{pets.items.length}</div>
            <div className="stat-card__sub">{owners.items.length} dueños</div>
          </div>

          <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/vaccines')}>
            <div className="stat-card__icon" style={{ background: 'rgba(255,159,10,0.12)', color: 'var(--orange)' }}>
              <Syringe size={22} strokeWidth={1.75} />
            </div>
            <div className="stat-card__label">Vacunas próximas</div>
            <div className="stat-card__value" style={{ color: 'var(--orange)' }}>{upcomingVaccines.length}</div>
            <div className="stat-card__sub">en los próximos 30 días</div>
          </div>

          <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/internments')}>
            <div className="stat-card__icon" style={{
              background: activeInternments.some(i => i.status === 'critical') ? 'rgba(255,59,48,0.12)' : 'rgba(50,173,230,0.12)',
              color: activeInternments.some(i => i.status === 'critical') ? 'var(--red)' : 'var(--teal)',
            }}>
              <Hospital size={22} strokeWidth={1.75} />
            </div>
            <div className="stat-card__label">Internados</div>
            <div className="stat-card__value" style={{
              color: activeInternments.some(i => i.status === 'critical') ? 'var(--red)' : 'var(--teal)',
            }}>
              {activeInternments.length}
            </div>
            <div className="stat-card__sub">
              {activeInternments.filter(i => i.status === 'critical').length > 0
                ? `${activeInternments.filter(i => i.status === 'critical').length} en estado crítico`
                : 'pacientes activos'}
            </div>
          </div>

          {isVet && (
            <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/finances')}>
              <div className="stat-card__icon" style={{ background: 'rgba(175,82,222,0.12)', color: 'var(--purple)' }}>
                <Banknote size={22} strokeWidth={1.75} />
              </div>
              <div className="stat-card__label">Ingresos totales</div>
              <div className="stat-card__value" style={{ color: 'var(--purple)', fontSize: 20 }}>{formatCurrency(totalIncome)}</div>
              <div className="stat-card__sub">{sales.items.length} ventas</div>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* Today's appointments */}
          <div className="card card--no-hover">
            <div className="card__header">
              <span className="card__title">Turnos de hoy</span>
              <button className="btn btn--subtle btn--sm" onClick={() => navigate('/appointments')}>Ver todos</button>
            </div>
            {todayAppointments.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 20px' }}>
                <div className="empty-state__icon"><CalendarDays size={36} strokeWidth={1.5} /></div>
                <div className="empty-state__title" style={{ fontSize: 15 }}>Sin turnos hoy</div>
              </div>
            ) : (
              <div>
                {todayAppointments.map(appt => {
                  const pet = pets.find(appt.petId)
                  return (
                    <div
                      key={appt.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background var(--t-fast)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                      onClick={() => navigate('/appointments')}
                    >
                      <div style={{ minWidth: 52, fontWeight: 700, fontSize: 14, color: 'var(--blue)', fontVariantNumeric: 'tabular-nums' }}>
                        {appt.time}
                      </div>
                      <div style={{ color: 'var(--text-secondary)' }}>
                        <SpeciesIcon species={pet?.species} size={18} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }} className="truncate">{pet?.name || '—'}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }} className="truncate">{appt.reason}</div>
                      </div>
                      <Badge color={appointmentStatusColor(appt.status)} dot>
                        {appointmentStatusLabel(appt.status)}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Upcoming vaccines */}
          <div className="card card--no-hover">
            <div className="card__header">
              <span className="card__title">Vacunas próximas</span>
              <button className="btn btn--subtle btn--sm" onClick={() => navigate('/vaccines')}>Ver todas</button>
            </div>
            {upcomingVaccines.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 20px' }}>
                <div className="empty-state__icon"><CheckCircle size={36} strokeWidth={1.5} style={{ color: 'var(--green)' }} /></div>
                <div className="empty-state__title" style={{ fontSize: 15 }}>Todo al día</div>
              </div>
            ) : (
              <div>
                {upcomingVaccines.map(vac => {
                  const pet = pets.find(vac.petId)
                  const days = daysUntil(vac.nextDose)
                  return (
                    <div
                      key={vac.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background var(--t-fast)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                      onClick={() => navigate('/vaccines')}
                    >
                      <div style={{ color: 'var(--text-secondary)' }}>
                        <SpeciesIcon species={pet?.species} size={18} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }} className="truncate">{pet?.name || '—'}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }} className="truncate">{vac.name}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <Badge color={days <= 7 ? 'red' : 'orange'} dot>
                          {days === 0 ? 'Hoy' : `${days}d`}
                        </Badge>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                          {formatDate(vac.nextDose)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Active internments */}
          {activeInternments.length > 0 && (
            <div className="card card--no-hover" style={{ gridColumn: '1 / -1' }}>
              <div className="card__header">
                <span className="card__title">Pacientes internados</span>
                <button className="btn btn--subtle btn--sm" onClick={() => navigate('/internments')}>Ver todos</button>
              </div>
              <div>
                {activeInternments.map(intern => {
                  const pet = pets.find(intern.petId)
                  const owner = owners.find(intern.ownerId)
                  const isCritical = intern.status === 'critical'
                  const days = Math.round((new Date() - new Date(intern.admissionDate)) / 86400000)
                  return (
                    <div
                      key={intern.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '12px 20px', borderBottom: '1px solid var(--border)',
                        cursor: 'pointer', transition: 'background var(--t-fast)',
                        borderLeft: `3px solid ${isCritical ? 'var(--red)' : 'transparent'}`,
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                      onClick={() => navigate('/internments')}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: 'var(--r-sm)',
                        background: isCritical ? 'rgba(255,59,48,0.12)' : 'rgba(255,159,10,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: isCritical ? 'var(--red)' : 'var(--orange)', flexShrink: 0,
                      }}>
                        <SpeciesIcon species={pet?.species} size={18} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }} className="truncate">
                          {pet?.name || '—'}
                          <span style={{ fontWeight: 400, color: 'var(--text-secondary)', marginLeft: 6, fontSize: 13 }}>
                            · {owner?.name || '—'}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }} className="truncate">{intern.reason}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <Badge color={isCritical ? 'red' : 'orange'} dot>
                          {isCritical ? 'Crítico' : 'Internado'}
                        </Badge>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 3 }}>
                          {days === 0 ? 'Ingresó hoy' : `${days} día${days !== 1 ? 's' : ''}`}
                          {intern.cage ? ` · ${intern.cage}` : ''}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Recent activity */}
          <div className="card card--no-hover" style={{ gridColumn: '1 / -1' }}>
            <div className="card__header">
              <span className="card__title">Actividad reciente</span>
            </div>
            {recentActivity.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 20px' }}>
                <div className="empty-state__icon"><Clock size={36} strokeWidth={1.5} /></div>
                <div className="empty-state__title" style={{ fontSize: 15 }}>Sin actividad registrada</div>
              </div>
            ) : (
              <div style={{ padding: '8px 0' }}>
                {recentActivity.map(item => {
                  const pet = pets.find(item.petId)
                  const isConsult = item._type === 'consultation'
                  return (
                    <div
                      key={item.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 20px', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background var(--t-fast)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                      onClick={() => navigate(isConsult ? '/consultations' : '/appointments')}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: 'var(--r-sm)',
                        background: isConsult ? 'rgba(0,122,255,0.12)' : 'rgba(52,199,89,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: isConsult ? 'var(--blue)' : 'var(--green)', flexShrink: 0,
                      }}>
                        {isConsult
                          ? <Stethoscope size={16} strokeWidth={1.75} />
                          : <CheckCircle  size={16} strokeWidth={1.75} />
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>
                          {isConsult ? 'Consulta' : 'Turno atendido'} — {pet?.name || '—'}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }} className="truncate">{item.reason}</div>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', flexShrink: 0 }}>
                        {formatDate(item._date.toISOString())}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  )
}

