import { useState, useMemo } from 'react'
import { Search, Pencil, Trash2, Scissors, MessageCircle } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import EmptyState from '../../components/ui/EmptyState'
import Header from '../../components/layout/Header'
import Modal from '../../components/ui/Modal'
import SpeciesIcon from '../../components/ui/SpeciesIcon'
import GroomingForm from './GroomingForm'
import { formatDate, formatCurrency } from '../../utils/helpers'

export default function GroomingPage() {
  const { grooming, pets, owners } = useApp()
  const [search, setSearch]   = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing]  = useState(null)
  const [deleting, setDeleting] = useState(null)

  const filtered = useMemo(() =>
    grooming.items
      .filter(g => {
        const pet   = pets.find(g.petId)
        const owner = owners.find(g.ownerId)
        const str   = `${pet?.name || ''} ${owner?.name || ''} ${(g.services || []).join(' ')} ${g.observations || ''}`.toLowerCase()
        return str.includes(search.toLowerCase())
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [grooming.items, search, pets, owners]
  )

  const handleSave   = (data) => { if (editing) grooming.update(editing.id, data); else grooming.add(data); setEditing(null) }
  const handleDelete = () => { grooming.remove(deleting.id); setDeleting(null) }

  const whatsappUrl = (phone) => `https://wa.me/${phone.replace(/\D/g, '')}`

  return (
    <>
      <Header
        title="Peluquería"
        subtitle={`${grooming.items.length} servicio${grooming.items.length !== 1 ? 's' : ''} registrado${grooming.items.length !== 1 ? 's' : ''}`}
      />
      <div className="page">
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-wrap" style={{ flex: 1, minWidth: 200, maxWidth: 360 }}>
            <span className="search-icon"><Search size={18} strokeWidth={2} /></span>
            <input
              className="form-input"
              placeholder="Buscar mascota, dueño, servicio..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn--primary" style={{ marginLeft: 'auto' }} onClick={() => { setEditing(null); setFormOpen(true) }}>
            + Nuevo turno
          </button>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Scissors size={48} strokeWidth={1.25} />}
            title="Sin servicios de peluquería"
            text="No hay registros con estos filtros."
            action={<button className="btn btn--primary" onClick={() => setFormOpen(true)}>+ Nuevo turno</button>}
          />
        ) : (
          <div className="card card--no-hover">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Mascota</th>
                    <th>Dueño</th>
                    <th>Fecha</th>
                    <th>Servicios</th>
                    <th>Precio</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(g => {
                    const pet   = pets.find(g.petId)
                    const owner = owners.find(g.ownerId)
                    return (
                      <tr key={g.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: 'var(--r-sm)',
                              background: 'rgba(0,122,255,0.1)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: 'var(--blue)', flexShrink: 0,
                            }}>
                              <SpeciesIcon species={pet?.species} size={16} strokeWidth={1.5} />
                            </div>
                            <span style={{ fontWeight: 600 }}>{pet?.name || '—'}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ color: 'var(--text-secondary)' }}>{owner?.name || '—'}</span>
                            {owner?.phone && (
                              <>
                                <span style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>{owner.phone}</span>
                                <a
                                  href={whatsappUrl(owner.phone)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn--subtle btn--icon"
                                  style={{ color: '#25D366', padding: '2px 4px', lineHeight: 1 }}
                                  title="Enviar WhatsApp"
                                >
                                  <MessageCircle size={16} strokeWidth={2} />
                                </a>
                              </>
                            )}
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{formatDate(g.date)}</td>
                        <td>
                          {(g.services || []).length === 0
                            ? <span style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>—</span>
                            : (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {g.services.map(s => (
                                  <span key={s} style={{
                                    fontSize: 11, padding: '2px 7px',
                                    background: 'var(--bg-input)',
                                    borderRadius: 'var(--r-full)',
                                  }}>{s}</span>
                                ))}
                              </div>
                            )
                          }
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--vet-teal)' }}>
                          {g.price > 0 ? formatCurrency(g.price) : '—'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn--subtle btn--icon" onClick={() => { setEditing(g); setFormOpen(true) }}>
                              <Pencil size={18} strokeWidth={2} />
                            </button>
                            <button className="btn btn--subtle btn--icon" onClick={() => setDeleting(g)}>
                              <Trash2 size={18} strokeWidth={2} />
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

      <GroomingForm
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null) }}
        onSave={handleSave}
        initial={editing}
      />

      <Modal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title="Eliminar servicio"
        size="sm"
        footer={
          <>
            <button className="btn btn--ghost" onClick={() => setDeleting(null)}>Cancelar</button>
            <button className="btn btn--danger" onClick={handleDelete}>Eliminar</button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)' }}>
          ¿Eliminar el servicio de peluquería de <strong>{pets.find(deleting?.petId)?.name}</strong>?
        </p>
      </Modal>
    </>
  )
}
