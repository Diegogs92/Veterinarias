import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Pencil, Trash2, PawPrint } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import Header from '../../components/layout/Header'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import SpeciesIcon from '../../components/ui/SpeciesIcon'
import PetForm from './PetForm'
import { speciesLabel, calcAge } from '../../utils/helpers'

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
        actions={
          <button className="btn btn--primary" onClick={() => { setEditing(null); setFormOpen(true) }}>
            + Nueva mascota
          </button>
        }
      />
      <div className="page">
        <div className="page__header" style={{ flexWrap: 'wrap' }}>
          <div className="search-wrap" style={{ flex: 1, minWidth: 200, maxWidth: 360 }}>
            <span className="search-icon"><Search size={14} strokeWidth={2} /></span>
            <input
              className="form-input"
              placeholder="Buscar mascota o dueño..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="tabs" style={{ flexShrink: 0 }}>
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
        ) : (
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
                    {pet.photo
                      ? <img src={pet.photo} alt={pet.name} />
                      : (
                        <div style={{
                          width: '100%', height: '100%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--text-secondary)',
                        }}>
                          <SpeciesIcon species={pet.species} size={28} strokeWidth={1.5} />
                        </div>
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
                      className="btn btn--subtle btn--sm btn--icon"
                      onClick={e => { e.stopPropagation(); setEditing(pet); setFormOpen(true) }}
                    >
                      <Pencil size={14} strokeWidth={2} />
                    </button>
                    <button
                      className="btn btn--subtle btn--sm btn--icon"
                      onClick={e => { e.stopPropagation(); setDeleting(pet) }}
                    >
                      <Trash2 size={14} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              )
            })}
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
