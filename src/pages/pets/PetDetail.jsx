import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, Info } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import Header from '../../components/layout/Header'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import SpeciesIcon from '../../components/ui/SpeciesIcon'
import { speciesLabel, calcAge, formatDate } from '../../utils/helpers'

export default function PetDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { pets, owners } = useApp()

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

  return (
    <>
      <Header
        title={pet.name}
        subtitle={`${speciesLabel(pet.species)}${pet.breed ? ` · ${pet.breed}` : ''}`}
      />
      <div className="page">
        <div style={{ marginBottom: 16 }}>
          <button className="btn btn--ghost btn--sm" onClick={() => navigate('/owners-pets')}>
            <ArrowLeft size={14} strokeWidth={2} />
            Volver
          </button>
        </div>

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
                    onClick={() => navigate('/owners-pets')}
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
          </div>
        </div>

        {/* Info */}
        <div className="card card--no-hover">
          <div className="card__header">
            <span className="card__title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Info size={15} strokeWidth={2} /> Información
            </span>
          </div>
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

      </div>
    </>
  )
}
