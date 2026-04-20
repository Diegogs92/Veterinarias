import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Pencil, Trash2, Stethoscope, Home, Building2, ChevronDown, ChevronUp, Pill, ScanLine } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import Header from '../../components/layout/Header'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import SpeciesIcon from '../../components/ui/SpeciesIcon'
import ConsultaForm from './ConsultaForm'
import { formatDate, formatCurrency } from '../../utils/helpers'

export default function ConsultasPage() {
  const { consultas, pets, owners, syncDebt } = useApp()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [expanded, setExpanded] = useState(null)

  const filtered = useMemo(() =>
    consultas.items
      .filter(c => {
        const pet = pets.find(c.petId)
        const owner = owners.find(c.ownerId)
        const str = `${pet?.name || ''} ${owner?.name || ''} ${c.reason} ${c.diagnosis || ''}`.toLowerCase()
        return str.includes(search.toLowerCase()) &&
          (typeFilter === 'all' || c.type === typeFilter)
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [consultas.items, search, typeFilter, pets, owners]
  )

  const handleSave = (data) => {
    let savedId
    if (editing) {
      consultas.update(editing.id, data)
      savedId = editing.id
    } else {
      const created = consultas.add(data)
      savedId = created.id
    }
    if (data.price > 0) {
      const pet = pets.find(data.petId)
      if (pet?.ownerId) syncDebt('consulta', savedId, pet.ownerId, data.price, data.paymentStatus === 'paid' ? data.price : 0)
    }
    setEditing(null)
  }

  const handleDelete = () => {
    if (deleting.price > 0) {
      const pet = pets.find(deleting.petId)
      if (pet?.ownerId) syncDebt('consulta', deleting.id, pet.ownerId, deleting.price, deleting.price)
    }
    consultas.remove(deleting.id)
    setDeleting(null)
  }

  return (
    <>
      <Header
        title="Consultas"
        subtitle={`${consultas.items.length} consulta${consultas.items.length !== 1 ? 's' : ''} registrada${consultas.items.length !== 1 ? 's' : ''}`}
        actions={
          <button className="btn btn--primary" onClick={() => { setEditing(null); setFormOpen(true) }}>
            + Nueva consulta
          </button>
        }
      />
      <div className="page">
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-wrap" style={{ flex: 1, minWidth: 200, maxWidth: 360 }}>
            <span className="search-icon"><Search size={14} strokeWidth={2} /></span>
            <input
              className="form-input"
              placeholder="Buscar mascota, dueño, motivo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="tabs" style={{ flexShrink: 0 }}>
            {[
              { value: 'all',         label: 'Todas' },
              { value: 'consultorio', label: 'Consultorio' },
              { value: 'domicilio',   label: 'Domicilio' },
            ].map(t => (
              <button key={t.value} className={`tab${typeFilter === t.value ? ' active' : ''}`} onClick={() => setTypeFilter(t.value)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Stethoscope size={48} strokeWidth={1.25} />}
            title="Sin consultas"
            text="No hay consultas registradas con estos filtros."
            action={<button className="btn btn--primary" onClick={() => setFormOpen(true)}>+ Nueva consulta</button>}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(c => {
              const pet = pets.find(c.petId)
              const owner = owners.find(c.ownerId)
              const isExpanded = expanded === c.id
              const isDomicilio = c.type === 'domicilio'

              return (
                <div key={c.id} className="card card--no-hover">
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', cursor: 'pointer' }}
                    onClick={() => setExpanded(isExpanded ? null : c.id)}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: 'var(--r-md)', flexShrink: 0,
                      background: isDomicilio ? 'rgba(255,159,10,0.10)' : 'rgba(0,122,255,0.10)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isDomicilio ? 'var(--orange)' : 'var(--blue)',
                    }}>
                      <SpeciesIcon species={pet?.species} size={20} strokeWidth={1.5} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
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

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Badge color={isDomicilio ? 'orange' : 'blue'}>
                          {isDomicilio
                            ? <><Home size={11} strokeWidth={2} style={{ marginRight: 3 }} />Domicilio</>
                            : <><Building2 size={11} strokeWidth={2} style={{ marginRight: 3 }} />Consultorio</>
                          }
                        </Badge>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{formatDate(c.date)}</div>
                      {c.price > 0 && (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--vet-teal)' }}>{formatCurrency(c.price)}</span>
                          <Badge color={c.paymentStatus === 'paid' ? 'green' : c.paymentStatus === 'partial' ? 'orange' : 'red'} dot>
                            {c.paymentStatus === 'paid' ? 'Pagado' : c.paymentStatus === 'partial' ? 'Parcial' : 'Pendiente'}
                          </Badge>
                        </div>
                      )}
                      <div style={{ color: 'var(--text-tertiary)' }}>
                        {isExpanded ? <ChevronUp size={14} strokeWidth={2} /> : <ChevronDown size={14} strokeWidth={2} />}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                      <button className="btn btn--subtle btn--sm btn--icon" onClick={() => { setEditing(c); setFormOpen(true) }}>
                        <Pencil size={16} strokeWidth={2} />
                      </button>
                      <button className="btn btn--subtle btn--sm btn--icon" onClick={() => setDeleting(c)}>
                        <Trash2 size={16} strokeWidth={2} />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ padding: '0 20px 16px', borderTop: '1px solid var(--border)' }}>
                      <div className="detail-grid" style={{ marginTop: 12 }}>
                        {c.diagnosis && (
                          <div className="detail-item">
                            <div className="detail-item__label">Diagnóstico</div>
                            <div className="detail-item__value" style={{ fontSize: 14 }}>{c.diagnosis}</div>
                          </div>
                        )}
                        {c.treatment && (
                          <div className="detail-item">
                            <div className="detail-item__label">Tratamiento</div>
                            <div className="detail-item__value" style={{ fontSize: 14 }}>{c.treatment}</div>
                          </div>
                        )}

                        {c.type === 'consultorio' && c.medicationsProvided && (
                          <div className="detail-item" style={{ gridColumn: '1/-1' }}>
                            <div className="detail-item__label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Pill size={12} strokeWidth={2} /> Medicamentos proporcionados
                            </div>
                            <div className="detail-item__value" style={{ fontSize: 14 }}>
                              {c.medicationsDetail || 'Sí (sin detalle)'}
                            </div>
                          </div>
                        )}

                        {c.type === 'consultorio' && c.xrays && (
                          <div className="detail-item" style={{ gridColumn: '1/-1' }}>
                            <div className="detail-item__label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <ScanLine size={12} strokeWidth={2} /> Radiografías realizadas
                            </div>
                            <div className="detail-item__value" style={{ fontSize: 14 }}>
                              {c.xraysNotes || 'Sí (sin detalle)'}
                            </div>
                          </div>
                        )}

                        {c.type === 'domicilio' && c.address && (
                          <div className="detail-item" style={{ gridColumn: '1/-1' }}>
                            <div className="detail-item__label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Home size={12} strokeWidth={2} /> Dirección de atención
                            </div>
                            <div className="detail-item__value" style={{ fontSize: 14 }}>{c.address}</div>
                          </div>
                        )}
                      </div>

                      <button
                        className="btn btn--subtle btn--sm"
                        style={{ marginTop: 12 }}
                        onClick={() => navigate(`/pets/${c.petId}`)}
                      >
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

      <ConsultaForm
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
        <p style={{ color: 'var(--text-secondary)' }}>
          ¿Eliminar la consulta del {formatDate(deleting?.date)} de <strong>{pets.find(deleting?.petId)?.name}</strong>?
        </p>
      </Modal>
    </>
  )
}
