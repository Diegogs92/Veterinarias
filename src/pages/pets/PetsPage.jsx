import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Pencil, Trash2, PawPrint, Grid3x3, List } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import Header from '../../components/layout/Header'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import SpeciesIcon from '../../components/ui/SpeciesIcon'
import PetForm from './PetForm'
import { speciesLabel, calcAge } from '../../utils/helpers'

const WhatsAppIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

const whatsappUrl = (phone) => phone ? `https://wa.me/${phone.replace(/\D/g, '')}` : '#'

const SPECIES_FILTER = [
  { value: '',       label: 'Todas' },
  { value: 'perro',  label: 'Perros' },
  { value: 'gato',   label: 'Gatos' },
  { value: 'pajaro', label: 'Pájaros' },
  { value: 'otro',   label: 'Otros' },
]

export default function PetsPage() {
  const { pets, owners } = useApp()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [speciesFilter, setSpeciesFilter] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [view, setView] = useState('cards')

  const ownerFilter = searchParams.get('owner') || ''

  const filtered = useMemo(() =>
    pets.items.filter(p => {
      const owner = owners.find(p.ownerId)
      const searchStr = `${p.name} ${p.breed} ${owner?.name || ''}`.toLowerCase()
      return (
        searchStr.includes(search.toLowerCase()) &&
        (!speciesFilter || p.species === speciesFilter) &&
        (!ownerFilter || p.ownerId === ownerFilter)
      )
    }),
    [pets.items, search, speciesFilter, ownerFilter, owners]
  )

  const handleSave = (data) => {
    if (editing) pets.update(editing.id, data)
    else pets.add(data)
    setEditing(null)
  }

  const handleDelete = () => { pets.remove(deleting.id); setDeleting(null) }

  return (
    <>
      <Header
        title="Mascotas"
        subtitle={`${pets.items.length} registradas`}
      />
      <div className="page">
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-wrap" style={{ flex: 1, minWidth: 200, maxWidth: 360 }}>
            <span className="search-icon"><Search size={18} strokeWidth={2} /></span>
            <input
              className="form-input"
              placeholder="Buscar mascota o dueño..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="tabs">
            {SPECIES_FILTER.map(s => (
              <button
                key={s.value}
                className={`tab${speciesFilter === s.value ? ' active' : ''}`}
                onClick={() => setSpeciesFilter(s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="tabs">
            <button
              className={`tab${view === 'cards' ? ' active' : ''}`}
              onClick={() => setView('cards')}
              title="Vista de tarjetas"
            >
              <Grid3x3 size={16} strokeWidth={2} />
            </button>
            <button
              className={`tab${view === 'table' ? ' active' : ''}`}
              onClick={() => setView('table')}
              title="Vista de lista"
            >
              <List size={16} strokeWidth={2} />
            </button>
          </div>
          <button className="btn btn--primary" style={{ marginLeft: 'auto' }} onClick={() => { setEditing(null); setFormOpen(true) }}>
            + Nueva mascota
          </button>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<PawPrint size={48} strokeWidth={1.25} />}
            title="No hay mascotas"
            text={search || speciesFilter ? 'Sin resultados.' : 'Agregá la primera mascota.'}
            action={!search && !speciesFilter && (
              <button className="btn btn--primary" onClick={() => setFormOpen(true)}>+ Nueva mascota</button>
            )}
          />
        ) : view === 'cards' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {filtered.map(pet => {
              const owner = owners.find(pet.ownerId)
              return (
                <div
                  key={pet.id}
                  className="pet-card"
                  onClick={() => navigate(`/pets/${pet.id}`)}
                >
                  <div className="pet-avatar">
                    {pet.photoUrl
                      ? <img src={pet.photoUrl} alt={pet.name} />
                      : (
                        <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-secondary)', userSelect: 'none' }}>
                          {pet.name?.[0]?.toUpperCase()}
                        </span>
                      )
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{pet.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 1 }}>
                      {speciesLabel(pet.species)}{pet.breed ? ` · ${pet.breed}` : ''}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
                      {owner?.name || '—'}
                      {pet.birthDate && ` · ${calcAge(pet.birthDate)}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                    <button
                      className="btn btn--subtle btn--icon"
                      onClick={e => { e.stopPropagation(); setEditing(pet); setFormOpen(true) }}
                    >
                      <Pencil size={18} strokeWidth={2} />
                    </button>
                    <button
                      className="btn btn--subtle btn--icon"
                      onClick={e => { e.stopPropagation(); setDeleting(pet) }}
                    >
                      <Trash2 size={18} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="card card--no-hover card--table">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Mascota</th>
                    <th>Dueño</th>
                    <th>Especie</th>
                    <th>Raza</th>
                    <th>Edad</th>
                    <th style={{ width: 80 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(pet => {
                    const owner = owners.find(pet.ownerId)
                    return (
                      <tr
                        key={pet.id}
                        onClick={() => navigate(`/pets/${pet.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{pet.name}</div>
                        </td>
                        <td>
                          {owner ? (
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 14 }}>{owner.name}</div>
                              {owner.phone && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{owner.phone}</span>
                                  <a href={whatsappUrl(owner.phone)} target="_blank" rel="noopener noreferrer" style={{ color: '#25D366' }} onClick={e => e.stopPropagation()}>
                                    <WhatsAppIcon size={13} />
                                  </a>
                                </div>
                              )}
                            </div>
                          ) : <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                          {speciesLabel(pet.species) || '—'}
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                          {pet.breed || '—'}
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {pet.birthDate ? calcAge(pet.birthDate) : '—'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                            <button className="btn btn--subtle btn--icon" onClick={(e) => { e.stopPropagation(); setEditing(pet); setFormOpen(true) }} title="Editar">
                              <Pencil size={18} />
                            </button>
                            <button className="btn btn--subtle btn--icon" onClick={(e) => { e.stopPropagation(); setDeleting(pet) }} title="Eliminar" style={{ color: 'var(--vet-rose)' }}>
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
        )}
      </div>

      <PetForm
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null) }}
        onSave={handleSave}
        initial={editing}
        defaultOwnerId={ownerFilter}
      />

      <Modal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title="Eliminar mascota"
        size="sm"
        footer={
          <>
            <button className="btn btn--ghost" onClick={() => setDeleting(null)}>Cancelar</button>
            <button className="btn btn--danger" onClick={handleDelete}>Eliminar</button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)' }}>
          ¿Eliminar a <strong>{deleting?.name}</strong>? Esta acción no se puede deshacer.
        </p>
      </Modal>
    </>
  )
}
