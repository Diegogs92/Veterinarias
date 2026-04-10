import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Pencil, Trash2, Users } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import Header from '../../components/layout/Header'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import OwnerForm from './OwnerForm'
import { formatDate, initials, avatarColor } from '../../utils/helpers'

export default function OwnersPage() {
  const { owners, pets } = useApp()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const filtered = useMemo(() =>
    owners.items.filter(o =>
      `${o.name} ${o.phone} ${o.email}`.toLowerCase().includes(search.toLowerCase())
    ),
    [owners.items, search]
  )

  const petCount = (ownerId) => pets.items.filter(p => p.ownerId === ownerId).length

  const handleSave = (data) => {
    if (editing) owners.update(editing.id, data)
    else owners.add(data)
    setEditing(null)
  }

  const handleDelete = () => { owners.remove(deleting.id); setDeleting(null) }

  return (
    <>
      <Header
        title="Dueños"
        subtitle={`${owners.items.length} registrados`}
        actions={
          <button className="btn btn--primary" onClick={() => { setEditing(null); setFormOpen(true) }}>
            + Nuevo dueño
          </button>
        }
      />
      <div className="page">
        <div className="page__header">
          <div className="search-wrap" style={{ flex: 1, maxWidth: 360 }}>
            <span className="search-icon"><Search size={14} strokeWidth={2} /></span>
            <input
              className="form-input"
              placeholder="Buscar dueño..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Users size={48} strokeWidth={1.25} />}
            title="No hay dueños"
            text={search ? 'Sin resultados para la búsqueda.' : 'Agregá el primer dueño para comenzar.'}
            action={!search && <button className="btn btn--primary" onClick={() => setFormOpen(true)}>+ Nuevo dueño</button>}
          />
        ) : (
          <div className="card card--no-hover">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Dueño</th>
                    <th>Teléfono</th>
                    <th>Email</th>
                    <th>Dirección</th>
                    <th>Mascotas</th>
                    <th>Alta</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(owner => (
                    <tr key={owner.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/pets?owner=${owner.id}`)}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="avatar avatar--sm" style={{ background: avatarColor(owner.name), fontSize: 11 }}>
                            {initials(owner.name)}
                          </div>
                          <span style={{ fontWeight: 600 }}>{owner.name}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{owner.phone}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{owner.email || '—'}</td>
                      <td style={{ color: 'var(--text-secondary)', maxWidth: 180 }} className="truncate">{owner.address || '—'}</td>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          background: 'var(--bg-input)', borderRadius: 'var(--r-full)',
                          padding: '2px 10px', fontSize: 13, fontWeight: 600,
                        }}>
                          <Users size={12} strokeWidth={2} />
                          {petCount(owner.id)}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>{formatDate(owner.createdAt)}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn--subtle btn--sm btn--icon" title="Editar" onClick={() => { setEditing(owner); setFormOpen(true) }}>
                            <Pencil size={14} strokeWidth={2} />
                          </button>
                          <button className="btn btn--subtle btn--sm btn--icon" title="Eliminar" onClick={() => setDeleting(owner)}>
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
      </div>

      <OwnerForm
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null) }}
        onSave={handleSave}
        initial={editing}
      />

      <Modal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title="Eliminar dueño"
        size="sm"
        footer={
          <>
            <button className="btn btn--ghost" onClick={() => setDeleting(null)}>Cancelar</button>
            <button className="btn btn--danger" onClick={handleDelete}>Eliminar</button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)' }}>
          ¿Seguro que querés eliminar a <strong>{deleting?.name}</strong>? Esta acción no se puede deshacer.
        </p>
      </Modal>
    </>
  )
}
