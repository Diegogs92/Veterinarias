import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Pencil, Trash2, Users, PawPrint } from 'lucide-react'

function WhatsAppIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0 0 20.464 3.488"/>
    </svg>
  )
}

// Convierte un teléfono libre a formato wa.me (E.164 sin '+').
// Asume Argentina por defecto (+54 9 = móvil).
function toWhatsAppNumber(raw) {
  let d = (raw || '').replace(/\D/g, '')
  if (!d) return ''
  if (d.startsWith('54')) d = d.slice(2)
  d = d.replace(/^0/, '').replace(/^15/, '')
  return `549${d}`
}
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

  const tab = searchParams.get('tab') || 'pets'
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
        title="Mascotas"
        subtitle={tab === 'owners'
          ? `${owners.items.length} dueños registrados`
          : ownerName
            ? `Mascotas de ${ownerName}`
            : `${pets.items.length} mascotas registradas`
        }
      />

      <div className="page">
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
          <div className="tabs">
            <button className={`tab${tab === 'pets' ? ' active' : ''}`} onClick={() => setTab('pets')}>
              <PawPrint size={17} strokeWidth={2} style={{ marginRight: 6 }} />
              Mascotas
            </button>
            <button className={`tab${tab === 'owners' ? ' active' : ''}`} onClick={() => setTab('owners')}>
              <Users size={17} strokeWidth={2} style={{ marginRight: 6 }} />
              Dueños
            </button>
          </div>
          {ownerFilter && tab === 'pets' && (
            <button className="btn btn--ghost btn--sm" onClick={() => setOwnerFilter('')}>
              ✕ Filtro: {ownerName}
            </button>
          )}
          {tab === 'owners'
            ? <button className="btn btn--primary" style={{ marginLeft: 'auto' }} onClick={() => { setEditingOwner(null); setOwnerFormOpen(true) }}>+ Nuevo dueño</button>
            : <button className="btn btn--primary" style={{ marginLeft: 'auto' }} onClick={() => { setEditingPet(null); setPetFormOpen(true) }}>+ Nueva mascota</button>
          }
        </div>

        {/* ── OWNERS TAB ── */}
        {tab === 'owners' && (
          <>
            <div className="page__header" style={{ marginBottom: 16 }}>
              <div className="search-wrap" style={{ flex: 1, maxWidth: 360 }}>
                <span className="search-icon"><Search size={18} strokeWidth={2} /></span>
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
                          <td style={{ color: 'var(--text-secondary)' }}>
                            {owner.phone
                              ? (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                  <span>{owner.phone}</span>
                                  <a
                                    href={`https://wa.me/${toWhatsAppNumber(owner.phone)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Enviar WhatsApp"
                                    onClick={e => e.stopPropagation()}
                                    style={{ color: '#25D366', display: 'inline-flex', alignItems: 'center' }}
                                  >
                                    <WhatsAppIcon size={20} />
                                  </a>
                                </div>
                              )
                              : '—'
                            }
                          </td>
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
                              <button className="btn btn--subtle btn--icon" title="Editar" onClick={() => { setEditingOwner(owner); setOwnerFormOpen(true) }}>
                                <Pencil size={18} strokeWidth={2} />
                              </button>
                              <button className="btn btn--subtle btn--icon" title="Eliminar" onClick={() => setDeletingOwner(owner)}>
                                <Trash2 size={18} strokeWidth={2} />
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
                <span className="search-icon"><Search size={18} strokeWidth={2} /></span>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {filteredPets.map(pet => {
                  const owner = owners.find(pet.ownerId)
                  const hasPhoto = !!pet.photo
                  const textColor   = hasPhoto ? 'white' : undefined
                  const subColor    = hasPhoto ? 'rgba(255,255,255,0.92)' : 'var(--text-secondary)'
                  const subSubColor = hasPhoto ? 'rgba(255,255,255,0.78)' : 'var(--text-tertiary)'
                  const textShadow  = hasPhoto ? '0 1px 3px rgba(0,0,0,0.6)'  : undefined
                  const glassBtn    = hasPhoto
                    ? { background: 'rgba(255,255,255,0.20)', borderColor: 'rgba(255,255,255,0.35)', color: 'white', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }
                    : undefined
                  return (
                    <div
                      key={pet.id}
                      className="pet-card"
                      onClick={() => navigate(`/pets/${pet.id}`)}
                      style={{ position: 'relative', overflow: 'hidden', minHeight: 140, padding: 16, alignItems: 'stretch' }}
                    >
                      {hasPhoto ? (
                        <>
                          {/* Foto a tamaño completo */}
                          <div style={{
                            position: 'absolute', inset: 0,
                            backgroundImage: `url(${pet.photo})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }} />
                          {/* Velo oscuro para contraste */}
                          <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.75) 100%)',
                          }} />
                        </>
                      ) : (
                        <div style={{
                          position: 'absolute', inset: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--text-tertiary)',
                        }}>
                          <SpeciesIcon species={pet.species} size={64} strokeWidth={1.25} />
                        </div>
                      )}

                      <div style={{ position: 'relative', zIndex: 1, flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                        <div style={{ fontWeight: 700, fontSize: 18, color: textColor, textShadow }}>{pet.name}</div>
                        <div style={{ fontSize: 13.5, color: subColor, marginTop: 2, textShadow }}>
                          {speciesLabel(pet.species)}{pet.breed ? ` · ${pet.breed}` : ''}
                        </div>
                        <div style={{ fontSize: 12.5, color: subSubColor, marginTop: 4, textShadow }}>
                          {owner ? `${owner.name}${owner.apellido ? ` ${owner.apellido}` : ''}` : '—'}
                          {pet.birthDate && ` · ${calcAge(pet.birthDate)}`}
                        </div>
                      </div>

                      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                        <button
                          className="btn btn--subtle btn--icon"
                          style={glassBtn}
                          onClick={e => { e.stopPropagation(); setEditingPet(pet); setPetFormOpen(true) }}
                        >
                          <Pencil size={18} strokeWidth={2} />
                        </button>
                        <button
                          className="btn btn--subtle btn--icon"
                          style={glassBtn}
                          onClick={e => { e.stopPropagation(); setDeletingPet(pet) }}
                        >
                          <Trash2 size={18} strokeWidth={2} />
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
