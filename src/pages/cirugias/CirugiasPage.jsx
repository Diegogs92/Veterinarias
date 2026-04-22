import { useState, useMemo } from 'react'
import { Search, Pencil, Trash2, Syringe } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import Header from '../../components/layout/Header'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import SpeciesIcon from '../../components/ui/SpeciesIcon'
import CirugiasForm from './CirugiasForm'
import { formatDate, formatCurrency } from '../../utils/helpers'

export default function CirugiasPage() {
  const { cirugias, pets, owners } = useApp()
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const filtered = useMemo(() =>
    cirugias.items
      .filter(c => {
        const pet = pets.find(c.petId)
        const owner = owners.find(c.ownerId)
        const str = `${pet?.name || ''} ${owner?.name || ''} ${c.diagnostico || ''} ${c.observaciones || ''}`.toLowerCase()
        return str.includes(search.toLowerCase())
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [cirugias.items, search, pets, owners]
  )

  const handleSave = (data) => {
    if (editing) cirugias.update(editing.id, data)
    else cirugias.add(data)
    setEditing(null)
  }

  const handleDelete = () => { cirugias.remove(deleting.id); setDeleting(null) }

  return (
    <>
      <Header
        title="Cirugía"
        subtitle={`${cirugias.items.length} cirugía${cirugias.items.length !== 1 ? 's' : ''} registrada${cirugias.items.length !== 1 ? 's' : ''}`}
        actions={
          <button className="btn btn--primary" onClick={() => { setEditing(null); setFormOpen(true) }}>
            + Nueva cirugía
          </button>
        }
      />
      <div className="page">
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-wrap" style={{ flex: 1, minWidth: 200, maxWidth: 360 }}>
            <span className="search-icon"><Search size={14} strokeWidth={2} /></span>
            <input
              className="form-input"
              placeholder="Buscar mascota, dueño, diagnóstico..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Syringe size={48} strokeWidth={1.25} />}
            title="Sin cirugías registradas"
            text="No hay registros con estos filtros."
            action={<button className="btn btn--primary" onClick={() => setFormOpen(true)}>+ Nueva cirugía</button>}
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
                    <th>Diagnóstico</th>
                    <th>Costos</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => {
                    const pet = pets.find(c.petId)
                    const owner = owners.find(c.ownerId)
                    return (
                      <tr key={c.id}>
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
                        <td style={{ color: 'var(--text-secondary)' }}>{owner?.name || '—'}</td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{formatDate(c.date)}</td>
                        <td style={{ maxWidth: 260 }}>
                          <span style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            fontSize: 13,
                          }}>
                            {c.diagnostico || '—'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--vet-teal)' }}>
                          {c.costos > 0 ? formatCurrency(c.costos) : '—'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn--subtle btn--icon" onClick={() => { setEditing(c); setFormOpen(true) }}>
                              <Pencil size={16} strokeWidth={2} />
                            </button>
                            <button className="btn btn--subtle btn--icon" onClick={() => setDeleting(c)}>
                              <Trash2 size={16} strokeWidth={2} />
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

      <CirugiasForm
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null) }}
        onSave={handleSave}
        initial={editing}
      />

      <Modal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title="Eliminar cirugía"
        size="sm"
        footer={
          <>
            <button className="btn btn--ghost" onClick={() => setDeleting(null)}>Cancelar</button>
            <button className="btn btn--danger" onClick={handleDelete}>Eliminar</button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)' }}>
          ¿Eliminar la cirugía de <strong>{pets.find(deleting?.petId)?.name}</strong>?
        </p>
      </Modal>
    </>
  )
}
