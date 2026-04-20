import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Pencil, Trash2, Users, PawPrint } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import Header from '../../components/layout/Header'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import SpeciesIcon from '../../components/ui/SpeciesIcon'
import OwnerForm from '../owners/OwnerForm'
import PetForm from '../pets/PetForm'
import { formatDate, initials, avatarColor, speciesLabel, calcAge } from '../../utils/helpers'

const SPECIES_FILTER = [
  { value: '', label: 'Todas' },
  { value: 'perro', label: 'Perros' },
  { value: 'gato', label: 'Gatos' },
  { value: 'pajaro', label: 'Pájaros' },
  { value: 'otro', label: 'Otros' },
]

export default function OwnersPetsPage() {
  const { owners, pets } = useApp()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const tab = searchParams.get('tab') || 'owners'
  const ownerFilter = searchParams.get('owner') || ''

  const setTab = (t) => {
    const next = new URLSearchParams(searchParams)
    next.set('tab', t)
    if (t === 'owners') next.delete('owner')
    setSearchParams(next)
  }

  const setOwnerFilter = (id) => {
    const next = new URLSearchParams()
    next.set('tab', 'pets')
    if (id) next.set('owner', id)
    setSearchParams(next)
  }

  // ── Owners tab state ─────────────────────────────────────────────────────
  const [ownerSearch, setOwnerSearch] = useState('')
  const [ownerFormOpen, setOwnerFormOpen] = useState(false)
  const [editingOwner, setEditingOwner] = useState(null)
  const [deletingOwner, setDeletingOwner] = useState(null)

  const filteredOwners = useMemo(() =>
    owners.items.filter(o =>
      `${o.name} ${o.apellido} ${o.phone} ${o.email}`.toLowerCase().includes(ownerSearch.toLowerCase())
    ),
    [owners.items, ownerSearch]
  )

  const petCount = (ownerId) => pets.items.filter(p => p.ownerId === ownerId).length

  const handleSaveOwner = (data) => {
    if (editingOwner) owners.update(editingOwner.id, data)
    else owners.add(data)
    setEditingOwner(null)
  }

  const handleDeleteOwner = () => { owners.remove(deletingOwner.id); setDeletingOwner(null) }

  // ── Pets tab state ───────────────────────────────────────────────────────
  const [petSearch, setPetSearch] = useState('')
  const [speciesFilter, setSpeciesFilter] = useState('')
  const [petFormOpen, setPetFormOpen] = useState(false)
  const [editingPet, setEditingPet] = useState(null)
  const [deletingPet, setDeletingPet] = useState(null)

  const filteredPets = useMemo(() =>
    pets.items.filter(p => {
      const owner = owners.find(p.ownerId)
      const searchStr = `${p.name} ${p.breed} ${owner?.name || ''} ${owner?.apellido || ''}`.toLowerCase()
      return (
        searchStr.includes(petSearch.toLowerCase()) &&
        (!speciesFilter || p.species === speciesFilter) &&
        (!ownerFilter || p.ownerId === ownerFilter)
      )
    }),
    [pets.items, petSearch, speciesFilter, ownerFilter, owners]
  )

  const handleSavePet = (data) => {
    if (editingPet) pets.update(editingPet.id, data)
    else pets.add(data)
    setEditingPet(null)
  }

  const handleDeletePet = () => { pets.remove(deletingPet.id); setDeletingPet(null) }

  const ownerData = ownerFilter ? owners.find(ownerFilter) : null
  const ownerName = ownerData ? `${ownerData.name}${ownerData.apellido ? ` ${ownerData.apellido}` : ''}` : null

  return (
    <>
      <Header
        title="Dueños y Mascotas"
        subtitle={tab === 'owners'
          ? `${owners.items.length} dueños registrados`
          : ownerName
            ? `Mascotas de ${ownerName}`
            : `${pets.items.length} mascotas registradas`
        }
        actions={
          tab === 'owners'
            ? <button className="btn btn--primary" onClick={() => { setEditingOwner(null); setOwnerFormOpen(true) }}>+ Nuevo dueño</button>
            : <button className="btn btn--primary" onClick={() => { setEditingPet(null); setPetFormOpen(true) }}>+ Nueva mascota</button>
        }
      />

      <div className="page">
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
          <div className="tabs">
            <button className={`tab${tab === 'owners' ? ' active' : ''}`} onClick={() => setTab('owners')}>
              <Users size={14} strokeWidth={2} style={{ marginRight: 5 }} />
              Dueños
            </button>
            <button className={`tab${tab === 'pets' ? ' active' : ''}`} onClick={() => setTab('pets')}>
              <PawPrint size={14} strokeWidth={2} style={{ marginRight: 5 }} />
              Mascotas
            </button>
          </div>
          {ownerFilter && tab === 'pets' && (
            <button className="btn btn--ghost btn--sm" onClick={() => setOwnerFilter('')}>
              ✕ Filtro: {ownerName}
            </button>
          )}
        </div>

        {/* ── OWNERS TAB ── */}
        {tab === 'owners' && (
          <>
            <div className="page__header" style={{ marginBottom: 16 }}>
              <div className="search-wrap" style={{ flex: 1, maxWidth: 360 }}>
                <span className="search-icon"><Search size={14} strokeWidth={2} /></span>
                <input
                  className="form-input"
                  placeholder="Buscar dueño..."
                  value={ownerSearch}
                  onChange={e => setOwnerSearch(e.target.value)}
                />
              </div>
            </div>

            {filteredOwners.length === 0 ? (
              <EmptyState
                icon={<Users size={48} strokeWidth={1.25} />}
                title="No hay dueños"
                text={ownerSearch ? 'Sin resultados para la búsqueda.' : 'Agregá el primer dueño para comenzar.'}
                action={!ownerSearch && <button className="btn btn--primary" onClick={() => setOwnerFormOpen(true)}>+ Nuevo dueño</button>}
              />
            ) : (
              <div className="card card--no-hover">
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Apellido</th>
                        <th>Teléfono</th>
                        <th>Email</th>
                        <th>Dirección</th>
                        <th>Mascotas</th>
                        <th>Alta</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOwners.map(owner => (
                        <tr key={owner.id} style={{ cursor: 'pointer' }} onClick={() => setOwnerFilter(owner.id)}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div className="avatar avatar--sm" style={{ background: avatarColor(owner.name), fontSize: 11 }}>
                                {initials(`${owner.name}${owner.apellido ? ` ${owner.apellido}` : ''}`)}
                              </div>
                              <span style={{ fontWeight: 600 }}>{owner.name}</span>
                            </div>
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>{owner.apellido || '—'}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{owner.phone}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{owner.email || '—'}</td>
                          <td style={{ color: 'var(--text-secondary)', maxWidth: 180 }} className="truncate">{owner.address || '—'}</td>
                          <td>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              background: 'var(--bg-input)', borderRadius: 'var(--r-full)',
                              padding: '2px 10px', fontSize: 13, fontWeight: 600,
                            }}>
                              <PawPrint size={12} strokeWidth={2} />
                              {petCount(owner.id)}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>{formatDate(owner.createdAt)}</td>
                          <td onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button className="btn btn--subtle btn--sm btn--icon" title="Editar" onClick={() => { setEditingOwner(owner); setOwnerFormOpen(true) }}>
                                <Pencil size={14} strokeWidth={2} />
                              </button>
                              <button className="btn btn--subtle btn--sm btn--icon" title="Eliminar" onClick={() => setDeletingOwner(owner)}>
                                <Trash2 size={14} strokeWidth={2} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── PETS TAB ── */}
        {tab === 'pets' && (
          <>
            <div className="page__header" style={{ flexWrap: 'wrap', marginBottom: 16 }}>
              <div className="search-wrap" style={{ flex: 1, minWidth: 200, maxWidth: 360 }}>
                <span className="search-icon"><Search size={14} strokeWidth={2} /></span>
                <input
                  className="form-input"
                  placeholder="Buscar mascota o dueño..."
                  value={petSearch}
                  onChange={e => setPetSearch(e.target.value)}
                />
              </div>
              {!ownerFilter && (
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
              )}
            </div>

            {filteredPets.length === 0 ? (
              <EmptyState
                icon={<PawPrint size={48} strokeWidth={1.25} />}
                title="No hay mascotas"
                text={petSearch || speciesFilter ? 'Sin resultados.' : 'Agregá la primera mascota.'}
                action={!petSearch && !speciesFilter && (
                  <button className="btn btn--primary" onClick={() => setPetFormOpen(true)}>+ Nueva mascota</button>
                )}
              />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {filteredPets.map(pet => {
                  const owner = owners.find(pet.ownerId)
                  return (
                    <div key={pet.id} className="pet-card" onClick={() => navigate(`/pets/${pet.id}`)}>
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
                          {owner ? `${owner.name}${owner.apellido ? ` ${owner.apellido}` : ''}` : '—'}
                          {pet.birthDate && ` · ${calcAge(pet.birthDate)}`}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                        <button
                          className="btn btn--subtle btn--sm btn--icon"
                          onClick={e => { e.stopPropagation(); setEditingPet(pet); setPetFormOpen(true) }}
                        >
                          <Pencil size={14} strokeWidth={2} />
                        </button>
                        <button
                          className="btn btn--subtle btn--sm btn--icon"
                          onClick={e => { e.stopPropagation(); setDeletingPet(pet) }}
                        >
                          <Trash2 size={14} strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      <OwnerForm
        isOpen={ownerFormOpen}
        onClose={() => { setOwnerFormOpen(false); setEditingOwner(null) }}
        onSave={handleSaveOwner}
        initial={editingOwner}
      />

      <PetForm
        isOpen={petFormOpen}
        onClose={() => { setPetFormOpen(false); setEditingPet(null) }}
        onSave={handleSavePet}
        initial={editingPet}
        defaultOwnerId={ownerFilter}
      />

      <Modal
        isOpen={!!deletingOwner}
        onClose={() => setDeletingOwner(null)}
        title="Eliminar dueño"
        size="sm"
        footer={
          <>
            <button className="btn btn--ghost" onClick={() => setDeletingOwner(null)}>Cancelar</button>
            <button className="btn btn--danger" onClick={handleDeleteOwner}>Eliminar</button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)' }}>
          ¿Seguro que querés eliminar a <strong>{deletingOwner?.name}</strong>? Esta acción no se puede deshacer.
        </p>
      </Modal>

      <Modal
        isOpen={!!deletingPet}
        onClose={() => setDeletingPet(null)}
        title="Eliminar mascota"
        size="sm"
        footer={
          <>
            <button className="btn btn--ghost" onClick={() => setDeletingPet(null)}>Cancelar</button>
            <button className="btn btn--danger" onClick={handleDeletePet}>Eliminar</button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)' }}>
          ¿Eliminar a <strong>{deletingPet?.name}</strong>? Esta acción no se puede deshacer.
        </p>
      </Modal>
    </>
  )
}
