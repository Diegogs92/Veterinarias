import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, Info, Stethoscope, Syringe, CalendarDays } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import Header from '../../components/layout/Header'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import SpeciesIcon from '../../components/ui/SpeciesIcon'
import { speciesLabel, calcAge, formatDate } from '../../utils/helpers'

export default function PetDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { pets, owners, consultations, vaccines, appointments } = useApp()
  const [tab, setTab] = useState('info')

  const pet = pets.find(id)
  if (!pet) return (
    <>
      <Header title="Mascota no encontrada" />
      <div className="page">
        <EmptyState icon={<SpeciesIcon species="otro" size={48} strokeWidth={1.25} />} title="Mascota no encontrada" text="El ID no existe." />
      </div>
    </>
  )

  const owner = owners.find(pet.ownerId)
  const petConsultations = consultations.items.filter(c => c.petId === id).sort((a, b) => new Date(b.date) - new Date(a.date))
  const petVaccines = vaccines.items.filter(v => v.petId === id).sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate))
  const petAppointments = appointments.items.filter(a => a.petId === id).sort((a, b) => new Date(b.date) - new Date(a.date))

  const TABS = [
    { key: 'info',          Icon: Info,         label: 'Info' },
    { key: 'consultations', Icon: Stethoscope,  label: 'Historial' },
    { key: 'vaccines',      Icon: Syringe,      label: 'Vacunas' },
    { key: 'appointments',  Icon: CalendarDays, label: 'Turnos' },
  ]

  return (
    <>
      <Header
        title={pet.name}
        subtitle={`${speciesLabel(pet.species)}${pet.breed ? ` · ${pet.breed}` : ''}`}
        actions={
          <button className="btn btn--ghost btn--sm" onClick={() => navigate('/pets')}>
            <ArrowLeft size={14} strokeWidth={2} />
            Volver
          </button>
        }
      />
      <div className="page">

        {/* Pet header card */}
        <div className="card card--no-hover" style={{ marginBottom: 20 }}>
          <div className="card__body" style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <div style={{
              width: 80, height: 80, borderRadius: 'var(--r-lg)',
              background: 'var(--bg-input)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', flexShrink: 0,
              color: 'var(--text-secondary)',
            }}>
              {pet.photo
                ? <img src={pet.photo} alt={pet.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <SpeciesIcon species={pet.species} size={44} strokeWidth={1.25} />
              }
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{pet.name}</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>
                {speciesLabel(pet.species)}{pet.breed ? ` · ${pet.breed}` : ''}
                {pet.birthDate && ` · ${calcAge(pet.birthDate)}`}
                {pet.weight && ` · ${pet.weight} kg`}
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {owner && (
                  <span
                    style={{ background: 'var(--bg-input)', borderRadius: 'var(--r-full)', padding: '3px 10px', fontSize: 13, cursor: 'pointer' }}
                    onClick={() => navigate('/owners')}
                  >
                    {owner.name}
                  </span>
                )}
                {pet.allergies && pet.allergies !== 'Ninguna' && (
                  <Badge color="orange">
                    <AlertTriangle size={11} strokeWidth={2} style={{ marginRight: 2 }} />
                    {pet.allergies}
                  </Badge>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 24, textAlign: 'center', flexShrink: 0 }}>
              {[
                { value: petConsultations.length, label: 'Consultas',  color: 'var(--blue)' },
                { value: petVaccines.length,      label: 'Vacunas',    color: 'var(--green)' },
                { value: petAppointments.length,  label: 'Turnos',     color: 'var(--orange)' },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ marginBottom: 16 }}>
          <div className="tabs" style={{ display: 'inline-flex', width: 'auto' }}>
            {TABS.map(({ key, Icon, label }) => (
              <button key={key} className={`tab${tab === key ? ' active' : ''}`} onClick={() => setTab(key)}
                style={{ display: 'flex', alignItems: 'center', gap: 5 }}
              >
                <Icon size={13} strokeWidth={2} />{label}
              </button>
            ))}
          </div>
        </div>

        {/* INFO */}
        {tab === 'info' && (
          <div className="card card--no-hover">
            <div className="card__body">
              <div className="detail-grid">
                <div className="detail-item">
                  <div className="detail-item__label">Fecha de nacimiento</div>
                  <div className="detail-item__value">{pet.birthDate ? formatDate(pet.birthDate) : '—'}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-item__label">Edad</div>
                  <div className="detail-item__value">{calcAge(pet.birthDate) || '—'}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-item__label">Peso</div>
                  <div className="detail-item__value">{pet.weight ? `${pet.weight} kg` : '—'}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-item__label">Dueño</div>
                  <div className="detail-item__value">{owner?.name || '—'}</div>
                </div>
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                  <div className="detail-item__label">Alergias</div>
                  <div className="detail-item__value">{pet.allergies || '—'}</div>
                </div>
                {pet.observations && (
                  <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                    <div className="detail-item__label">Observaciones</div>
                    <div className="detail-item__value" style={{ whiteSpace: 'pre-line' }}>{pet.observations}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CONSULTATIONS */}
        {tab === 'consultations' && (
          petConsultations.length === 0
            ? <EmptyState icon={<Stethoscope size={48} strokeWidth={1.25} />} title="Sin consultas" text="No hay historial clínico para esta mascota." />
            : (
              <div className="timeline">
                {petConsultations.map(c => (
                  <div key={c.id} className="timeline-item">
                    <div className="card card--no-hover" style={{ marginBottom: 0 }}>
                      <div className="card__body">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                          <div style={{ fontWeight: 700, fontSize: 15 }}>{c.reason}</div>
                          <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{formatDate(c.date)}</div>
                        </div>
                        <div className="detail-grid" style={{ gap: 12 }}>
                          {c.diagnosis && <div className="detail-item"><div className="detail-item__label">Diagnóstico</div><div className="detail-item__value" style={{ fontSize: 14 }}>{c.diagnosis}</div></div>}
                          {c.treatment && <div className="detail-item"><div className="detail-item__label">Tratamiento</div><div className="detail-item__value" style={{ fontSize: 14 }}>{c.treatment}</div></div>}
                          {c.medication && <div className="detail-item" style={{ gridColumn: '1 / -1' }}><div className="detail-item__label">Medicación</div><div className="detail-item__value" style={{ fontSize: 14 }}>{c.medication}</div></div>}
                          {c.observations && <div className="detail-item" style={{ gridColumn: '1 / -1' }}><div className="detail-item__label">Observaciones</div><div className="detail-item__value" style={{ fontSize: 14 }}>{c.observations}</div></div>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
        )}

        {/* VACCINES */}
        {tab === 'vaccines' && (
          petVaccines.length === 0
            ? <EmptyState icon={<Syringe size={48} strokeWidth={1.25} />} title="Sin vacunas" text="No hay vacunas registradas para esta mascota." />
            : (
              <div className="card card--no-hover">
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Vacuna</th><th>Aplicada</th><th>Próxima dosis</th><th>Notas</th></tr></thead>
                    <tbody>
                      {petVaccines.map(v => (
                        <tr key={v.id}>
                          <td style={{ fontWeight: 600 }}>{v.name}</td>
                          <td>{formatDate(v.appliedDate)}</td>
                          <td>{formatDate(v.nextDose)}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{v.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
        )}

        {/* APPOINTMENTS */}
        {tab === 'appointments' && (
          petAppointments.length === 0
            ? <EmptyState icon={<CalendarDays size={48} strokeWidth={1.25} />} title="Sin turnos" text="No hay turnos registrados para esta mascota." />
            : (
              <div className="card card--no-hover">
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Fecha</th><th>Hora</th><th>Motivo</th><th>Estado</th></tr></thead>
                    <tbody>
                      {petAppointments.map(a => (
                        <tr key={a.id}>
                          <td>{formatDate(a.date)}</td>
                          <td>{a.time}</td>
                          <td>{a.reason}</td>
                          <td>
                            <Badge color={a.status === 'attended' ? 'green' : a.status === 'cancelled' ? 'red' : a.status === 'confirmed' ? 'blue' : 'orange'} dot>
                              {{ pending:'Pendiente', confirmed:'Confirmado', attended:'Atendido', cancelled:'Cancelado' }[a.status]}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
        )}
      </div>
    </>
  )
}
