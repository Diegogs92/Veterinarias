import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Pencil, Trash2, Stethoscope, ChevronDown, ChevronUp } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import Header from '../../components/layout/Header'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import SpeciesIcon from '../../components/ui/SpeciesIcon'
import ConsultationForm from './ConsultationForm'
import { formatDate } from '../../utils/helpers'

export default function ConsultationsPage() {
  const { consultations, pets, owners } = useApp()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [petFilter, setPetFilter] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [expanding, setExpanding] = useState(null)

  const filtered = useMemo(() =>
    consultations.items
      .filter(c => {
        const pet = pets.find(c.petId)
        const owner = owners.find(pet?.ownerId)
        const str = `${pet?.name || ''} ${owner?.name || ''} ${c.reason} ${c.diagnosis}`.toLowerCase()
        return str.includes(search.toLowerCase()) && (!petFilter || c.petId === petFilter)
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [consultations.items, search, petFilter, pets, owners]
  )

  const handleSave = (data) => {
    if (editing) consultations.update(editing.id, data)
    else consultations.add(data)
    setEditing(null)
  }

  const handleDelete = () => { consultations.remove(deleting.id); setDeleting(null) }

  return (
    <>
      <Header
        title="Historial Clínico"
        subtitle={`${consultations.items.length} consultas registradas`}
        actions={
          <button className="btn btn--primary" onClick={() => { setEditing(null); setFormOpen(true) }}>
            + Nueva consulta
          </button>
        }
      />
      <div className="page">
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div className="search-wrap" style={{ flex: 1, minWidth: 200, maxWidth: 360 }}>
            <span className="search-icon"><Search size={14} strokeWidth={2} /></span>
            <input
              className="form-input"
              placeholder="Buscar por mascota, motivo, diagnóstico..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="form-input" style={{ width: 220 }} value={petFilter} onChange={e => setPetFilter(e.target.value)}>
            <option value="">Todas las mascotas</option>
            {pets.items.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Stethoscope size={48} strokeWidth={1.25} />}
            title="Sin consultas"
            text="No hay consultas registradas."
            action={<button className="btn btn--primary" onClick={() => setFormOpen(true)}>+ Nueva consulta</button>}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(c => {
              const pet = pets.find(c.petId)
              const owner = owners.find(pet?.ownerId)
              const isExpanded = expanding === c.id
              return (
                <div key={c.id} className="card card--no-hover">
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', cursor: 'pointer' }}
                    onClick={() => setExpanding(isExpanded ? null : c.id)}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: 'var(--r-md)',
                      background: 'rgba(0,122,255,0.10)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--blue)', flexShrink: 0,
                    }}>
                      <SpeciesIcon species={pet?.species} size={20} strokeWidth={1.5} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>{pet?.name || '—'}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>·</span>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{owner?.name || '—'}</span>
                      </div>
                      <div style={{ fontSize: 14, marginTop: 2 }}>{c.reason}</div>
                      {c.diagnosis && !isExpanded && (
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 1 }} className="truncate">
                          Dx: {c.diagnosis}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{formatDate(c.date)}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 3, display: 'flex', justifyContent: 'flex-end' }}>
                          {isExpanded ? <ChevronUp size={14} strokeWidth={2} /> : <ChevronDown size={14} strokeWidth={2} />}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                      <button className="btn btn--subtle btn--sm btn--icon" onClick={() => { setEditing(c); setFormOpen(true) }}>
                        <Pencil size={14} strokeWidth={2} />
                      </button>
                      <button className="btn btn--subtle btn--sm btn--icon" onClick={() => setDeleting(c)}>
                        <Trash2 size={14} strokeWidth={2} />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ padding: '0 20px 16px', borderTop: '1px solid var(--border)' }}>
                      <div className="detail-grid" style={{ marginTop: 12 }}>
                        {c.diagnosis && <div className="detail-item"><div className="detail-item__label">Diagnóstico</div><div className="detail-item__value" style={{ fontSize: 14 }}>{c.diagnosis}</div></div>}
                        {c.treatment && <div className="detail-item"><div className="detail-item__label">Tratamiento</div><div className="detail-item__value" style={{ fontSize: 14 }}>{c.treatment}</div></div>}
                        {c.medication && <div className="detail-item" style={{ gridColumn: '1 / -1' }}><div className="detail-item__label">Medicación</div><div className="detail-item__value" style={{ fontSize: 14 }}>{c.medication}</div></div>}
                        {c.observations && <div className="detail-item" style={{ gridColumn: '1 / -1' }}><div className="detail-item__label">Observaciones</div><div className="detail-item__value" style={{ fontSize: 14 }}>{c.observations}</div></div>}
                      </div>
                      <button className="btn btn--subtle btn--sm" style={{ marginTop: 12 }} onClick={() => navigate(`/pets/${c.petId}`)}>
                        Ver ficha de {pet?.name}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <ConsultationForm
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null) }}
        onSave={handleSave}
        initial={editing}
      />

      <Modal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title="Eliminar consulta"
        size="sm"
        footer={
          <>
            <button className="btn btn--ghost" onClick={() => setDeleting(null)}>Cancelar</button>
            <button className="btn btn--danger" onClick={handleDelete}>Eliminar</button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)' }}>¿Eliminar la consulta del {formatDate(deleting?.date)}?</p>
      </Modal>
    </>
  )
}
